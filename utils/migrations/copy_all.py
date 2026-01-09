import os, time, json, boto3
from itertools import islice
from boto3.dynamodb.conditions import Key

TABLE_NAME = os.environ.get("TABLE_NAME", "ApexEntity-5jcwvxujrfbo3hrhevdplmyhsi-NONE")

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


# --- helpers ---
def chunked(iterable, n=25):
    it = iter(iterable)
    while True:
        batch = list(islice(it, n))
        if not batch:
            return
        yield batch


def now_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


# 1) Build user -> [league_id] map from LEAGUE_MEMBER
def load_user_leagues():
    leagues_by_user = {}
    index = "apexEntitiesByUser_idAndCreatedAt"  # PK=user_id
    # We don't know all users, so scan the index is safest. If you track user_id keys, iterate them instead.
    resp = table.scan(
        IndexName=index,
        FilterExpression="#et = :lm",
        ExpressionAttributeNames={"#et": "entityType"},
        ExpressionAttributeValues={":lm": "LEAGUE_MEMBER"},
    )
    items = resp.get("Items", [])
    while "LastEvaluatedKey" in resp:
        resp = table.scan(
            IndexName=index,
            FilterExpression="#et = :lm",
            ExpressionAttributeNames={"#et": "entityType"},
            ExpressionAttributeValues={":lm": "LEAGUE_MEMBER"},
            ExclusiveStartKey=resp["LastEvaluatedKey"],
        )
        items.extend(resp.get("Items", []))

    for it in items:
        uid = it["user_id"]
        lid = it["league_id"]
        leagues_by_user.setdefault(uid, set()).add(lid)
    return leagues_by_user


# 2) Iterate PREDICTION and LEADERBOARD from apexEntitiesByEntityTypeAndCreatedAt
def load_by_entity_type(entity_type):
    index = "apexEntitiesByEntityTypeAndCreatedAt"  # PK=entityType
    items = []
    resp = table.query(
        IndexName=index, KeyConditionExpression=Key("entityType").eq(entity_type)
    )
    items.extend(resp.get("Items", []))
    while "LastEvaluatedKey" in resp:
        resp = table.query(
            IndexName=index,
            KeyConditionExpression=Key("entityType").eq(entity_type),
            ExclusiveStartKey=resp["LastEvaluatedKey"],
        )
        items.extend(resp.get("Items", []))
    return items


def build_league_pk_leaderboard(src, league_id):
    # existing example: "user#{user_id}#season#2025"
    base = f"user#{src['user_id']}"
    if "season" in src and src["season"]:
        base += f"#season#{src['season']}"
    return f"{base}#league#{league_id}"


def build_league_pk_prediction(src, league_id):
    # existing example: "prediction#{user_id}#{race_id}"
    try:
        race_id = src["race_id"]
    except KeyError:
        print(src)
        # Handle missing race_id - use a default or raise with more context
        print(
            f"Missing 'race_id' in prediction item. Available keys: {list(src.keys())}"
        )
    return f"prediction#{src['user_id']}#{race_id}#league#{league_id}"


def clone_item_for_league(src, league_id, kind):
    # common fields to carry over
    clone = dict(src)  # shallow copy
    clone["league_id"] = league_id
    clone["createdAt"] = clone.get("createdAt") or now_iso()
    clone["updatedAt"] = now_iso()

    if kind == "LEADERBOARD":
        # copy to league-specific leaderboard
        clone["PK"] = build_league_pk_leaderboard(src, league_id)
        clone["SK"] = "TOTALPOINTS"  # per schema card
        clone["entityType"] = (
            "LEAGUE_LEADERBOARD"  # ✅ new entity type for league scope
        )

        # Optionally reset or preserve points
        if "points" in src:
            clone["points"] = src["points"]
        else:
            clone["points"] = 0

    elif kind == "PREDICTION":
        clone["PK"] = build_league_pk_prediction(src, league_id)
        clone["SK"] = "RACEPREDICTION"
        clone["entityType"] = "LEAGUE_PREDICTION"
        clone["points"] = src.get("points", 0)

    else:
        raise ValueError("Unsupported kind")

    return clone


def write_batches(items):
    for batch in chunked(items, 25):
        with table.batch_writer(overwrite_by_pkeys=["PK", "SK"]) as bw:
            for it in batch:
                bw.put_item(Item=it)


def main():
    leagues_by_user = load_user_leagues()

    # fanout predictions
    predictions = load_by_entity_type("PREDICTION")
    to_write = []
    for p in predictions:
        u = p["user_id"]
        for lid in leagues_by_user.get(u, []):
            to_write.append(clone_item_for_league(p, lid, "PREDICTION"))
    write_batches(to_write)

    # fanout leaderboards
    leaderboards = load_by_entity_type("LEADERBOARD")
    to_write = []
    for lb in leaderboards:
        u = lb["user_id"]
        for lid in leagues_by_user.get(u, []):
            to_write.append(clone_item_for_league(lb, lid, "LEADERBOARD"))
    write_batches(to_write)


if __name__ == "__main__":
    main()

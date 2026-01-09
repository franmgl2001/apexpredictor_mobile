import time
import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME = "ApexEntity-5jcwvxujrfbo3hrhevdplmyhsi-NONE"

SEASON_FROM = "2025"
SEASON_TO = "2026"
SK_TARGET = "TOTALPOINTS"

# GSI (from your schema): PK=season, SK=null
GSI_SEASON = "apexEntitiesBySeason"

ddb = boto3.resource("dynamodb")
table = ddb.Table(TABLE_NAME)


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def swap_season_in_pk(pk: str) -> str:
    needle = f"#season#{SEASON_FROM}"
    repl = f"#season#{SEASON_TO}"
    if needle not in pk:
        raise ValueError(f"PK missing season segment '{needle}': {pk}")
    return pk.replace(needle, repl, 1)


def make_2026_copy(item: dict) -> dict:
    new_item = dict(item)

    # Keys
    new_item["PK"] = swap_season_in_pk(item["PK"])
    new_item["SK"] = item["SK"]  # should be TOTALPOINTS

    # Only variable changes you requested
    new_item["season"] = SEASON_TO
    new_item["points"] = 0

    # Keep other attributes the same; update timestamps (recommended)
    ts = now_iso()
    new_item["createdAt"] = ts
    new_item["updatedAt"] = ts

    return new_item


def iter_totalpoints_2025():
    """
    Pull all season=2025 items via GSI, then filter to SK=TOTALPOINTS in code.
    (Because your GSI apexEntitiesBySeason has only PK=season, no SK to filter on.)
    """
    last_key = None
    while True:
        kwargs = {
            "IndexName": GSI_SEASON,
            "KeyConditionExpression": Key("season").eq(SEASON_FROM),
        }
        if last_key:
            kwargs["ExclusiveStartKey"] = last_key

        resp = table.query(**kwargs)
        for it in resp.get("Items", []):
            if it.get("SK") == SK_TARGET:
                yield it

        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break


def main():
    read_n = 0
    written_n = 0
    skipped_exists_n = 0

    for item in iter_totalpoints_2025():
        read_n += 1
        new_item = make_2026_copy(item)

        try:
            # don't overwrite if the 2026 record already exists
            table.put_item(
                Item=new_item,
                ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)",
            )
            written_n += 1
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            skipped_exists_n += 1

    print(f"Read TOTALPOINTS 2025: {read_n}")
    print(f"Created TOTALPOINTS 2026: {written_n}")
    print(f"Skipped (already existed): {skipped_exists_n}")


if __name__ == "__main__":
    main()

import boto3
from boto3.dynamodb.conditions import Key
from datetime import datetime, timezone

TABLE_NAME = ""
GSI_ENTITYTYPE_CREATEDAT = "apexEntitiesByEntityTypeAndCreatedAt"

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def page_query(**kwargs):
    """Simple paginator for Query."""
    items = []
    resp = table.query(**kwargs)
    items.extend(resp.get("Items", []))
    while "LastEvaluatedKey" in resp:
        kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]
        resp = table.query(**kwargs)
        items.extend(resp.get("Items", []))
    return items


def load_leagues():
    # entityType = LEAGUE on GSI -> ALL projection gives league_id & league_name
    return page_query(
        IndexName=GSI_ENTITYTYPE_CREATEDAT,
        KeyConditionExpression=Key("entityType").eq("LEAGUE"),
    )


def load_league_members():
    # entityType = LEAGUE_MEMBER on GSI -> ALL projection gives PK, SK, league_id, user_id, etc.
    return page_query(
        IndexName=GSI_ENTITYTYPE_CREATEDAT,
        KeyConditionExpression=Key("entityType").eq("LEAGUE_MEMBER"),
    )


def main():
    # 1) Build {league_id: league_name}
    leagues = load_leagues()
    league_name_by_id = {}
    for lg in leagues:
        lid = lg.get("league_id")
        lname = lg.get("league_name")  # source of truth on the LEAGUE item
        if lid and lname:
            league_name_by_id[lid] = lname

    # 2) Backfill each member
    members = load_league_members()
    now = datetime.now(timezone.utc).isoformat()

    updated = skipped_no_league = skipped_no_name = 0
    for m in members:
        lid = m.get("league_id")
        if not lid:
            skipped_no_league += 1
            continue
        lname = league_name_by_id.get(lid)
        if not lname:
            # league missing or has no league_name
            skipped_no_name += 1
            continue

        # Base keys for LEAGUE_MEMBER come from the item itself (projection=ALL includes PK/SK)
        pk = m["PK"]  # e.g., "league#<league_id>"
        sk = m["SK"]  # e.g., "member#<user_id>"

        # Write denormalized attribute (NOTE: attribute not defined in cards)
        table.update_item(
            Key={"PK": pk, "SK": sk},
            UpdateExpression="SET league_name = :n, updatedAt = :u",
            ExpressionAttributeValues={":n": lname, ":u": now},
        )
        updated += 1

    print(
        f"Updated: {updated}; skipped (no league_id): {skipped_no_league}; skipped (no league_name in LEAGUE): {skipped_no_name}"
    )


if __name__ == "__main__":
    main()

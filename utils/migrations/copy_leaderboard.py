# copy_leaderboard.py
import os
from datetime import datetime, timezone
import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME = ""
GSI_BY_SEASON = "apexEntitiesBySeason"  # PK=season (projection ALL)

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

ISO = "%Y-%m-%dT%H:%M:%S.%fZ"
now = lambda: datetime.now(timezone.utc).strftime(ISO)


def list_leaderboards_for_season(source_season):
    # Canonical: LEADERBOARD is indexed by season (apexEntitiesBySeason)
    resp = table.query(
        IndexName=GSI_BY_SEASON, KeyConditionExpression=Key("season").eq(source_season)
    )
    # Filter to entityType=LEADERBOARD to avoid DRIVER/RACE/etc that also carry season
    return [i for i in resp.get("Items", []) if i.get("entityType") == "LEADERBOARD"]


def put_leaderboard_clone(it, target_season, clone_points=False):
    # LEADERBOARD keys:
    # PK pattern (example in card): user#{user_id}#season#{season}
    # SK: TOTALPOINTS
    user_id = it["user_id"]
    username = it["username"]
    created = now()

    new_pk = f"user#{user_id}#season#{target_season}"
    put = {
        "PK": new_pk,
        "SK": "TOTALPOINTS",
        "__typename": "ApexEntity",
        "entityType": "LEADERBOARD",
        "user_id": user_id,
        "username": username,
        "season": target_season,  # optional on card, provided in examples
        "points": it["points"] if clone_points else 0,
        "races": it.get("races", 0) if clone_points else 0,
        "createdAt": created,
        "updatedAt": created,
    }

    table.put_item(
        Item=put,
        ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)",
    )


def main():
    source_season = os.getenv("SOURCE_SEASON")  # e.g., "2024"
    target_season = os.getenv("TARGET_SEASON")  # e.g., "2025"
    clone_points = os.getenv("CLONE_POINTS", "false").lower() == "true"

    assert (
        source_season and target_season
    ), "Set SOURCE_SEASON and TARGET_SEASON env vars"

    rows = list_leaderboards_for_season(source_season)
    print(f"Found {len(rows)} LEADERBOARD row(s) in season={source_season}")

    copied = 0
    for it in rows:
        try:
            put_leaderboard_clone(it, target_season, clone_points=clone_points)
            copied += 1
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            pass

    print(f"Copied {copied} → season={target_season} (clone_points={clone_points})")


if __name__ == "__main__":
    main()

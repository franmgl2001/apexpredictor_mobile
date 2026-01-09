#!/usr/bin/env python3
import argparse
import datetime
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError


def sum_user_prediction_points(table, user_id: str, season: str) -> tuple[int, int]:
    """
    Sum points from all PREDICTION items for a given user and season.
    Returns (total_points, races_count).

    Uses GSI: apexEntitiesByUser_idAndCreatedAt
      - PK: user_id
      - SK: createdAt
      - PROJECTION: ALL

    Filters:
      - entityType = "PREDICTION"
      - season = <season> (Note: logic for season filtering relies on application context or item attributes)
    """

    index_name = "apexEntitiesByUser_idAndCreatedAt"

    total_points = 0
    races_count = 0
    last_evaluated_key = None

    while True:
        query_kwargs = {
            "IndexName": index_name,
            "KeyConditionExpression": Key("user_id").eq(user_id),
            "FilterExpression": Attr("entityType").eq("PREDICTION"),
        }
        if last_evaluated_key:
            query_kwargs["ExclusiveStartKey"] = last_evaluated_key

        resp = table.query(**query_kwargs)
        # print(resp)

        for item in resp.get("Items", []):
            # 'points' is optional on PREDICTION; treat missing as 0
            raw_points = item.get("points", 0)
            if isinstance(raw_points, Decimal):
                total_points += int(raw_points)
            else:
                total_points += int(raw_points)
            races_count += 1

        last_evaluated_key = resp.get("LastEvaluatedKey")
        if not last_evaluated_key:
            break

    return total_points, races_count


def update_leaderboard_total_points(
    table, user_id: str, season: str, total_points: int, races_count: int
):
    """
    Update the LEADERBOARD TOTALPOINTS item for user/season.

    LEADERBOARD schema card:
      - PK pattern: user#{...}
      - SK pattern: TOTALPOINTS
    Example:
      PK: "user#<user_id>#season#2025"
      SK: "TOTALPOINTS"
    """
    pk = f"user#{user_id}#season#{season}"
    sk = "TOTALPOINTS"

    now_iso = datetime.datetime.utcnow().isoformat() + "Z"

    try:
        table.update_item(
            Key={
                "PK": pk,
                "SK": sk,
            },
            ConditionExpression=Attr("entityType").eq("LEADERBOARD"),
            UpdateExpression="SET points = :points, races = :races, updatedAt = :updatedAt",
            ExpressionAttributeValues={
                ":points": Decimal(total_points),
                ":races": Decimal(races_count),
                ":updatedAt": now_iso,
            },
            ReturnValues="UPDATED_NEW",
        )
        print(
            f"Updated LEADERBOARD {pk} {sk} to points={total_points}, races={races_count}"
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            print(f"SKIPPED (not a LEADERBOARD item): PK={pk}, SK={sk}")
        else:
            raise


def list_leaderboard_users_for_season(table, season: str):
    """
    Return all LEADERBOARD items for a given season.

    Uses GSI: apexEntitiesBySeason
      - PK: season
      - SK: null
      - PROJECTION: ALL

    Filters to entityType = 'LEADERBOARD'.
    """
    index_name = "apexEntitiesBySeason"
    items = []

    last_evaluated_key = None

    while True:
        query_kwargs = {
            "IndexName": index_name,
            "KeyConditionExpression": Key("season").eq(season),
            "FilterExpression": Attr("entityType").eq("LEADERBOARD"),
        }
        if last_evaluated_key:
            query_kwargs["ExclusiveStartKey"] = last_evaluated_key

        resp = table.query(**query_kwargs)
        items.extend(resp.get("Items", []))

        last_evaluated_key = resp.get("LastEvaluatedKey")
        if not last_evaluated_key:
            break

    return items


def main():
    parser = argparse.ArgumentParser(
        description="Recompute LEADERBOARD TOTALPOINTS from PREDICTION items for ALL users in a season."
    )
    parser.add_argument("--table-name", required=True, help="DynamoDB table name")
    parser.add_argument("--season", required=True, help="season string, e.g. '2025'")

    args = parser.parse_args()

    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(args.table_name)

    # 1) Fetch all LEADERBOARD items for this season
    leaderboard_items = list_leaderboard_users_for_season(table, args.season)
    print(f"Found {len(leaderboard_items)} LEADERBOARD items for season {args.season}")

    # 2) For each leaderboard row, recompute and update
    for lb in leaderboard_items:
        user_id = lb["user_id"]
        print(f"\nProcessing user_id={user_id} season={args.season}...")

        total_points, races_count = sum_user_prediction_points(
            table, user_id, args.season
        )
        print(
            f"  Computed total prediction points: {total_points}, races: {races_count}"
        )

        update_leaderboard_total_points(
            table, user_id, args.season, total_points, races_count
        )


if __name__ == "__main__":
    main()

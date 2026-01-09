#!/usr/bin/env python3
import argparse
import datetime
import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError


def list_all_leaderboard_totalpoints(table):
    """
    List all LEADERBOARD TOTALPOINTS rows using GSI apexEntitiesByEntityTypeAndCreatedAt.

    GSI:
      PK = entityType
      SK = createdAt
      PROJECTION = ALL
    """
    index_name = "apexEntitiesByEntityTypeAndCreatedAt"

    items = []
    last_evaluated_key = None

    while True:
        query_kwargs = {
            "IndexName": index_name,
            "KeyConditionExpression": Key("entityType").eq("LEADERBOARD"),
            "FilterExpression": Attr("SK").eq("TOTALPOINTS"),  # ensure only TOTALPOINTS
        }

        if last_evaluated_key:
            query_kwargs["ExclusiveStartKey"] = last_evaluated_key

        resp = table.query(**query_kwargs)
        items.extend(resp.get("Items", []))

        last_evaluated_key = resp.get("LastEvaluatedKey")
        if not last_evaluated_key:
            break

    return items


def update_leaderboard_season(table, pk, sk, new_season):
    """
    Update the 'season' attribute on the main-table item (PK, SK).
    """
    now = datetime.datetime.utcnow().isoformat() + "Z"

    try:
        table.update_item(
            Key={
                "PK": pk,
                "SK": sk,
            },
            ConditionExpression=Attr("entityType").eq("LEADERBOARD"),
            UpdateExpression="SET season = :season, updatedAt = :updatedAt",
            ExpressionAttributeValues={
                ":season": new_season,
                ":updatedAt": now,
            },
            ReturnValues="UPDATED_NEW",
        )
        print(f"Updated {pk} {sk} -> season={new_season}")
    except ClientError as e:
        print("ERROR:", e)


def main():
    parser = argparse.ArgumentParser(
        description="Update ALL LEADERBOARD TOTALPOINTS rows' season attribute to a new value."
    )
    parser.add_argument("--table-name", required=True)
    parser.add_argument("--season", required=True, help="New season value, e.g. 2025")

    args = parser.parse_args()

    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(args.table_name)

    # 1) Fetch all leaderboard TOTALPOINTS rows
    rows = list_all_leaderboard_totalpoints(table)
    print(f"Found {len(rows)} TOTALPOINTS leaderboard rows")

    # 2) Update each one
    for item in rows:
        update_leaderboard_season(
            table,
            pk=item["PK"],
            sk=item["SK"],
            new_season=args.season,
        )


if __name__ == "__main__":
    main()

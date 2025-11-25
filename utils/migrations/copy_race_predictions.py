# copy_race_predictions.py
import os, json
from datetime import datetime, timezone
import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME = ""
GSI_BY_RACE = "apexEntitiesByRace_id"  # PK=race_id

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

ISO = "%Y-%m-%dT%H:%M:%S.%fZ"
now = lambda: datetime.now(timezone.utc).strftime(ISO)


def list_predictions_for_race(source_race_id):
    # Canonical: query PREDICTIONs by race via GSI
    # (apexEntitiesByRace_id: PK=race_id, PROJECTION=ALL)
    resp = table.query(
        IndexName=GSI_BY_RACE, KeyConditionExpression=Key("race_id").eq(source_race_id)
    )
    return resp.get("Items", [])


def put_prediction_clone(item, target_race_id, target_season=None, reset_points=True):
    # Required attrs for PREDICTION per card
    # PK pattern: prediction#{user_id}#{race_id}
    # SK: RACEPREDICTION
    user_id = item["user_id"]
    username = item["username"]
    league_id = item.get("league_id")  # not required but indexed if present
    predictions = item.get(
        "predictions",
        json.dumps(
            {"gridOrder": [], "sprintPositions": [], "additionalPredictions": {}}
        ),
    )
    season = target_season or item.get("season")
    created = now()
    put = {
        "PK": f"prediction#{user_id}#{target_race_id}",
        "SK": "RACEPREDICTION",
        "__typename": "ApexEntity",
        "entityType": "PREDICTION",
        "user_id": user_id,
        "username": username,
        "race_id": target_race_id,
        "predictions": predictions,
        "updatedAt": created,
        "createdAt": created,
    }
    if league_id is not None:
        put["league_id"] = league_id
    if season is not None:
        put["season"] = season
    if not reset_points and "points" in item:
        put["points"] = item["points"]
    else:
        put["points"] = 0
    if "points_earned" in item and not reset_points:
        put["points_earned"] = item["points_earned"]

    # Idempotency: don't overwrite if it already exists
    table.put_item(
        Item=put,
        ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)",
    )


def main():
    source_race_id = os.getenv("SOURCE_RACE_ID")  # e.g., "netherlands2025"
    target_race_id = os.getenv("TARGET_RACE_ID")  # e.g., "azerbaijan2025"
    target_season = os.getenv("TARGET_SEASON")  # optional override
    reset_points = os.getenv("RESET_POINTS", "true").lower() == "true"

    assert (
        source_race_id and target_race_id
    ), "Set SOURCE_RACE_ID and TARGET_RACE_ID env vars"

    preds = list_predictions_for_race(source_race_id)
    print(f"Found {len(preds)} PREDICTION(s) on race_id={source_race_id}")

    copied = 0
    for it in preds:
        try:
            put_prediction_clone(it, target_race_id, target_season, reset_points)
            copied += 1
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            # already exists; skip
            pass

    print(f"Copied {copied} → race_id={target_race_id}")


if __name__ == "__main__":
    main()

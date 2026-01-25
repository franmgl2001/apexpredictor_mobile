import json
import boto3
import os
from datetime import datetime
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB resource
dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("TABLE_NAME")


def get_padded_points(points):
    """
    Calculate padded points for GSI sorting: 1000000 - points, padded to 7 digits.
    This allows ascending sort on the SK to give descending points.
    """
    score = 1000000 - int(points)
    return str(score).zfill(7)


def calculate_driver_points(predictions, race_results, has_sprint=False):
    """
    Replicates the logic from mobile_app/src/utils/pointsCalculator.ts
    """
    driver_points_map = {}

    all_driver_numbers = set()
    for item in race_results.get("gridOrder", []):
        all_driver_numbers.add(item["driverNumber"])

    if has_sprint and race_results.get("sprintPositions"):
        for item in race_results.get("sprintPositions", []):
            all_driver_numbers.add(item["driverNumber"])

    for pred in predictions.get("gridOrder", []):
        if pred.get("driverNumber"):
            all_driver_numbers.add(pred["driverNumber"])

    if has_sprint and predictions.get("sprintPositions"):
        for pred in predictions.get("sprintPositions", []):
            if pred.get("driverNumber"):
                all_driver_numbers.add(pred["driverNumber"])

    for dn in all_driver_numbers:
        driver_points_map[dn] = {"points": 0, "breakdown": {}}

    # Grid position points: correct=10, miss by 1=5, miss by 2=2
    for pred in predictions.get("gridOrder", []):
        dn = pred.get("driverNumber")
        if dn is None:
            continue

        actual = next(
            (r for r in race_results.get("gridOrder", []) if r["driverNumber"] == dn),
            None,
        )
        if actual:
            diff = abs(actual["position"] - pred["position"])
            pts = 0
            if diff == 0:
                pts = 10
            elif diff == 1:
                pts = 5
            elif diff == 2:
                pts = 2

            driver_points_map[dn]["points"] += pts
            driver_points_map[dn]["breakdown"]["gridPosition"] = pts

    # Sprint points (same logic as grid position for F1)
    if (
        has_sprint
        and race_results.get("sprintPositions")
        and predictions.get("sprintPositions")
    ):
        for pred in predictions.get("sprintPositions", []):
            dn = pred.get("driverNumber")
            if not dn:
                continue

            actual_sprint = next(
                (
                    r
                    for r in race_results.get("sprintPositions", [])
                    if r["driverNumber"] == dn
                ),
                None,
            )
            if actual_sprint:
                diff = abs(actual_sprint["position"] - pred["position"])
                pts = 0
                if diff == 0:
                    pts = 10
                elif diff == 1:
                    pts = 5
                elif diff == 2:
                    pts = 2

                driver_points_map[dn]["points"] += pts
                driver_points_map[dn]["breakdown"]["sprintPosition"] = pts

    # Additional predictions: pole, fastestLap, positionsGained (10 pts each)
    add_actual = race_results.get("additionalPredictions", {})
    add_pred = predictions.get("additionalPredictions", {})

    for key in ["pole", "fastestLap", "positionsGained"]:
        a_val = add_actual.get(key)
        p_val = add_pred.get(key)
        if a_val is not None and p_val is not None and a_val == p_val:
            if a_val in driver_points_map:
                driver_points_map[a_val]["points"] += 10
                driver_points_map[a_val]["breakdown"][key] = 10

    return driver_points_map


def calculate_bonus_points(predictions, race_results):
    """
    Replicates the logic from mobile_app/src/utils/pointsCalculator.ts
    """

    def is_pos_correct(pos):
        pred = next(
            (p for p in predictions.get("gridOrder", []) if p["position"] == pos), None
        )
        if not pred or pred.get("driverNumber") is None:
            return False
        actual = next(
            (
                r
                for r in race_results.get("gridOrder", [])
                if r["driverNumber"] == pred["driverNumber"]
            ),
            None,
        )
        return actual and actual["position"] == pos

    winner_earned = is_pos_correct(1)
    podium_earned = is_pos_correct(1) and is_pos_correct(2) and is_pos_correct(3)

    correct_count = 0
    for i in range(1, 11):
        if is_pos_correct(i):
            correct_count += 1

    top6_earned = correct_count >= 6
    all_correct_earned = correct_count == 10

    total = (
        (10 if winner_earned else 0)
        + (30 if podium_earned else 0)
        + (60 if top6_earned else 0)
        + (100 if all_correct_earned else 0)
    )

    return total


def handler(event, context):
    """
    Update user scores based on race results.
    Processes all predictions for a given race.
    """
    print(f"Update scores received event: {json.dumps(event)}")

    category = event.get("category")
    race_id = event.get("race_id")
    season = event.get("season")
    result_data = event.get("result")

    if not all([category, race_id, season, result_data]):
        raise ValueError(
            "Missing required fields: category, race_id, season, or result"
        )

    if not TABLE_NAME:
        raise ValueError("TABLE_NAME environment variable is not set")

    table = dynamodb.Table(TABLE_NAME)

    # 1. Fetch race to check for sprint
    race_pk = f"{category}#{season}"
    race_sk = f"RACE#{race_id}"
    race_resp = table.get_item(Key={"PK": race_pk, "SK": race_sk})
    race_item = race_resp.get("Item", {})
    has_sprint = race_item.get("hasSprint", False)

    # 2. Query all predictions for this race
    # PK: PREDICTION#{category}#{race_id}
    prediction_pk = f"PREDICTION#{category}#{race_id}"
    predictions = []
    last_evaluated_key = None

    while True:
        query_params = {"KeyConditionExpression": Key("PK").eq(prediction_pk)}
        if last_evaluated_key:
            query_params["ExclusiveStartKey"] = last_evaluated_key

        resp = table.query(**query_params)
        predictions.extend(resp.get("Items", []))

        last_evaluated_key = resp.get("LastEvaluatedKey")
        if not last_evaluated_key:
            break

    print(f"Found {len(predictions)} predictions to update")
    timestamp = datetime.utcnow().isoformat()

    # 3. Process each prediction
    for pred_item in predictions:
        user_id = pred_item["userId"]
        user_pred_data = (
            json.loads(pred_item["prediction"])
            if isinstance(pred_item["prediction"], str)
            else pred_item["prediction"]
        )

        # Calculate points for this race
        driver_points = calculate_driver_points(user_pred_data, result_data, has_sprint)
        bonus_points = calculate_bonus_points(user_pred_data, result_data)

        total_race_points = (
            sum(d["points"] for d in driver_points.values()) + bonus_points
        )

        # Update RacePrediction
        padded_race = get_padded_points(total_race_points)
        new_by_leaderboard_sk = f"{padded_race}#USER#{user_id}"

        table.update_item(
            Key={"PK": pred_item["PK"], "SK": pred_item["SK"]},
            UpdateExpression="SET points = :p, byLeaderboardSK = :sk, updatedAt = :u",
            ExpressionAttributeValues={
                ":p": total_race_points,
                ":sk": new_by_leaderboard_sk,
                ":u": timestamp,
            },
        )

        # 4. Update LeaderboardEntry (Total points)
        # PK: LEADERBOARD#{category}#{season}
        # SK: USER#{user_id}
        lb_pk = f"LEADERBOARD#{category}#{season}"
        lb_sk = f"USER#{user_id}"

        # Fetch current entry to avoid potential issues with atomic increments if running multiple times
        # though in a Step Function flow for results this should be fine.
        lb_resp = table.get_item(Key={"PK": lb_pk, "SK": lb_sk})
        if "Item" in lb_resp:
            lb_item = lb_resp["Item"]
            # We add current race points to their previous total
            new_total = int(lb_item.get("totalPoints", 0)) + total_race_points
            new_count = int(lb_item.get("numberOfRaces", 0)) + 1

            new_lb_padded = get_padded_points(new_total)
            new_lb_sk = f"{new_lb_padded}#USER#{user_id}"

            table.update_item(
                Key={"PK": lb_pk, "SK": lb_sk},
                UpdateExpression="SET totalPoints = :tp, numberOfRaces = :nr, byLeaderboardSK = :sk, updatedAt = :u",
                ExpressionAttributeValues={
                    ":tp": new_total,
                    ":nr": new_count,
                    ":sk": new_lb_sk,
                    ":u": timestamp,
                },
            )
        else:
            # If for some reason the leaderboard entry doesn't exist, we skip or could create it
            # In this project, initMyLeaderboards usually creates it
            print(
                f"Warning: No leaderboard entry found for user {user_id} in {category}#{season}"
            )

    return {
        "status": "SCORES_UPDATED",
        "processed_count": len(predictions),
        "category": category,
        "race_id": race_id,
        "season": season,
    }

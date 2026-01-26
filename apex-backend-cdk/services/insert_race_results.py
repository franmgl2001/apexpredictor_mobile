import json
import boto3
import os
from datetime import datetime
import dotenv

# Initialize DynamoDB resource
dotenv.load_dotenv()
dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("TABLE_NAME")


def handler(event, context):
    """
    Lambda function to insert race results into DynamoDB.

    Input (event):
    {
        "category": "F1",
        "race_id": "1",
        "season": "2024",
        "result": {
            "gridOrder": [...],
            "sprintPositions": [],
            "additionalPredictions": {...}
        }
    }
    """
    print(f"Received event: {json.dumps(event)}")

    category = event.get("category")
    race_id = event.get("race_id")
    season = event.get("season")
    result_data = event.get("result")

    if not all([category, race_id, season, result_data]):
        error_msg = f"Missing required fields: category, race_id, season, or result. Received: {list(event.keys())}"
        print(error_msg)
        raise ValueError(error_msg)

    if not TABLE_NAME:
        raise ValueError("TABLE_NAME environment variable is not set")

    table = dynamodb.Table(TABLE_NAME)

    # Format keys according to project convention
    # PK: {category}#{season}
    # SK: RESULTS#{race_id}
    pk = f"{category}#{season}"
    sk = f"RESULTS#{race_id}"
    timestamp = datetime.utcnow().isoformat()

    # Store the JSON data as a native DynamoDB Map ("M"), not a string
    item = {
        "PK": pk,
        "SK": sk,
        "entityType": "RESULT",
        "raceId": str(race_id),
        "results": result_data,  # Store as Map for AWSJSON
        "season": str(season),
        "category": category,
        "createdAt": timestamp,
        "updatedAt": timestamp,
    }

    try:
        table.put_item(Item=item)
        print(f"Successfully inserted result for race {race_id} in {category} {season}")

        # Return a status and the relevant data for next steps in the Step Function
        return {
            "category": category,
            "race_id": race_id,
            "season": season,
            "result": result_data,
            "status": "RESULT_INSERTED",
            "pk": pk,
            "sk": sk,
        }
    except Exception as e:
        print(f"Error inserting into DynamoDB: {str(e)}")
        raise e


if __name__ == "__main__":

    event = {
        "category": "f1",
        "race_id": "australia2026",
        "season": "2026",
        "result": {
            "gridOrder": [
                {"position": 1, "driverNumber": 1},
                {"position": 2, "driverNumber": 4},
                {"position": 3, "driverNumber": 16},
                {"position": 4, "driverNumber": 44},
                {"position": 5, "driverNumber": 63},
                {"position": 6, "driverNumber": 81},
                {"position": 7, "driverNumber": 14},
                {"position": 8, "driverNumber": 18},
                {"position": 9, "driverNumber": 55},
                {"position": 10, "driverNumber": 23},
                {"position": 11, "driverNumber": 10},
                {"position": 12, "driverNumber": 31},
            ],
            "sprintPositions": [],
            "additionalPredictions": {
                "pole": 1,
                "fastestLap": 16,
                "positionsGained": 10,
            },
        },
    }

    # Optional: ensure env var exists
    assert os.environ.get("TABLE_NAME"), "TABLE_NAME env var not set"

    out = handler(event, None)
    print("OUTPUT:", out)

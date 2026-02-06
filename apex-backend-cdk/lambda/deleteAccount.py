"""
Lambda function to delete a user account entirely.

1. Queries DynamoDB byUser GSI for ALL items belonging to the user
2. Also queries main table PK = USER#<userId> for profile data
3. Batch deletes all items from DynamoDB
4. Deletes the Cognito user via AdminDeleteUser
5. Returns success

Environment variables:
    TABLE_NAME   - DynamoDB table name
    USER_POOL_ID - Cognito User Pool ID
"""

import os
import json
import boto3

dynamodb = boto3.resource("dynamodb")
cognito = boto3.client("cognito-idp")

TABLE_NAME = os.environ["TABLE_NAME"]
USER_POOL_ID = os.environ["USER_POOL_ID"]

table = dynamodb.Table(TABLE_NAME)


def query_all_user_items(user_id: str) -> list[dict]:
    """Query all items from the byUser GSI for a given userId (handles pagination)."""
    items = []
    params = {
        "IndexName": "byUser",
        "KeyConditionExpression": "byUserPK = :pk",
        "ExpressionAttributeValues": {":pk": f"USER#{user_id}"},
        "Limit": 100,
    }

    while True:
        response = table.query(**params)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        params["ExclusiveStartKey"] = last_key

    return items


def query_main_table_user_items(user_id: str) -> list[dict]:
    """Query items from the main table where PK = USER#<userId> (profile, etc.)."""
    items = []
    params = {
        "KeyConditionExpression": "PK = :pk",
        "ExpressionAttributeValues": {":pk": f"USER#{user_id}"},
        "Limit": 100,
    }

    while True:
        response = table.query(**params)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        params["ExclusiveStartKey"] = last_key

    return items


def batch_delete_items(items: list[dict]) -> None:
    """Batch delete items from DynamoDB (handles batches of 25, deduplicates)."""
    # Deduplicate by PK+SK
    unique_keys: dict[str, dict] = {}
    for item in items:
        key = f"{item['PK']}||{item['SK']}"
        if key not in unique_keys:
            unique_keys[key] = {"PK": item["PK"], "SK": item["SK"]}

    all_keys = list(unique_keys.values())
    print(f"Deleting {len(all_keys)} items from DynamoDB")

    # DynamoDB BatchWriteItem supports max 25 items per batch
    for i in range(0, len(all_keys), 25):
        batch = all_keys[i : i + 25]
        with table.batch_writer() as writer:
            for key in batch:
                writer.delete_item(Key={"PK": key["PK"], "SK": key["SK"]})
        print(f"Deleted batch {i // 25 + 1}: {len(batch)} items")


def delete_cognito_user(username: str) -> None:
    """Delete the user from Cognito."""
    cognito.admin_delete_user(
        UserPoolId=USER_POOL_ID,
        Username=username,
    )
    print(f"Deleted Cognito user: {username}")


def handler(event, context):
    """AppSync Lambda resolver handler."""
    print(f"Delete account event: {json.dumps(event, default=str)}")

    # Get userId from the AppSync identity context
    identity = event.get("identity", {})
    user_id = identity.get("sub")
    cognito_username = identity.get("username") or identity.get("sub")

    if not user_id:
        raise Exception("Unauthorized: No user identity found")

    print(f"Starting account deletion for userId: {user_id}")

    try:
        # Step 1: Find all user items via byUser GSI
        gsi_items = query_all_user_items(user_id)
        print(f"Found {len(gsi_items)} items via byUser GSI")

        # Step 2: Find items in main table under USER#<userId>
        main_items = query_main_table_user_items(user_id)
        print(f"Found {len(main_items)} items in main table")

        # Step 3: Combine all items
        all_items = gsi_items + main_items

        # Step 4: Batch delete all items from DynamoDB
        if all_items:
            batch_delete_items(all_items)

        # Step 5: Delete the user from Cognito
        delete_cognito_user(cognito_username)

        print(f"Account deletion complete for userId: {user_id}")
        return True

    except Exception as e:
        print(f"Error deleting account: {e}")
        raise Exception(f"Failed to delete account: {str(e)}")

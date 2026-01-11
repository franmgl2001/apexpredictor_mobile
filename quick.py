import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("ApexEntity-5jcwvxujrfbo3hrhevdplmyhsi-NONE")


def delete_items_with_pk_prefixes(prefixes):
    scan_kwargs = {
        "FilterExpression": " OR ".join(
            [f"begins_with(PK, :p{i})" for i in range(len(prefixes))]
        ),
        "ExpressionAttributeValues": {
            f":p{i}": prefix for i, prefix in enumerate(prefixes)
        },
    }

    deleted = 0
    last_evaluated_key = None

    while True:
        if last_evaluated_key:
            scan_kwargs["ExclusiveStartKey"] = last_evaluated_key

        response = table.scan(**scan_kwargs)

        items = response.get("Items", [])

        if items:
            with table.batch_writer() as batch:
                for item in items:
                    batch.delete_item(Key={"PK": item["PK"], "SK": item["SK"]})
                    deleted += 1

        last_evaluated_key = response.get("LastEvaluatedKey")
        if not last_evaluated_key:
            break

    print(f"✅ Deleted {deleted} items")


# 🔥 EXECUTE
delete_items_with_pk_prefixes(["race", "driver"])

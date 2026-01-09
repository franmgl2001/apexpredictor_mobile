import time
import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME = "ApexEntity-5jcwvxujrfbo3hrhevdplmyhsi-NONE"
GSI_SEASON = "apexEntitiesBySeason"  # PK = season
SK_TARGET = "TOTALPOINTS"
CATEGORY_VALUE = "F1"

ddb = boto3.resource("dynamodb")
table = ddb.Table(TABLE_NAME)


def now_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def iter_all_totalpoints():
    """
    Iterate all seasons, then filter SK=TOTALPOINTS.
    DynamoDB has no global SK index, so this is the correct pattern.
    """
    # 1) get distinct seasons
    seasons = set()
    scan_kwargs = {
        "ProjectionExpression": "season",
        "FilterExpression": "attribute_exists(season)",
    }

    resp = table.scan(**scan_kwargs)
    for i in resp.get("Items", []):
        seasons.add(i["season"])

    while "LastEvaluatedKey" in resp:
        resp = table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"], **scan_kwargs)
        for i in resp.get("Items", []):
            seasons.add(i["season"])

    # 2) query per season using GSI
    for season in seasons:
        last_key = None
        while True:
            q = {
                "IndexName": GSI_SEASON,
                "KeyConditionExpression": Key("season").eq(season),
            }
            if last_key:
                q["ExclusiveStartKey"] = last_key

            res = table.query(**q)
            for item in res.get("Items", []):
                if item.get("SK") == SK_TARGET:
                    yield item

            last_key = res.get("LastEvaluatedKey")
            if not last_key:
                break


def main():
    updated = 0

    for item in iter_all_totalpoints():
        table.update_item(
            Key={
                "PK": item["PK"],
                "SK": item["SK"],
            },
            UpdateExpression="SET #category = :c, updatedAt = :u",
            ExpressionAttributeNames={
                "#category": "category",
            },
            ExpressionAttributeValues={
                ":c": CATEGORY_VALUE,
                ":u": now_iso(),
            },
        )
        updated += 1

    print(f"TOTALPOINTS updated with category='f1': {updated}")


if __name__ == "__main__":
    main()

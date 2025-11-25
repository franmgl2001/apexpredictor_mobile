from boto3.dynamodb.conditions import Key
import boto3, itertools

TBL = "ApexEntity-5jcwvxujrfbo3hrhevdplmyhsi-NONE"
league_id = "league_1756501360381_2qendu23t"
race_id = "azerbaijan2025"

ddb = boto3.resource("dynamodb")
tbl = ddb.Table(TBL)

# Step 1: league -> members (ONLY member rows)
m = tbl.query(
    KeyConditionExpression=Key("PK").eq(f"league#{league_id}")
    & Key("SK").begins_with("member#"),
    ProjectionExpression="user_id, SK",  # trim payload
)
user_ids = [it["user_id"] for it in m["Items"]]  # safe: all are LEAGUE_MEMBER
# (LEAGUE_MEMBER: PK=league#{...}, SK=member#{...}, has user_id)  # :contentReference[oaicite:4]{index=4}

keys = [
    {"PK": f"prediction#{u}#{race_id}", "SK": "RACEPREDICTION"} for u in user_ids
]  # :contentReference[oaicite:5]{index=5}
resp = ddb.batch_get_item(RequestItems={TBL: {"Keys": keys, "ConsistentRead": True}})
all_predictions.extend(resp["Responses"].get(TBL, []))

print(all_predictions)
print(f"members={len(user_ids)}, predictions_returned={len(all_predictions)}")

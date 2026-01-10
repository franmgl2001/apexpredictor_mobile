import boto3

dynamodb = boto3.client("dynamodb")

table_name = "ApexEntity-5jcwvxujrfbo3hrhevdplmyhsi-NONE"

resp = dynamodb.describe_table(TableName=table_name)
gsis = resp["Table"].get("GlobalSecondaryIndexes", [])

print(f"Table: {table_name}")
if not gsis:
    print("No GSIs found.")
else:
    for gsi in gsis:
        print("\nGSI:", gsi["IndexName"])
        print("  Status:", gsi.get("IndexStatus"))
        print("  Keys:", [(k["AttributeName"], k["KeyType"]) for k in gsi["KeySchema"]])
        proj = gsi.get("Projection", {})
        print("  ProjectionType:", proj.get("ProjectionType"))
        print("  NonKeyAttributes:", proj.get("NonKeyAttributes"))
        throughput = gsi.get("ProvisionedThroughput")
        if throughput:
            print(
                "  RCU/WCU:",
                throughput.get("ReadCapacityUnits"),
                throughput.get("WriteCapacityUnits"),
            )

import os
import time
import boto3
from boto3.dynamodb.conditions import Attr

TABLE_NAME = "ApexBackendStack-ApexEntityTableDFB3421A-QK13O45RSY13"

SEASON = "2025"
CATEGORY = "F1"  # adjust if stored as "f1"
NEW_PK = f"{CATEGORY.lower()}#{SEASON}"  # -> "f1#2026"

DRY_RUN = False  # True = print only, no writes
OVERWRITE = False  # False = skip if target already exists

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def slug_from_driver(item: dict) -> str:
    """
    Choose ONE stable id for driver SK.
    Preferred: driver_id (already stable)
    Fallback: name lowercased without spaces (less safe)
    """
    if item.get("driver_id"):
        # example: "driver_max_verstappen" -> "max_verstappen" or keep full
        return item["driver_id"].replace("driver_", "")
    if item.get("name"):
        return item["name"].lower().replace(" ", "")
    # fallback to PK suffix
    pk = item.get("PK", "")
    return pk.split("#")[-1].replace("driver_", "")


def scan_all(filter_expr):
    items = []
    kwargs = {"FilterExpression": filter_expr}
    while True:
        resp = table.scan(**kwargs)
        items.extend(resp.get("Items", []))
        if "LastEvaluatedKey" not in resp:
            break
        kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]
    return items


def put_item_safe(item: dict):
    if DRY_RUN:
        print("DRY_RUN put:", item["PK"], item["SK"])
        return

    if not OVERWRITE:
        # only write if item does NOT exist
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)",
        )
    else:
        table.put_item(Item=item)


def exists(pk: str, sk: str) -> bool:
    resp = table.get_item(Key={"PK": pk, "SK": sk})
    return "Item" in resp


def migrate_races():
    races = scan_all(
        Attr("entityType").eq("RACE")
        & Attr("season").eq(SEASON)
        & Attr("category").eq(CATEGORY)
    )
    print(f"Found races: {len(races)}")

    for r in races:
        race_id = r.get("race_id") or r.get("PK", "").replace("race#", "")
        new_item = dict(r)
        new_item["PK"] = NEW_PK
        new_item["SK"] = f"race#{race_id}"

        if not OVERWRITE and exists(new_item["PK"], new_item["SK"]):
            continue

        put_item_safe(new_item)


def migrate_drivers():
    drivers = scan_all(
        Attr("entityType").eq("DRIVER")
        & Attr("season").eq(SEASON)
        & Attr("category").eq(CATEGORY)
    )
    print(f"Found drivers: {len(drivers)}")

    for d in drivers:
        driver_slug = slug_from_driver(d)
        new_item = dict(d)
        new_item["PK"] = NEW_PK
        new_item["SK"] = f"drivers#{driver_slug}"

        if not OVERWRITE and exists(new_item["PK"], new_item["SK"]):
            continue

        put_item_safe(new_item)


def migrate_results():
    # Most reliable: scan RACE_RESULT and infer season/category from stored attributes if present.
    # If your RACE_RESULT doesn't have season/category, we still migrate by race_id naming.
    results = scan_all(Attr("entityType").eq("RACE_RESULT"))
    print(f"Found results total: {len(results)}")

    migrated = 0
    for res in results:
        race_id = res.get("race_id") or res.get("PK", "").replace("race#", "")
        # keep only target season (simple contains check; tighten if you store explicit season)
        if SEASON not in race_id:
            continue

        new_item = dict(res)
        new_item["PK"] = NEW_PK
        new_item["SK"] = f"results#{race_id}"

        if not OVERWRITE and exists(new_item["PK"], new_item["SK"]):
            continue

        put_item_safe(new_item)
        migrated += 1

    print(f"Migrated results: {migrated}")


def main():
    print("Migrating to PK:", NEW_PK)
    migrate_races()
    migrate_drivers()
    migrate_results()
    print("Done.")


if __name__ == "__main__":
    main()

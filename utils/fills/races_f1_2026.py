import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import boto3


# ---- config ----
TABLE_NAME = os.environ.get(
    "DB_TABLE_NAME", "ApexBackendStack-ApexEntityTableDFB3421A-QK13O45RSY13"
)
AWS_REGION = os.environ.get("AWS_REGION", "us-east-2")

# UK time (Europe/London) -> UTC ISO8601 with 'Z'
LONDON = ZoneInfo("Europe/London")


def london_to_utc_z(dt_str: str) -> str:
    """
    dt_str: 'YYYY-MM-DD HH:MM' interpreted as Europe/London time.
    Returns: UTC ISO8601 string ending with 'Z' (e.g. '2026-03-07T05:00:00Z')
    """
    naive = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
    local = naive.replace(tzinfo=LONDON)
    utc = local.astimezone(timezone.utc)
    return utc.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


def make_race_item(r: dict, now_iso: str) -> dict:
    race_id = r["race_id"]
    return {
        "PK": "f1#2026",
        "SK": f"RACE#{race_id}",
        # required attributes (per your RACE card)
        "entityType": "RACE",
        "season": "2026",
        "category": r.get("category", "F1"),  # not defined -> adjust if needed
        "status": r.get("status", "scheduled"),  # not defined -> adjust if needed
        "race_id": race_id,
        "race_name": r["race_name"],
        "country": r["country"],
        "circuit": r["circuit"],
        "has_sprint": bool(r["has_sprint"]),
        # stored as UTC Zulu timestamps (derived from UK times)
        "qualy_date": london_to_utc_z(r["qualy_london"]),
        "race_date": london_to_utc_z(r["race_london"]),
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }


RACES_2026 = [
    # Round 1
    {
        "race_id": "australia2026",
        "race_name": "Australian Grand Prix",
        "country": "Australia",
        "circuit": "Albert Park Circuit",
        "has_sprint": False,
        "qualy_london": "2026-03-07 05:00",
        "race_london": "2026-03-08 04:00",
    },
    # Round 2
    {
        "race_id": "china2026",
        "race_name": "Chinese Grand Prix",
        "country": "China",
        "circuit": "Shanghai International Circuit",
        "has_sprint": True,
        "qualy_london": "2026-03-13 07:30",
        "race_london": "2026-03-15 07:00",
    },
    # Round 3
    {
        "race_id": "japan2026",
        "race_name": "Japanese Grand Prix",
        "country": "Japan",
        "circuit": "Suzuka Circuit",
        "has_sprint": False,
        "qualy_london": "2026-03-28 06:00",
        "race_london": "2026-03-29 06:00",
    },
    # Round 4
    {
        "race_id": "bahrain2026",
        "race_name": "Bahrain Grand Prix",
        "country": "Bahrain",
        "circuit": "Bahrain International Circuit",
        "has_sprint": False,
        "qualy_london": "2026-04-11 16:00",
        "race_london": "2026-04-12 15:00",
    },
    # Round 5
    {
        "race_id": "saudi-arabia2026",
        "race_name": "Saudi Arabian Grand Prix",
        "country": "Saudi Arabia",
        "circuit": "Jeddah Corniche Circuit",
        "has_sprint": False,
        "qualy_london": "2026-04-18 17:00",
        "race_london": "2026-04-19 17:00",
    },
    # Round 6
    {
        "race_id": "miami2026",
        "race_name": "Miami Grand Prix",
        "country": "United States",
        "circuit": "Miami International Autodrome",
        "has_sprint": True,
        "qualy_london": "2026-05-01 20:30",
        "race_london": "2026-05-03 20:00",
    },
    # Round 7
    {
        "race_id": "canada2026",
        "race_name": "Canadian Grand Prix",
        "country": "Canada",
        "circuit": "Circuit Gilles-Villeneuve",
        "has_sprint": True,
        "qualy_london": "2026-05-22 20:30",
        "race_london": "2026-05-24 20:00",
    },
    # Round 8
    {
        "race_id": "monaco2026",
        "race_name": "Monaco Grand Prix",
        "country": "Monaco",
        "circuit": "Circuit de Monaco",
        "has_sprint": False,
        "qualy_london": "2026-06-06 14:00",
        "race_london": "2026-06-07 13:00",
    },
    # Round 9
    {
        "race_id": "barcelona-catalunya2026",
        "race_name": "Barcelona-Catalunya Grand Prix",
        "country": "Spain",
        "circuit": "Circuit de Barcelona-Catalunya",
        "has_sprint": False,
        "qualy_london": "2026-06-13 14:00",
        "race_london": "2026-06-14 13:00",
    },
    # Round 10
    {
        "race_id": "austria2026",
        "race_name": "Austrian Grand Prix",
        "country": "Austria",
        "circuit": "Red Bull Ring",
        "has_sprint": False,
        "qualy_london": "2026-06-27 14:00",
        "race_london": "2026-06-28 13:00",
    },
    # Round 11
    {
        "race_id": "great-britain2026",
        "race_name": "British Grand Prix",
        "country": "United Kingdom",
        "circuit": "Silverstone Circuit",
        "has_sprint": True,
        "qualy_london": "2026-07-04 15:00",
        "race_london": "2026-07-05 14:00",
    },
    # Round 12
    {
        "race_id": "belgium2026",
        "race_name": "Belgian Grand Prix",
        "country": "Belgium",
        "circuit": "Circuit de Spa-Francorchamps",
        "has_sprint": False,
        "qualy_london": "2026-07-18 14:00",
        "race_london": "2026-07-19 13:00",
    },
    # Round 13
    {
        "race_id": "hungary2026",
        "race_name": "Hungarian Grand Prix",
        "country": "Hungary",
        "circuit": "Hungaroring",
        "has_sprint": False,
        "qualy_london": "2026-07-25 14:00",
        "race_london": "2026-07-26 13:00",
    },
    # Round 14
    {
        "race_id": "netherlands2026",
        "race_name": "Dutch Grand Prix",
        "country": "Netherlands",
        "circuit": "Circuit Zandvoort",
        "has_sprint": True,
        "qualy_london": "2026-08-21 14:30",
        "race_london": "2026-08-23 13:00",
    },
    # Round 15
    {
        "race_id": "italy2026",
        "race_name": "Italian Grand Prix",
        "country": "Italy",
        "circuit": "Autodromo Nazionale Monza",
        "has_sprint": False,
        "qualy_london": "2026-09-05 14:00",
        "race_london": "2026-09-06 13:00",
    },
    # Round 16
    {
        "race_id": "spain2026",
        "race_name": "Spanish Grand Prix",
        "country": "Spain",
        "circuit": "Madring",
        "has_sprint": False,
        "qualy_london": "2026-09-12 14:00",
        "race_london": "2026-09-13 13:00",
    },
    # Round 17
    {
        "race_id": "azerbaijan2026",
        "race_name": "Azerbaijan Grand Prix",
        "country": "Azerbaijan",
        "circuit": "Baku City Circuit",
        "has_sprint": False,
        "qualy_london": "2026-09-25 12:00",
        "race_london": "2026-09-26 11:00",
    },
    # Round 18
    {
        "race_id": "singapore2026",
        "race_name": "Singapore Grand Prix",
        "country": "Singapore",
        "circuit": "Marina Bay Street Circuit",
        "has_sprint": True,
        "qualy_london": "2026-10-09 12:30",
        "race_london": "2026-10-11 12:00",
    },
    # Round 19
    {
        "race_id": "united-states2026",
        "race_name": "United States Grand Prix",
        "country": "United States",
        "circuit": "Circuit of The Americas",
        "has_sprint": False,
        "qualy_london": "2026-10-24 21:00",
        "race_london": "2026-10-25 20:00",
    },
    # Round 20
    {
        "race_id": "mexico2026",
        "race_name": "Mexico City Grand Prix",
        "country": "Mexico",
        "circuit": "Autódromo Hermanos Rodríguez",
        "has_sprint": False,
        "qualy_london": "2026-10-31 21:00",
        "race_london": "2026-11-01 20:00",
    },
    # Round 21
    {
        "race_id": "brazil2026",
        "race_name": "São Paulo Grand Prix",
        "country": "Brazil",
        "circuit": "Autódromo José Carlos Pace",
        "has_sprint": False,
        "qualy_london": "2026-11-07 18:00",
        "race_london": "2026-11-08 17:00",
    },
    # Round 22
    {
        "race_id": "las-vegas2026",
        "race_name": "Las Vegas Grand Prix",
        "country": "United States",
        "circuit": "Las Vegas Strip Circuit",
        "has_sprint": False,
        "qualy_london": "2026-11-21 04:00",
        "race_london": "2026-11-22 04:00",
    },
    # Round 23
    {
        "race_id": "qatar2026",
        "race_name": "Qatar Grand Prix",
        "country": "Qatar",
        "circuit": "Lusail International Circuit",
        "has_sprint": False,
        "qualy_london": "2026-11-28 18:00",
        "race_london": "2026-11-29 16:00",
    },
    # Round 24
    {
        "race_id": "united-arab-emirates2026",
        "race_name": "Abu Dhabi Grand Prix",
        "country": "United Arab Emirates",
        "circuit": "Yas Marina Circuit",
        "has_sprint": False,
        "qualy_london": "2026-12-05 14:00",
        "race_london": "2026-12-06 13:00",
    },
]


def main() -> None:
    dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
    table = dynamodb.Table(TABLE_NAME)

    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    items = [make_race_item(r, now_iso) for r in RACES_2026]

    # BatchWriter handles retries/unprocessed items automatically
    with table.batch_writer(overwrite_by_pkeys=["PK", "SK"]) as batch:
        for item in items:
            batch.put_item(Item=item)

    print(f"Inserted/updated {len(items)} races into {TABLE_NAME}")


if __name__ == "__main__":
    main()

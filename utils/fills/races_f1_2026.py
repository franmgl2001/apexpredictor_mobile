import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import boto3


# ---- config ----
tableName = os.environ.get(
    "DB_TABLE_NAME", "ApexBackendStack-ApexEntityTableDFB3421A-QK13O45RSY13"
)
awsRegion = os.environ.get("AWS_REGION", "us-east-2")

# UK time (Europe/London) -> UTC ISO8601 with 'Z'
london = ZoneInfo("Europe/London")


def londonToUtcZ(dtStr: str) -> str:
    """
    dtStr: 'YYYY-MM-DD HH:MM' interpreted as Europe/London time.
    Returns: UTC ISO8601 string ending with 'Z' (e.g. '2026-03-07T05:00:00Z')
    """
    naive = datetime.strptime(dtStr, "%Y-%m-%d %H:%M")
    local = naive.replace(tzinfo=london)
    utc = local.astimezone(timezone.utc)
    return utc.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


def makeRaceItem(r: dict, nowIso: str) -> dict:
    raceId = r["raceId"]
    return {
        "PK": "f1#2026",
        "SK": f"RACE#{raceId}",
        # required attributes (per your RACE card)
        "entityType": "RACE",
        "season": "2026",
        "category": r.get("category", "F1"),  # not defined -> adjust if needed
        "status": r.get("status", "scheduled"),  # not defined -> adjust if needed
        "raceId": raceId,
        "raceName": r["raceName"],
        "country": r["country"],
        "circuit": r["circuit"],
        "hasSprint": bool(r["hasSprint"]),
        # stored as UTC Zulu timestamps (derived from UK times)
        "qualyDate": londonToUtcZ(r["qualyLondon"]),
        "raceDate": londonToUtcZ(r["raceLondon"]),
        "createdAt": nowIso,
        "updatedAt": nowIso,
    }


races2026 = [
    # Round 1
    {
        "raceId": "australia2026",
        "raceName": "Australian Grand Prix",
        "country": "Australia",
        "circuit": "Albert Park Circuit",
        "hasSprint": False,
        "qualyLondon": "2026-03-07 05:00",
        "raceLondon": "2026-03-08 04:00",
    },
    # Round 2
    {
        "raceId": "china2026",
        "raceName": "Chinese Grand Prix",
        "country": "China",
        "circuit": "Shanghai International Circuit",
        "hasSprint": True,
        "qualyLondon": "2026-03-13 07:30",
        "raceLondon": "2026-03-15 07:00",
    },
    # Round 3
    {
        "raceId": "japan2026",
        "raceName": "Japanese Grand Prix",
        "country": "Japan",
        "circuit": "Suzuka Circuit",
        "hasSprint": False,
        "qualyLondon": "2026-03-28 06:00",
        "raceLondon": "2026-03-29 06:00",
    },
    # Round 4
    {
        "raceId": "bahrain2026",
        "raceName": "Bahrain Grand Prix",
        "country": "Bahrain",
        "circuit": "Bahrain International Circuit",
        "hasSprint": False,
        "qualyLondon": "2026-04-11 16:00",
        "raceLondon": "2026-04-12 15:00",
    },
    # Round 5
    {
        "raceId": "saudi-arabia2026",
        "raceName": "Saudi Arabian Grand Prix",
        "country": "Saudi Arabia",
        "circuit": "Jeddah Corniche Circuit",
        "hasSprint": False,
        "qualyLondon": "2026-04-18 17:00",
        "raceLondon": "2026-04-19 17:00",
    },
    # Round 6
    {
        "raceId": "miami2026",
        "raceName": "Miami Grand Prix",
        "country": "United States",
        "circuit": "Miami International Autodrome",
        "hasSprint": True,
        "qualyLondon": "2026-05-01 20:30",
        "raceLondon": "2026-05-03 20:00",
    },
    # Round 7
    {
        "raceId": "canada2026",
        "raceName": "Canadian Grand Prix",
        "country": "Canada",
        "circuit": "Circuit Gilles-Villeneuve",
        "hasSprint": True,
        "qualyLondon": "2026-05-22 20:30",
        "raceLondon": "2026-05-24 20:00",
    },
    # Round 8
    {
        "raceId": "monaco2026",
        "raceName": "Monaco Grand Prix",
        "country": "Monaco",
        "circuit": "Circuit de Monaco",
        "hasSprint": False,
        "qualyLondon": "2026-06-06 14:00",
        "raceLondon": "2026-06-07 13:00",
    },
    # Round 9
    {
        "raceId": "barcelona-catalunya2026",
        "raceName": "Barcelona-Catalunya Grand Prix",
        "country": "Spain",
        "circuit": "Circuit de Barcelona-Catalunya",
        "hasSprint": False,
        "qualyLondon": "2026-06-13 14:00",
        "raceLondon": "2026-06-14 13:00",
    },
    # Round 10
    {
        "raceId": "austria2026",
        "raceName": "Austrian Grand Prix",
        "country": "Austria",
        "circuit": "Red Bull Ring",
        "hasSprint": False,
        "qualyLondon": "2026-06-27 14:00",
        "raceLondon": "2026-06-28 13:00",
    },
    # Round 11
    {
        "raceId": "great-britain2026",
        "raceName": "British Grand Prix",
        "country": "United Kingdom",
        "circuit": "Silverstone Circuit",
        "hasSprint": True,
        "qualyLondon": "2026-07-04 15:00",
        "raceLondon": "2026-07-05 14:00",
    },
    # Round 12
    {
        "raceId": "belgium2026",
        "raceName": "Belgian Grand Prix",
        "country": "Belgium",
        "circuit": "Circuit de Spa-Francorchamps",
        "hasSprint": False,
        "qualyLondon": "2026-07-18 14:00",
        "raceLondon": "2026-07-19 13:00",
    },
    # Round 13
    {
        "raceId": "hungary2026",
        "raceName": "Hungarian Grand Prix",
        "country": "Hungary",
        "circuit": "Hungaroring",
        "hasSprint": False,
        "qualyLondon": "2026-07-25 14:00",
        "raceLondon": "2026-07-26 13:00",
    },
    # Round 14
    {
        "raceId": "netherlands2026",
        "raceName": "Dutch Grand Prix",
        "country": "Netherlands",
        "circuit": "Circuit Zandvoort",
        "hasSprint": True,
        "qualyLondon": "2026-08-21 14:30",
        "raceLondon": "2026-08-23 13:00",
    },
    # Round 15
    {
        "raceId": "italy2026",
        "raceName": "Italian Grand Prix",
        "country": "Italy",
        "circuit": "Autodromo Nazionale Monza",
        "hasSprint": False,
        "qualyLondon": "2026-09-05 14:00",
        "raceLondon": "2026-09-06 13:00",
    },
    # Round 16
    {
        "raceId": "spain2026",
        "raceName": "Spanish Grand Prix",
        "country": "Spain",
        "circuit": "Madring",
        "hasSprint": False,
        "qualyLondon": "2026-09-12 14:00",
        "raceLondon": "2026-09-13 13:00",
    },
    # Round 17
    {
        "raceId": "azerbaijan2026",
        "raceName": "Azerbaijan Grand Prix",
        "country": "Azerbaijan",
        "circuit": "Baku City Circuit",
        "hasSprint": False,
        "qualyLondon": "2026-09-25 12:00",
        "raceLondon": "2026-09-26 11:00",
    },
    # Round 18
    {
        "raceId": "singapore2026",
        "raceName": "Singapore Grand Prix",
        "country": "Singapore",
        "circuit": "Marina Bay Street Circuit",
        "hasSprint": True,
        "qualyLondon": "2026-10-09 12:30",
        "raceLondon": "2026-10-11 12:00",
    },
    # Round 19
    {
        "raceId": "united-states2026",
        "raceName": "United States Grand Prix",
        "country": "United States",
        "circuit": "Circuit of The Americas",
        "hasSprint": False,
        "qualyLondon": "2026-10-24 21:00",
        "raceLondon": "2026-10-25 20:00",
    },
    # Round 20
    {
        "raceId": "mexico2026",
        "raceName": "Mexico City Grand Prix",
        "country": "Mexico",
        "circuit": "Autódromo Hermanos Rodríguez",
        "hasSprint": False,
        "qualyLondon": "2026-10-31 21:00",
        "raceLondon": "2026-11-01 20:00",
    },
    # Round 21
    {
        "raceId": "brazil2026",
        "raceName": "São Paulo Grand Prix",
        "country": "Brazil",
        "circuit": "Autódromo José Carlos Pace",
        "hasSprint": False,
        "qualyLondon": "2026-11-07 18:00",
        "raceLondon": "2026-11-08 17:00",
    },
    # Round 22
    {
        "raceId": "las-vegas2026",
        "raceName": "Las Vegas Grand Prix",
        "country": "United States",
        "circuit": "Las Vegas Strip Circuit",
        "hasSprint": False,
        "qualyLondon": "2026-11-21 04:00",
        "raceLondon": "2026-11-22 04:00",
    },
    # Round 23
    {
        "raceId": "qatar2026",
        "raceName": "Qatar Grand Prix",
        "country": "Qatar",
        "circuit": "Lusail International Circuit",
        "hasSprint": False,
        "qualyLondon": "2026-11-28 18:00",
        "raceLondon": "2026-11-29 16:00",
    },
    # Round 24
    {
        "raceId": "united-arab-emirates2026",
        "raceName": "Abu Dhabi Grand Prix",
        "country": "United Arab Emirates",
        "circuit": "Yas Marina Circuit",
        "hasSprint": False,
        "qualyLondon": "2026-12-05 14:00",
        "raceLondon": "2026-12-06 13:00",
    },
]


def main() -> None:
    dynamodb = boto3.resource("dynamodb", region_name=awsRegion)
    table = dynamodb.Table(tableName)

    nowIso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    items = [makeRaceItem(r, nowIso) for r in races2026]

    # BatchWriter handles retries/unprocessed items automatically
    with table.batch_writer(overwrite_by_pkeys=["PK", "SK"]) as batch:
        for item in items:
            batch.put_item(Item=item)

    print(f"Inserted/updated {len(items)} races into {tableName}")


if __name__ == "__main__":
    main()

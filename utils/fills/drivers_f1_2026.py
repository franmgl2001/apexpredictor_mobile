import boto3
from datetime import datetime, timezone

tableName = "ApexBackendStack-ApexEntityTableDFB3421A-QK13O45RSY13"


def nowIso():
    return (
        datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    )


# Team colors (hex) — used for teams where a hex value is available.
# For Audi/Cadillac: not defined (no authoritative hex palette published as hex).
teamColors = {
    # Orange / green / silver are already fine
    "McLaren": "#F47600",
    "Mercedes": "#00D7B6",
    "Ferrari": "#ED1131",
    "Aston Martin": "#229971",
    "Alpine": "#EC4899",
    # Adjusted for clarity
    "Red Bull": "#1E3A8A",  # deep royal blue
    "Racing Bulls": "#3B82F6",  # electric blue
    "Williams": "#0EA5E9",  # cyan blue
    # Special cases you asked for
    "Haas": "#0F0F12",  # dark red
    "Audi": "#8B1D2C",  # premium dark red
    "Cadillac": "#002868",  # navy racing blue
}


drivers2026F1 = [
    # McLaren
    {
        "driverId": "driver_lando_norris",
        "name": "Lando Norris",
        "number": 1,
        "team": "McLaren",
    },
    {
        "driverId": "driver_oscar_piastri",
        "name": "Oscar Piastri",
        "number": 81,
        "team": "McLaren",
    },
    # Mercedes
    {
        "driverId": "driver_george_russell",
        "name": "George Russell",
        "number": 63,
        "team": "Mercedes",
    },
    {
        "driverId": "driver_kimi_antonelli",
        "name": "Kimi Antonelli",
        "number": 12,
        "team": "Mercedes",
    },
    # Red Bull
    {
        "driverId": "driver_max_verstappen",
        "name": "Max Verstappen",
        "number": 3,
        "team": "Red Bull",
    },
    {
        "driverId": "driver_isack_hadjar",
        "name": "Isack Hadjar",
        "number": 6,
        "team": "Red Bull",
    },
    # Ferrari
    {
        "driverId": "driver_charles_leclerc",
        "name": "Charles Leclerc",
        "number": 16,
        "team": "Ferrari",
    },
    {
        "driverId": "driver_lewis_hamilton",
        "name": "Lewis Hamilton",
        "number": 44,
        "team": "Ferrari",
    },
    # Williams
    {
        "driverId": "driver_alexander_albon",
        "name": "Alexander Albon",
        "number": 23,
        "team": "Williams",
    },
    {
        "driverId": "driver_carlos_sainz",
        "name": "Carlos Sainz",
        "number": 55,
        "team": "Williams",
    },
    # Racing Bulls
    {
        "driverId": "driver_liam_lawson",
        "name": "Liam Lawson",
        "number": 30,
        "team": "Racing Bulls",
    },
    {
        "driverId": "driver_arvid_lindblad",
        "name": "Arvid Lindblad",
        "number": 41,
        "team": "Racing Bulls",
    },
    # Aston Martin
    {
        "driverId": "driver_fernando_alonso",
        "name": "Fernando Alonso",
        "number": 14,
        "team": "Aston Martin",
    },
    {
        "driverId": "driver_lance_stroll",
        "name": "Lance Stroll",
        "number": 18,
        "team": "Aston Martin",
    },
    # Haas
    {
        "driverId": "driver_esteban_ocon",
        "name": "Esteban Ocon",
        "number": 31,
        "team": "Haas",
    },
    {
        "driverId": "driver_oliver_bearman",
        "name": "Oliver Bearman",
        "number": 87,
        "team": "Haas",
    },
    # Audi
    {
        "driverId": "driver_gabriel_bortoleto",
        "name": "Gabriel Bortoleto",
        "number": 5,
        "team": "Audi",
    },
    {
        "driverId": "driver_nico_hulkenberg",
        "name": "Nico Hulkenberg",
        "number": 27,
        "team": "Audi",
    },
    # Alpine
    {
        "driverId": "driver_pierre_gasly",
        "name": "Pierre Gasly",
        "number": 10,
        "team": "Alpine",
    },
    {
        "driverId": "driver_franco_colapinto",
        "name": "Franco Colapinto",
        "number": 43,
        "team": "Alpine",
    },
    # Cadillac
    {
        "driverId": "driver_sergio_perez",
        "name": "Sergio Perez",
        "number": 11,
        "team": "Cadillac",
    },
    {
        "driverId": "driver_valtteri_bottas",
        "name": "Valtteri Bottas",
        "number": 77,
        "team": "Cadillac",
    },
]


def slugFromDriver(driverId: str) -> str:
    """
    Convert driverId to slug format (same logic as assets.py)
    Example: "driver_max_verstappen" -> "max_verstappen"
    """
    if driverId.startswith("driver_"):
        return driverId.replace("driver_", "")
    return driverId


def buildDriverItem(d, ts):
    driverId = d["driverId"]
    season = "2026"
    team = d["team"]
    driverSlug = slugFromDriver(driverId)

    return {
        "PK": "f1#2026",
        "SK": f"DRIVER#{driverSlug}",
        "entityType": "DRIVER",
        "driverId": driverId,
        "season": season,
        "category": "f1",
        "name": d["name"],
        "number": int(d["number"]),
        "team": team,
        "teamColor": teamColors.get(team, "not defined"),
        "isActive": True,
        # placeholders for required attributes not specified in your card beyond being "required"
        "birthDate": "Unknown",
        "nationality": "Unknown",
        "imageUrl": "not defined",
        "createdAt": ts,
        "updatedAt": ts,
    }


def main():
    ts = nowIso()
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(tableName)

    items = [buildDriverItem(d, ts) for d in drivers2026F1]

    with table.batch_writer(overwrite_by_pkeys=["PK", "SK"]) as batch:
        for item in items:
            batch.put_item(Item=item)

    print(
        f"Wrote {len(items)} DRIVER items for season 2026 (category=F1) into {tableName}"
    )


if __name__ == "__main__":
    main()

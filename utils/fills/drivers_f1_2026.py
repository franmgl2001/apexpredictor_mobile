import boto3
from datetime import datetime, timezone

TABLE_NAME = "ApexBackendStack-ApexEntityTableDFB3421A-QK13O45RSY13"


def now_iso():
    return (
        datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    )


# Team colors (hex) — used for teams where a hex value is available.
# For Audi/Cadillac: not defined (no authoritative hex palette published as hex).
TEAM_COLORS = {
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


DRIVERS_2026_F1 = [
    # McLaren
    {
        "driver_id": "driver_lando_norris",
        "name": "Lando Norris",
        "number": 1,
        "team": "McLaren",
    },
    {
        "driver_id": "driver_oscar_piastri",
        "name": "Oscar Piastri",
        "number": 81,
        "team": "McLaren",
    },
    # Mercedes
    {
        "driver_id": "driver_george_russell",
        "name": "George Russell",
        "number": 63,
        "team": "Mercedes",
    },
    {
        "driver_id": "driver_kimi_antonelli",
        "name": "Kimi Antonelli",
        "number": 12,
        "team": "Mercedes",
    },
    # Red Bull
    {
        "driver_id": "driver_max_verstappen",
        "name": "Max Verstappen",
        "number": 3,
        "team": "Red Bull",
    },
    {
        "driver_id": "driver_isack_hadjar",
        "name": "Isack Hadjar",
        "number": 6,
        "team": "Red Bull",
    },
    # Ferrari
    {
        "driver_id": "driver_charles_leclerc",
        "name": "Charles Leclerc",
        "number": 16,
        "team": "Ferrari",
    },
    {
        "driver_id": "driver_lewis_hamilton",
        "name": "Lewis Hamilton",
        "number": 44,
        "team": "Ferrari",
    },
    # Williams
    {
        "driver_id": "driver_alexander_albon",
        "name": "Alexander Albon",
        "number": 23,
        "team": "Williams",
    },
    {
        "driver_id": "driver_carlos_sainz",
        "name": "Carlos Sainz",
        "number": 55,
        "team": "Williams",
    },
    # Racing Bulls
    {
        "driver_id": "driver_liam_lawson",
        "name": "Liam Lawson",
        "number": 30,
        "team": "Racing Bulls",
    },
    {
        "driver_id": "driver_arvid_lindblad",
        "name": "Arvid Lindblad",
        "number": 41,
        "team": "Racing Bulls",
    },
    # Aston Martin
    {
        "driver_id": "driver_fernando_alonso",
        "name": "Fernando Alonso",
        "number": 14,
        "team": "Aston Martin",
    },
    {
        "driver_id": "driver_lance_stroll",
        "name": "Lance Stroll",
        "number": 18,
        "team": "Aston Martin",
    },
    # Haas
    {
        "driver_id": "driver_esteban_ocon",
        "name": "Esteban Ocon",
        "number": 31,
        "team": "Haas",
    },
    {
        "driver_id": "driver_oliver_bearman",
        "name": "Oliver Bearman",
        "number": 87,
        "team": "Haas",
    },
    # Audi
    {
        "driver_id": "driver_gabriel_bortoleto",
        "name": "Gabriel Bortoleto",
        "number": 5,
        "team": "Audi",
    },
    {
        "driver_id": "driver_nico_hulkenberg",
        "name": "Nico Hulkenberg",
        "number": 27,
        "team": "Audi",
    },
    # Alpine
    {
        "driver_id": "driver_pierre_gasly",
        "name": "Pierre Gasly",
        "number": 10,
        "team": "Alpine",
    },
    {
        "driver_id": "driver_franco_colapinto",
        "name": "Franco Colapinto",
        "number": 43,
        "team": "Alpine",
    },
    # Cadillac
    {
        "driver_id": "driver_sergio_perez",
        "name": "Sergio Perez",
        "number": 11,
        "team": "Cadillac",
    },
    {
        "driver_id": "driver_valtteri_bottas",
        "name": "Valtteri Bottas",
        "number": 77,
        "team": "Cadillac",
    },
]


def slug_from_driver(driver_id: str) -> str:
    """
    Convert driver_id to slug format (same logic as assets.py)
    Example: "driver_max_verstappen" -> "max_verstappen"
    """
    if driver_id.startswith("driver_"):
        return driver_id.replace("driver_", "")
    return driver_id


def build_driver_item(d, ts):
    driver_id = d["driver_id"]
    season = "2026"
    team = d["team"]
    driver_slug = slug_from_driver(driver_id)

    return {
        "PK": "f1#2026",
        "SK": f"drivers#{driver_slug}",
        "entityType": "DRIVER",
        "driver_id": driver_id,
        "season": season,
        "category": "F1",
        "name": d["name"],
        "number": int(d["number"]),
        "team": team,
        "teamColor": TEAM_COLORS.get(team, "not defined"),
        "isActive": True,
        # placeholders for required attributes not specified in your card beyond being "required"
        "birthDate": "Unknown",
        "nationality": "Unknown",
        "imageUrl": "not defined",
        "createdAt": ts,
        "updatedAt": ts,
    }


def main():
    ts = now_iso()
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(TABLE_NAME)

    items = [build_driver_item(d, ts) for d in DRIVERS_2026_F1]

    with table.batch_writer(overwrite_by_pkeys=["PK", "SK"]) as batch:
        for item in items:
            batch.put_item(Item=item)

    print(
        f"Wrote {len(items)} DRIVER items for season 2026 (category=F1) into {TABLE_NAME}"
    )


if __name__ == "__main__":
    main()

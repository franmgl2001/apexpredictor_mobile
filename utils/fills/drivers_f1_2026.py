import boto3
from datetime import datetime, timezone

TABLE_NAME = "ApexEntity-5jcwvxujrfbo3hrhevdplmyhsi-NONE"


def now_iso():
    return (
        datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    )


# Team colors (hex) — used for teams where a hex value is available.
# For Audi/Cadillac: not defined (no authoritative hex palette published as hex).
TEAM_COLORS = {
    "McLaren": "#F47600",
    "Mercedes": "#00D7B6",
    "Red Bull": "#4781D7",
    "Ferrari": "#ED1131",
    "Williams": "#1868DB",
    "Racing Bulls": "#6C98FF",
    "Aston Martin": "#229971",
    "Haas": "#9C9FA2",
    # New/changed 2026 teams (hex not defined in your docs / not safely hardcodable)
    "Audi": "#BB0A30",
    "Cadillac": "#002D72",
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


def build_driver_item(d, ts):
    driver_id = d["driver_id"]
    season = "2026"
    team = d["team"]

    return {
        "PK": f"driver#{driver_id}",
        "SK": f"SEASON#{season}",
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

SCHEMA CARDS — v2025-11-11

TABLE
- name: ApexEntity-5jcwvxujrfbo3hrhevdplmyhsi-NONE
- PK: PK (S)
- SK: SK (S)
- Notes: Single-table. SK prefixes distinguish entities. TTL: none. Streams: on.

GLOBAL SECONDARY INDEXES
- apexEntitiesByLeague_idAndCreatedAt:
  - PK: league_id
  - SK: createdAt
  - PROJECTION: ALL
  - Purpose: <fill intent>
- apexEntitiesByEntityTypeAndCreatedAt:
  - PK: entityType
  - SK: createdAt
  - PROJECTION: ALL
  - Purpose: <fill intent>
- apexEntitiesByJoin_code:
  - PK: join_code
  - SK: null
  - PROJECTION: ALL
  - Purpose: <fill intent>
- apexEntitiesBySeasonAndPoints:
  - PK: season
  - SK: points
  - PROJECTION: ALL
  - Purpose: <fill intent>
- apexEntitiesByEntityTypeAndPoints:
  - PK: entityType
  - SK: points
  - PROJECTION: ALL
  - Purpose: <fill intent>
- apexEntitiesByRace_id:
  - PK: race_id
  - SK: null
  - PROJECTION: ALL
  - Purpose: <fill intent>
- apexEntitiesByStatus:
  - PK: status
  - SK: null
  - PROJECTION: ALL
  - Purpose: <fill intent>
- apexEntitiesBySeason:
  - PK: season
  - SK: null
  - PROJECTION: ALL
  - Purpose: <fill intent>
- apexEntitiesByUser_idAndCreatedAt:
  - PK: user_id
  - SK: createdAt
  - PROJECTION: ALL
  - Purpose: <fill intent>

ENTITIES

## LEAGUE_PREDICTION
Keys:
- PK pattern: prediction#{...}
- SK pattern: RACEPREDICTION
Attributes
- required: createdAt, entityType, league_id, points, predictions, race_id, updatedAt, user_id, username
- optional: __typename, points_earned
Indexes
- apexEntitiesByLeague_idAndCreatedAt: PK=league_id, SK=createdAt, PROJECTION=ALL
- apexEntitiesByEntityTypeAndCreatedAt: PK=entityType, SK=createdAt, PROJECTION=ALL
- apexEntitiesBySeasonAndPoints: PK=season, SK=points, PROJECTION=ALL
- apexEntitiesByEntityTypeAndPoints: PK=entityType, SK=points, PROJECTION=ALL
- apexEntitiesByRace_id: PK=race_id, SK=null, PROJECTION=ALL
- apexEntitiesByUser_idAndCreatedAt: PK=user_id, SK=createdAt, PROJECTION=ALL
Access Patterns (canonical)  # ← fill/curate as needed
- GetLeague_PredictionByPK/SK: GetItem(PK=?, SK=?)
- ListLeague_PredictionByPK: Query PK=? [optional begins_with(SK,'League_Prediction#')]
Examples
- {"PK": "prediction#014bd500-80b1-703b-027e-b7a93ce4abda#azerbaijan2025#league#league_1756661141_783b929f", "SK": "RACEPREDICTION", "__typename": "ApexEntity", "entityType": "LEAGUE_PREDICTION", "user_id": "014bd500-80b1-703b-027e-b7a93ce4abda", "league_id": "league_1756661141_783b929f", "updatedAt": "2025-11-10T21:41:45Z", "points": 12}
- {"PK": "prediction#61cbf510-20d1-7047-5006-b3ae8d8fb6e5#unitedstates2025#league#league_1753998113925_yycijkpcu", "SK": "RACEPREDICTION", "__typename": "ApexEntity", "entityType": "LEAGUE_PREDICTION", "user_id": "61cbf510-20d1-7047-5006-b3ae8d8fb6e5", "league_id": "league_1753998113925_yycijkpcu", "updatedAt": "2025-11-10T21:41:45Z", "points": 62}


## PREDICTION
Keys:
- PK pattern: prediction#{...}
- SK pattern: RACEPREDICTION
Attributes
- required: createdAt, entityType, predictions, race_id, updatedAt, user_id, username
- optional: __typename, points, points_earned
Indexes
- apexEntitiesByLeague_idAndCreatedAt: PK=league_id, SK=createdAt, PROJECTION=ALL
- apexEntitiesByEntityTypeAndCreatedAt: PK=entityType, SK=createdAt, PROJECTION=ALL
- apexEntitiesBySeasonAndPoints: PK=season, SK=points, PROJECTION=ALL
- apexEntitiesByEntityTypeAndPoints: PK=entityType, SK=points, PROJECTION=ALL
- apexEntitiesByRace_id: PK=race_id, SK=null, PROJECTION=ALL
- apexEntitiesByUser_idAndCreatedAt: PK=user_id, SK=createdAt, PROJECTION=ALL
Access Patterns (canonical)  # ← fill/curate as needed
- GetPredictionByPK/SK: GetItem(PK=?, SK=?)
- ListPredictionByPK: Query PK=? [optional begins_with(SK,'Prediction#')]
Examples
- {"PK": "prediction#a14bc580-3091-7070-a98d-bbb24e46c288#netherlands2025", "SK": "RACEPREDICTION", "__typename": "ApexEntity", "entityType": "PREDICTION", "user_id": "a14bc580-3091-7070-a98d-bbb24e46c288", "points": 45, "updatedAt": "2025-08-31T16:01:54.760254Z", "predictions": "{\"gridOrder\":[{\"position\":1,\"driverNumber\":4},{\"position\":2,\"driverNumber\":81},{\"position\":3,\"driverNumber\":1},{\"position\":4,\"driverNumber\":63},{\"position\":5,\"driverNumber\":14},{\"position\":6,\"driverNumber\":44},{\"position\":7,\"driverNumber\":16},{\"position\":8,\"driverNumber\":18},{\"position\":9,\"driverNumber\":22},{\"position\":10,\"driverNumber\":6}],\"sprintPositions\":[],\"additionalPredictions\":{\"pole\":4,\"fastestLap\":81,\"positionsGained\":30}}"}
- {"PK": "prediction#c16be5f0-4051-7067-0b8d-0f2c130e1b87#azerbaijan2025", "SK": "RACEPREDICTION", "__typename": "ApexEntity", "entityType": "PREDICTION", "user_id": "c16be5f0-4051-7067-0b8d-0f2c130e1b87", "points": 0, "updatedAt": "2025-09-21T19:57:42.830121Z", "predictions": "{\"gridOrder\":[{\"position\":1,\"driverNumber\":16},{\"position\":2,\"driverNumber\":44},{\"position\":3,\"driverNumber\":81},{\"position\":4,\"driverNumber\":4},{\"position\":5,\"driverNumber\":1},{\"position\":6,\"driverNumber\":63},{\"position\":7,\"driverNumber\":23},{\"position\":8,\"driverNumber\":47},{\"position\":9,\"driverNumber\":87},{\"position\":10,\"driverNumber\":30}],\"sprintPositions\":[],\"additionalPredictions\":{\"pole\":81,\"fastestLap\":4,\"positionsGained\":1}}"}


## LEADERBOARD
Keys:
- PK pattern: user#{...}
- SK pattern: TOTALPOINTS
Attributes
- required: __typename, createdAt, entityType, points, races, updatedAt, user_id, username
- optional: season
Indexes
- apexEntitiesByLeague_idAndCreatedAt: PK=league_id, SK=createdAt, PROJECTION=ALL
- apexEntitiesByEntityTypeAndCreatedAt: PK=entityType, SK=createdAt, PROJECTION=ALL
- apexEntitiesBySeasonAndPoints: PK=season, SK=points, PROJECTION=ALL
- apexEntitiesByEntityTypeAndPoints: PK=entityType, SK=points, PROJECTION=ALL
- apexEntitiesBySeason: PK=season, SK=null, PROJECTION=ALL
- apexEntitiesByUser_idAndCreatedAt: PK=user_id, SK=createdAt, PROJECTION=ALL
Access Patterns (canonical)  # ← fill/curate as needed
- GetLeaderboardByPK/SK: GetItem(PK=?, SK=?)
- ListLeaderboardByPK: Query PK=? [optional begins_with(SK,'Leaderboard#')]
Examples
- {"PK": "user#51bb4550-e0f1-7030-685e-0ba0e382668c#season#2025", "SK": "TOTALPOINTS", "__typename": "ApexEntity", "entityType": "LEADERBOARD", "user_id": "51bb4550-e0f1-7030-685e-0ba0e382668c", "season": "2025", "points": 196, "updatedAt": "2025-11-10T18:56:10.801021Z"}
- {"PK": "user#710bf5d0-0031-70ba-f09a-b85ac206dae5#season#2025", "SK": "TOTALPOINTS", "__typename": "ApexEntity", "entityType": "LEADERBOARD", "user_id": "710bf5d0-0031-70ba-f09a-b85ac206dae5", "season": "2025", "updatedAt": "2025-08-19T15:00:20.321Z", "points": 0}


## RACE
Keys:
- PK pattern: race#{...}
- SK pattern: DETAILS
Attributes
- required: category, circuit, country, createdAt, entityType, has_sprint, qualy_date, race_date, race_id, race_name, season, status, updatedAt
- optional: —
Indexes
- apexEntitiesByLeague_idAndCreatedAt: PK=league_id, SK=createdAt, PROJECTION=ALL
- apexEntitiesByEntityTypeAndCreatedAt: PK=entityType, SK=createdAt, PROJECTION=ALL
- apexEntitiesBySeasonAndPoints: PK=season, SK=points, PROJECTION=ALL
- apexEntitiesByEntityTypeAndPoints: PK=entityType, SK=points, PROJECTION=ALL
- apexEntitiesByRace_id: PK=race_id, SK=null, PROJECTION=ALL
- apexEntitiesByStatus: PK=status, SK=null, PROJECTION=ALL
- apexEntitiesBySeason: PK=season, SK=null, PROJECTION=ALL
- apexEntitiesByUser_idAndCreatedAt: PK=user_id, SK=createdAt, PROJECTION=ALL
Access Patterns (canonical)  # ← fill/curate as needed
- GetRaceByPK/SK: GetItem(PK=?, SK=?)
- ListRaceByPK: Query PK=? [optional begins_with(SK,'Race#')]
Examples
- {"PK": "race#australia2025", "SK": "DETAILS", "entityType": "RACE", "circuit": "Albert Park Circuit", "season": "2025", "status": "completed", "qualy_date": "2025-03-15T04:00:00Z", "createdAt": "2025-07-30T01:20:12.915258Z"}
- {"PK": "race#japan2025", "SK": "DETAILS", "entityType": "RACE", "circuit": "Suzuka Circuit", "season": "2025", "status": "completed", "qualy_date": "2025-04-05T06:00:00Z", "createdAt": "2025-07-30T01:20:12.915258Z"}


## LEAGUE_LEADERBOARD
Keys:
- PK pattern: user#{...}
- SK pattern: TOTALPOINTS
Attributes
- required: __typename, createdAt, entityType, league_id, points, races, updatedAt, user_id, username
- optional: season
Indexes
- apexEntitiesByLeague_idAndCreatedAt: PK=league_id, SK=createdAt, PROJECTION=ALL
- apexEntitiesByEntityTypeAndCreatedAt: PK=entityType, SK=createdAt, PROJECTION=ALL
- apexEntitiesBySeasonAndPoints: PK=season, SK=points, PROJECTION=ALL
- apexEntitiesByEntityTypeAndPoints: PK=entityType, SK=points, PROJECTION=ALL
- apexEntitiesBySeason: PK=season, SK=null, PROJECTION=ALL
- apexEntitiesByUser_idAndCreatedAt: PK=user_id, SK=createdAt, PROJECTION=ALL
Access Patterns (canonical)  # ← fill/curate as needed
- GetLeague_LeaderboardByPK/SK: GetItem(PK=?, SK=?)
- ListLeague_LeaderboardByPK: Query PK=? [optional begins_with(SK,'League_Leaderboard#')]
Examples
- {"PK": "user#612b45e0-f0e1-7019-4620-ec02b637cc4e#season#2025#league#league_1756661141_783b929f", "SK": "TOTALPOINTS", "__typename": "ApexEntity", "entityType": "LEAGUE_LEADERBOARD", "user_id": "612b45e0-f0e1-7019-4620-ec02b637cc4e", "season": "2025", "league_id": "league_1756661141_783b929f", "updatedAt": "2025-11-10T21:41:46Z"}
- {"PK": "user#017b0550-8021-70dc-de43-6fe169a0fb3e#season#2025#league#league_1759523892330_m8xr0qazy", "SK": "TOTALPOINTS", "__typename": "ApexEntity", "entityType": "LEAGUE_LEADERBOARD", "user_id": "017b0550-8021-70dc-de43-6fe169a0fb3e", "season": "2025", "league_id": "league_1759523892330_m8xr0qazy", "updatedAt": "2025-11-10T21:41:46Z"}


## USER
Keys:
- PK pattern: user#{...}
- SK pattern: PROFILE
Attributes
- required: __typename, createdAt, email, entityType, updatedAt, user_id, username
- optional: —
Indexes
- apexEntitiesByLeague_idAndCreatedAt: PK=league_id, SK=createdAt, PROJECTION=ALL
- apexEntitiesByEntityTypeAndCreatedAt: PK=entityType, SK=createdAt, PROJECTION=ALL
- apexEntitiesByEntityTypeAndPoints: PK=entityType, SK=points, PROJECTION=ALL
- apexEntitiesByUser_idAndCreatedAt: PK=user_id, SK=createdAt, PROJECTION=ALL
Access Patterns (canonical)  # ← fill/curate as needed
- GetUserByPK/SK: GetItem(PK=?, SK=?)
- ListUserByPK: Query PK=? [optional begins_with(SK,'User#')]
Examples
- {"PK": "user#c16be5f0-4051-7067-0b8d-0f2c130e1b87", "SK": "PROFILE", "__typename": "ApexEntity", "entityType": "USER", "user_id": "c16be5f0-4051-7067-0b8d-0f2c130e1b87", "updatedAt": "2025-08-29T17:30:21.189Z", "createdAt": "2025-08-29T17:30:21.060Z", "username": "ja279Apex"}
- {"PK": "user#817bd500-c0b1-7049-5c0b-e81a287362df", "SK": "PROFILE", "__typename": "ApexEntity", "entityType": "USER", "user_id": "817bd500-c0b1-7049-5c0b-e81a287362df", "updatedAt": "2025-10-10T11:19:29.591Z", "createdAt": "2025-10-10T11:19:29.144Z", "username": "Ooooo"}


## DRIVER
Keys:
- PK pattern: driver#{...}
- SK pattern: SEASON#{...}
Attributes
- required: birthDate, category, createdAt, driver_id, entityType, imageUrl, isActive, name, nationality, number, season, team, teamColor, updatedAt
- optional: —
Indexes
- apexEntitiesByLeague_idAndCreatedAt: PK=league_id, SK=createdAt, PROJECTION=ALL
- apexEntitiesByEntityTypeAndCreatedAt: PK=entityType, SK=createdAt, PROJECTION=ALL
- apexEntitiesBySeasonAndPoints: PK=season, SK=points, PROJECTION=ALL
- apexEntitiesByEntityTypeAndPoints: PK=entityType, SK=points, PROJECTION=ALL
- apexEntitiesBySeason: PK=season, SK=null, PROJECTION=ALL
- apexEntitiesByUser_idAndCreatedAt: PK=user_id, SK=createdAt, PROJECTION=ALL
Access Patterns (canonical)  # ← fill/curate as needed
- GetDriverByPK/SK: GetItem(PK=?, SK=?)
- ListDriverByPK: Query PK=? [optional begins_with(SK,'Driver#')]
Examples
- {"PK": "driver#driver_isack_hadjar", "SK": "SEASON#2025", "entityType": "DRIVER", "nationality": "Unknown", "season": "2025", "birthDate": "Unknown", "teamColor": "#1E41FF", "driver_id": "driver_isack_hadjar"}
- {"PK": "driver#driver_max_verstappen", "SK": "SEASON#2025", "entityType": "DRIVER", "nationality": "Unknown", "season": "2025", "birthDate": "Unknown", "teamColor": "#3671C6", "driver_id": "driver_max_verstappen"}


## LEAGUE_MEMBER
Keys:
- PK pattern: league#{...}
- SK pattern: member#{...}
Attributes
- required: createdAt, entityType, league_id, role, updatedAt, user_id, username
- optional: __typename
Indexes
- apexEntitiesByLeague_idAndCreatedAt: PK=league_id, SK=createdAt, PROJECTION=ALL
- apexEntitiesByEntityTypeAndCreatedAt: PK=entityType, SK=createdAt, PROJECTION=ALL
- apexEntitiesByEntityTypeAndPoints: PK=entityType, SK=points, PROJECTION=ALL
- apexEntitiesByUser_idAndCreatedAt: PK=user_id, SK=createdAt, PROJECTION=ALL
Access Patterns (canonical)  # ← fill/curate as needed
- GetLeague_MemberByPK/SK: GetItem(PK=?, SK=?)
- ListLeague_MemberByPK: Query PK=? [optional begins_with(SK,'League_Member#')]
Examples
- {"PK": "league#league_1756501360381_2qendu23t", "SK": "member#61cbf510-20d1-7047-5006-b3ae8d8fb6e5", "__typename": "ApexEntity", "entityType": "LEAGUE_MEMBER", "user_id": "61cbf510-20d1-7047-5006-b3ae8d8fb6e5", "role": "admin", "league_id": "league_1756501360381_2qendu23t", "updatedAt": "2025-08-29T21:02:41.371Z"}
- {"PK": "league#league_1756501360381_2qendu23t", "SK": "member#91db5500-5061-7084-62d6-fb5c041f0c57", "__typename": "ApexEntity", "entityType": "LEAGUE_MEMBER", "user_id": "91db5500-5061-7084-62d6-fb5c041f0c57", "role": "member", "league_id": "league_1756501360381_2qendu23t", "updatedAt": "2025-08-29T21:03:35.688Z"}


## RACE_RESULT
Keys:
- PK pattern: race#{...}
- SK pattern: RACERESULT
Attributes
- required: createdAt, entityType, race_id, results, updatedAt
- optional: —
Indexes
- apexEntitiesByLeague_idAndCreatedAt: PK=league_id, SK=createdAt, PROJECTION=ALL
- apexEntitiesByEntityTypeAndCreatedAt: PK=entityType, SK=createdAt, PROJECTION=ALL
- apexEntitiesByEntityTypeAndPoints: PK=entityType, SK=points, PROJECTION=ALL
- apexEntitiesByRace_id: PK=race_id, SK=null, PROJECTION=ALL
- apexEntitiesByUser_idAndCreatedAt: PK=user_id, SK=createdAt, PROJECTION=ALL
Access Patterns (canonical)  # ← fill/curate as needed
- GetRace_ResultByPK/SK: GetItem(PK=?, SK=?)
- ListRace_ResultByPK: Query PK=? [optional begins_with(SK,'Race_Result#')]
Examples
- {"PK": "race#unitedstates2025", "SK": "RACERESULT", "entityType": "RACE_RESULT", "updatedAt": "2025-10-20T05:38:45.964454Z", "race_id": "unitedstates2025", "createdAt": "2025-10-20T05:38:45.964175Z", "results": "{\"gridOrder\": [{\"driverNumber\": 1, \"position\": 1}, {\"driverNumber\": 4, \"position\": 2}, {\"driverNumber\": 16, \"position\": 3}, {\"driverNumber\": 44, \"position\": 4}, {\"driverNumber\": 81, \"position\": 5}, {\"driverNumber\": 63, \"position\": 6}, {\"driverNumber\": 22, \"position\": 7}, {\"driverNumber\": 27, \"position\": 8}, {\"driverNumber\": 87, \"position\": 9}, {\"driverNumber\": 14, \"position\": 10}, {\"driverNumber\": 30, \"position\": 11}, {\"driverNumber\": 18, \"position\": 12}], \"sprintPositions\": [{\"driverNumber\": 1, \"position\": 1}, {\"driverNumber\": 63, \"position\": 2}, {\"driverNumber\": 55, \"position\": 3}], \"additionalPredictions\": {\"positionsGained\": 22, \"pole\": 1, \"fastestLap\": 12}}"}
- {"PK": "race#azerbaijan2025", "SK": "RACERESULT", "entityType": "RACE_RESULT", "updatedAt": "2025-10-03T20:17:19.320315Z", "race_id": "azerbaijan2025", "createdAt": "2025-10-03T20:17:19.320302Z", "results": "{\"gridOrder\": [{\"driverNumber\": 1, \"position\": 1}, {\"driverNumber\": 63, \"position\": 2}, {\"driverNumber\": 55, \"position\": 3}, {\"driverNumber\": 12, \"position\": 4}, {\"driverNumber\": 30, \"position\": 5}, {\"driverNumber\": 22, \"position\": 6}, {\"driverNumber\": 4, \"position\": 7}, {\"driverNumber\": 44, \"position\": 8}, {\"driverNumber\": 16, \"position\": 9}, {\"driverNumber\": 6, \"position\": 10}, {\"driverNumber\": 5, \"position\": 11}, {\"driverNumber\": 87, \"position\": 12}], \"sprintPositions\": [], \"additionalPredictions\": {\"positionsGained\": 23, \"pole\": 1, \"fastestLap\": 1}}"}


## LEAGUE
Keys:
- PK pattern: league#{...}
- SK pattern: DETAILS
Attributes
- required: createdAt, creator_id, description, entityType, is_private, league_id, league_name, max_members, member_count, updatedAt
- optional: __typename, join_code
Indexes
- apexEntitiesByLeague_idAndCreatedAt: PK=league_id, SK=createdAt, PROJECTION=ALL
- apexEntitiesByEntityTypeAndCreatedAt: PK=entityType, SK=createdAt, PROJECTION=ALL
- apexEntitiesByJoin_code: PK=join_code, SK=null, PROJECTION=ALL
- apexEntitiesByEntityTypeAndPoints: PK=entityType, SK=points, PROJECTION=ALL
- apexEntitiesByUser_idAndCreatedAt: PK=user_id, SK=createdAt, PROJECTION=ALL
Access Patterns (canonical)  # ← fill/curate as needed
- GetLeagueByPK/SK: GetItem(PK=?, SK=?)
- ListLeagueByPK: Query PK=? [optional begins_with(SK,'League#')]
Examples
- {"PK": "league#league_1756501360381_2qendu23t", "SK": "DETAILS", "__typename": "ApexEntity", "entityType": "LEAGUE", "max_members": 50, "createdAt": "2025-08-29T21:02:40.849Z", "join_code": "B9MWDW", "member_count": 4}
- {"PK": "league#league_1759523892330_m8xr0qazy", "SK": "DETAILS", "__typename": "ApexEntity", "entityType": "LEAGUE", "max_members": 100, "createdAt": "2025-10-03T20:38:12.848Z", "join_code": "QXFTXX", "member_count": 2}

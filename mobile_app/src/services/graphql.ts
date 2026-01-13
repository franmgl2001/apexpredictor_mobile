/**
 * Main GraphQL service file - re-exports all queries and types
 * This maintains backwards compatibility with existing imports
 */

// Re-export all types
export type {
    ApexEntity,
    GetApexEntityResponse,
    ListApexEntitiesResponse,
    LeaderboardByPointsResponse,
    ModelStringKeyConditionInput,
    ModelApexEntityFilterInput,
    ModelIntKeyConditionInput,
    ModelSortDirection,
} from './graphql/types';

// Re-export entity queries
export { getApexEntity, listApexEntities, listApexEntitiesNoDateTime } from './graphql/entities';

// Re-export user queries and mutations
export { getMyProfile, saveUserProfile } from './graphql/users';

// Re-export race queries
export { getRaceResults, getSeasonData, getRaces, getResults, normalizeCategory, type SeasonData, type Race } from './graphql/races';

// Re-export driver queries
export { getDrivers } from './graphql/drivers';

// Re-export leaderboard queries
export { getLeaderboard, getLeaderboardPredictions } from './graphql/leaderboard';

// Re-export league queries
export { getUserLeagues, getLeagues, getLeagueMembers, getLeagueLeaderboard, getLeagueRacePredictions } from './graphql/leagues';

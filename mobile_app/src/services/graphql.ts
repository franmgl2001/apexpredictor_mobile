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
export { getApexEntity, listApexEntities } from './graphql/entities';

// Re-export user queries
export { getUserProfile, getUserPredictions } from './graphql/users';

// Re-export race queries
export { getRaceDetails } from './graphql/races';

// Re-export driver queries
export { getDrivers } from './graphql/drivers';

// Re-export leaderboard queries
export { getLeaderboard } from './graphql/leaderboard';

// Re-export league queries
export { getLeagues, getUserLeagues } from './graphql/leagues';

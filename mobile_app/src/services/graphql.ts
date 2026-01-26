/**
 * Main GraphQL service file - re-exports all queries and types
 * This maintains backwards compatibility with existing imports
 */

// Re-export user queries, mutations, and types
export { getMyProfile, saveUserProfile, type UserProfile } from './graphql/users';

// Re-export race queries
export { getRaceResults, getSeasonData, getRaces, getResults, normalizeCategory, type SeasonData, type Race, type Result } from './graphql/races';

// Re-export driver queries and types
export { getDrivers, type Driver } from './graphql/drivers';

// Re-export leaderboard queries and mutations
export {
    getLeaderboard,
    getMyLeaderboardEntry,
    upsertLeaderboardEntry,
    ensureLeaderboardEntry,
    type LeaderboardEntry,
    type LeaderboardConnection,
} from './graphql/leaderboard';

// Re-export prediction queries and mutations
export { upsertPrediction, listMyPredictions, getRaceLeaderboard } from './graphql/predictions';

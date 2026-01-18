/**
 * Leaderboard-related GraphQL queries and mutations
 * Functions for fetching and managing leaderboard data
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client } from './client';
import { requestLogger } from './requestLogger';
import { fetchAuthSession } from 'aws-amplify/auth';

// Types for leaderboard
export interface LeaderboardEntry {
  PK: string;
  SK: string;
  entityType: string;
  userId: string;
  category: string;
  season: string;
  totalPoints: number;
  username: string;
  numberOfRaces: number;
  nationality?: string;
  byUserPK: string;
  byUserSK: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaderboardConnection {
  items: LeaderboardEntry[];
  nextToken: string | null;
}

// GraphQL Queries
const GET_LEADERBOARD = /* GraphQL */ `
    query GetLeaderboard($category: String!, $season: String!, $limit: Int, $nextToken: String) {
        getLeaderboard(category: $category, season: $season, limit: $limit, nextToken: $nextToken) {
            items {
                PK
                SK
                entityType
                userId
                category
                season
                totalPoints
                username
                numberOfRaces
                nationality
                byUserPK
                byUserSK
                createdAt
                updatedAt
            }
            nextToken
        }
    }
`;

const GET_MY_LEADERBOARD_ENTRY = /* GraphQL */ `
    query GetMyLeaderboardEntry($category: String!, $season: String!) {
        getMyLeaderboardEntry(category: $category, season: $season) {
            PK
            SK
            entityType
            userId
            category
            season
            totalPoints
            username
            numberOfRaces
            nationality
            byUserPK
            byUserSK
            createdAt
            updatedAt
        }
    }
`;

const UPSERT_LEADERBOARD_ENTRY = /* GraphQL */ `
    mutation UpsertLeaderboardEntry($input: UpsertLeaderboardEntryInput!) {
        upsertLeaderboardEntry(input: $input) {
            PK
            SK
            entityType
            userId
            category
            season
            totalPoints
            username
            numberOfRaces
            nationality
            byUserPK
            byUserSK
            createdAt
            updatedAt
        }
    }
`;

// Response types
interface GetLeaderboardResponse {
  getLeaderboard: LeaderboardConnection;
}

interface GetMyLeaderboardEntryResponse {
  getMyLeaderboardEntry: LeaderboardEntry | null;
}

interface UpsertLeaderboardEntryResponse {
  upsertLeaderboardEntry: LeaderboardEntry;
}

/**
 * Fetches the leaderboard for a specific category and season
 * @param category The category (e.g., "F1")
 * @param season The season year (e.g., "2026")
 * @param limit Optional limit (default: 50)
 * @param nextToken Optional pagination token
 * @returns LeaderboardConnection with items and nextToken
 */
export async function getLeaderboard(
  category: string,
  season: string,
  limit: number = 50,
  nextToken?: string
): Promise<LeaderboardConnection> {
  await fetchAuthSession();

  const startTime = Date.now();
  const logId = requestLogger.logRequest('getLeaderboard', { category, season, limit });

  try {
    const result = await client.graphql({
      query: GET_LEADERBOARD,
      variables: {
        category,
        season,
        limit,
        nextToken,
      },
    }) as GraphQLResult<GetLeaderboardResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message || 'Failed to fetch leaderboard');
    }

    const data = result.data?.getLeaderboard || { items: [], nextToken: null };
    requestLogger.logSuccess(logId, data.items.length, duration);
    return data;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}

/**
 * Fetches the current user's leaderboard entry for a specific category and season
 * @param category The category (e.g., "F1")
 * @param season The season year (e.g., "2026")
 * @returns LeaderboardEntry or null if not found
 */
export async function getMyLeaderboardEntry(
  category: string,
  season: string
): Promise<LeaderboardEntry | null> {
  await fetchAuthSession();

  const startTime = Date.now();
  const logId = requestLogger.logRequest('getMyLeaderboardEntry', { category, season });

  try {
    const result = await client.graphql({
      query: GET_MY_LEADERBOARD_ENTRY,
      variables: {
        category,
        season,
      },
    }) as GraphQLResult<GetMyLeaderboardEntryResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message || 'Failed to fetch leaderboard entry');
    }

    const entry = result.data?.getMyLeaderboardEntry || null;
    requestLogger.logSuccess(logId, entry ? 1 : 0, duration);
    return entry;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}

/**
 * Creates or updates the current user's leaderboard entry
 * @param category The category (e.g., "F1")
 * @param season The season year (e.g., "2026")
 * @param totalPoints The total points (default: 0)
 * @param username The user's display name
 * @param numberOfRaces Number of races participated (default: 0)
 * @param nationality The user's nationality/country code (e.g., "ES", "GB")
 * @returns The created/updated LeaderboardEntry
 */
export async function upsertLeaderboardEntry(
  category: string,
  season: string,
  totalPoints: number,
  username: string,
  numberOfRaces: number,
  nationality?: string
): Promise<LeaderboardEntry> {
  await fetchAuthSession();

  const startTime = Date.now();
  const logId = requestLogger.logRequest('upsertLeaderboardEntry', {
    category,
    season,
    totalPoints,
    username,
    numberOfRaces,
    nationality,
  });

  try {
    const result = await client.graphql({
      query: UPSERT_LEADERBOARD_ENTRY,
      variables: {
        input: {
          category,
          season,
          totalPoints,
          username,
          numberOfRaces,
          nationality,
        },
      },
    }) as GraphQLResult<UpsertLeaderboardEntryResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message || 'Failed to upsert leaderboard entry');
    }

    if (!result.data?.upsertLeaderboardEntry) {
      throw new Error('Failed to upsert leaderboard entry: No data returned');
    }

    const entry = result.data.upsertLeaderboardEntry;
    requestLogger.logSuccess(logId, 1, duration);
    return entry;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}

/**
 * Ensures the current user has a leaderboard entry, creating one if it doesn't exist
 * @param category The category (e.g., "F1")
 * @param season The season year (e.g., "2026")
 * @param username The user's display name (used when creating new entry)
 * @param nationality The user's nationality/country code (e.g., "ES", "GB")
 * @returns The existing or newly created LeaderboardEntry
 */
export async function ensureLeaderboardEntry(
  category: string,
  season: string,
  username: string,
  nationality?: string
): Promise<LeaderboardEntry> {
  // First, try to get existing entry
  const existingEntry = await getMyLeaderboardEntry(category, season);

  if (existingEntry) {
    return existingEntry;
  }

  // Entry doesn't exist, create a new one with 0 points and 0 races
  return await upsertLeaderboardEntry(category, season, 0, username, 0, nationality);
}

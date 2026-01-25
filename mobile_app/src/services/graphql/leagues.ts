/**
 * League-related GraphQL queries and mutations
 * Functions for creating and managing leagues
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client } from './client';
import { requestLogger } from './requestLogger';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getLeaderboard, getLeaderboardsByUserId, type LeaderboardEntry } from './leaderboard';
import { getMyProfile } from './users';
import { listMyPredictions } from './predictions';

// Types for leagues
export interface League {
  PK: string;
  SK: string;
  entityType: string;
  leagueId: string;
  name: string;
  createdByUserId: string;
  createdAt: string;
  byCode: string;
  description?: string;
}

// GraphQL Mutations
const CREATE_LEAGUE = /* GraphQL */ `
    mutation CreateLeague($input: CreateLeagueInput!) {
        createLeague(input: $input) {
            PK
            SK
            entityType
            leagueId
            name
            createdByUserId
            createdAt
            byCode
            description
        }
    }
`;

const CREATE_LEAGUE_MEMBER = /* GraphQL */ `
    mutation CreateLeagueMember($input: CreateLeagueMemberInput!) {
        createLeagueMember(input: $input) {
            PK
            SK
            entityType
            leagueId
            userId
            username
            role
            leagueName
            code
            description
            createdAt
            updatedAt
        }
    }
`;

const BATCH_CREATE_LEAGUE_LEADERBOARD_ENTRIES = /* GraphQL */ `
    mutation BatchCreateLeagueLeaderboardEntries($entries: [LeagueLeaderboardEntryInput!]!) {
        batchCreateLeagueLeaderboardEntries(entries: $entries)
    }
`;

const BATCH_CREATE_LEAGUE_PREDICTION_ENTRIES = /* GraphQL */ `
    mutation BatchCreateLeaguePredictionEntries($entries: [LeaguePredictionEntryInput!]!) {
        batchCreateLeaguePredictionEntries(entries: $entries)
    }
`;

// GraphQL Queries
const GET_MY_LEAGUES = /* GraphQL */ `
    query GetMyLeagues($limit: Int, $nextToken: String) {
        getMyLeagues(limit: $limit, nextToken: $nextToken) {
            items {
                PK
                SK
                entityType
                leagueId
                userId
                username
                role
                leagueName
                code
                description
                createdAt
                updatedAt
            }
            nextToken
        }
    }
`;

const GET_LEAGUE_MEMBERS = /* GraphQL */ `
    query GetLeagueMembers($leagueId: String!, $limit: Int, $nextToken: String) {
        getLeagueMembers(leagueId: $leagueId, limit: $limit, nextToken: $nextToken) {
            items {
                PK
                SK
                entityType
                leagueId
                userId
                username
                role
                leagueName
                code
                description
                createdAt
                updatedAt
            }
            nextToken
        }
    }
`;

const GET_LEAGUE_LEADERBOARD = /* GraphQL */ `
    query GetLeagueLeaderboard($leagueId: String!, $category: String!, $season: String!, $limit: Int, $nextToken: String) {
        getLeagueLeaderboard(leagueId: $leagueId, category: $category, season: $season, limit: $limit, nextToken: $nextToken) {
            items {
                PK
                SK
                entityType
                leagueId
                userId
                category
                season
                totalPoints
                username
                numberOfRaces
                nationality
            }
            nextToken
        }
    }
`;

const GET_LEAGUE_BY_CODE = /* GraphQL */ `
    query GetLeagueByCode($byCode: String!) {
        getLeagueByCode(byCode: $byCode) {
            PK
            SK
            entityType
            leagueId
            name
            createdByUserId
            createdAt
            byCode
            description
        }
    }
`;

// Response types
interface CreateLeagueResponse {
  createLeague: League;
}

interface CreateLeagueMemberResponse {
  createLeagueMember: LeagueMember;
}

interface GetLeagueByCodeResponse {
  getLeagueByCode: League | null;
}

interface GetLeagueMembersResponse {
  getLeagueMembers: LeagueMemberConnection;
}

interface GetLeagueLeaderboardResponse {
  getLeagueLeaderboard: LeagueLeaderboardConnection;
}

export interface LeagueLeaderboardEntry {
  PK: string;
  SK: string;
  entityType: string;
  leagueId: string;
  userId: string;
  category: string;
  season: string;
  totalPoints: number;
  username: string;
  numberOfRaces: number;
  nationality?: string;
}

export interface LeagueLeaderboardConnection {
  items: LeagueLeaderboardEntry[];
  nextToken: string | null;
}

export interface LeagueMember {
  PK: string;
  SK: string;
  entityType: string;
  leagueId: string;
  userId: string;
  username?: string;
  role: string;
  leagueName?: string;
  code?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeagueMemberConnection {
  items: LeagueMember[];
  nextToken: string | null;
}

export interface LeagueMemberConnection {
  items: LeagueMember[];
  nextToken: string | null;
}

interface GetMyLeaguesResponse {
  getMyLeagues: LeagueMemberConnection;
}

/**
 * Creates a new league and copies leaderboard entries from total points
 * @param name League name
 * @param description Optional league description
 * @param category Category (e.g., "F1")
 * @param season Season year (e.g., "2026")
 * @returns Created League with join code
 */
export async function createLeague(
  name: string,
  description: string,
  category: string,
  season: string
): Promise<League> {
  await fetchAuthSession();

  const startTime = Date.now();
  const logId = requestLogger.logRequest('createLeague', {
    name,
    description,
    category,
    season,
  });

  try {
    // Step 1: Create the league
    const result = await client.graphql({
      query: CREATE_LEAGUE,
      variables: {
        input: {
          name,
          description: description || '',
          category,
          season,
        },
      },
    }) as GraphQLResult<CreateLeagueResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message || 'Failed to create league');
    }

    if (!result.data?.createLeague) {
      throw new Error('Failed to create league: No data returned');
    }

    const league = result.data.createLeague;
    requestLogger.logSuccess(logId, 1, duration);

    // Step 2: Create the league member (admin role)
    try {
      console.log('Creating league member for league:', league.leagueId, league.name);
      const memberResult = await client.graphql({
        query: CREATE_LEAGUE_MEMBER,
        variables: {
          input: {
            leagueId: league.leagueId,
            leagueName: league.name,
            role: 'admin',
            code: league.byCode
          },
        },
      }) as GraphQLResult<CreateLeagueMemberResponse>;

      if (memberResult.errors && memberResult.errors.length > 0) {
        console.error('GraphQL errors in createLeagueMember:', memberResult.errors);
        const firstError = memberResult.errors[0];
        const errorMessage = firstError.message || JSON.stringify(firstError);
        throw new Error(`Failed to create league member: ${errorMessage}`);
      }

      if (!memberResult.data?.createLeagueMember) {
        console.error('No data returned from createLeagueMember. Result:', memberResult);
        throw new Error('Failed to create league member: No data returned');
      }

      console.log('League member created successfully:', memberResult.data.createLeagueMember);
    } catch (memberError: any) {
      console.error('Detailed error in createLeagueMember:', memberError);

      // Extract the most useful error message
      let message = 'Unknown error';
      if (typeof memberError === 'string') {
        message = memberError;
      } else if (memberError.message) {
        message = memberError.message;
      } else if (memberError.errors && memberError.errors[0] && memberError.errors[0].message) {
        message = memberError.errors[0].message;
      } else {
        message = JSON.stringify(memberError);
      }

      throw new Error(`League created but failed to add you as a member: ${message}`);
    }

    // Step 3: Copy global leaderboard to league leaderboard
    try {
      console.log('Copying global leaderboard to league:', league.leagueId);

      // Get the current user's profile to get their userId
      const userProfile = await getMyProfile();
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Get all leaderboard entries for the current user across all categories/seasons
      const userLeaderboards = await getLeaderboardsByUserId(userProfile.userId, 100);
      console.log(`[League Creation] Found ${userLeaderboards.items.length} leaderboard entries for user`);

      if (userLeaderboards.items.length > 0) {
        // Map entries and create a unique key for deduplication
        // The unique key should match what will be in DynamoDB: category + season + userId + totalPoints
        // (since SK includes points, same user with same category/season/points = duplicate)
        const entryMap = new Map<string, typeof userLeaderboards.items[0]>();

        userLeaderboards.items.forEach((entry, index) => {
          // Normalize category to lowercase to match backend SK generation
          const normalizedCategory = entry.category.toLowerCase();
          // Create a unique key that matches the DynamoDB SK structure
          // SK format: PT#<paddedPoints>#<category>#<season>#<userId>
          // Backend converts category to lowercase, so we must too
          const uniqueKey = `${normalizedCategory}_${entry.season}_${entry.userId}_${entry.totalPoints}`;
          console.log(`[League Creation] Entry ${index}: category=${entry.category} (normalized: ${normalizedCategory}), season=${entry.season}, userId=${entry.userId}, points=${entry.totalPoints}, uniqueKey=${uniqueKey}`);

          // Only keep the first entry if there are duplicates
          if (!entryMap.has(uniqueKey)) {
            entryMap.set(uniqueKey, entry);
            console.log(`[League Creation] Added entry with key: ${uniqueKey}`);
          } else {
            console.log(`[League Creation] DUPLICATE DETECTED - skipping entry with key: ${uniqueKey} (original category: ${entry.category})`);
          }
        });

        const uniqueEntries = Array.from(entryMap.values());
        console.log(`[League Creation] After deduplication: ${uniqueEntries.length} unique entries (removed ${userLeaderboards.items.length - uniqueEntries.length} duplicates)`);

        const entries = uniqueEntries.map(entry => {
          // Extract padded points from byLeaderboardSK if available
          // Format: <paddedPoints>#USER#<userId>
          let pointsPadded: string | undefined = undefined;
          if (entry.byLeaderboardSK) {
            const parts = entry.byLeaderboardSK.split('#');
            if (parts.length > 0) {
              pointsPadded = parts[0];
            }
          }

          return {
            leagueId: league.leagueId,
            userId: entry.userId,
            username: entry.username,
            totalPoints: entry.totalPoints,
            numberOfRaces: entry.numberOfRaces,
            nationality: entry.nationality || '',
            category: entry.category.toLowerCase(), // Normalize to lowercase to match backend
            season: entry.season,
            pointsPadded: pointsPadded, // Pass the padded points from source entry
          };
        });

        console.log(`[League Creation] Prepared ${entries.length} entries to copy to league ${league.leagueId}`);

        // Batch write in chunks of 25 (DynamoDB limit)
        // Also deduplicate within each chunk to prevent duplicate key errors
        let totalCopied = 0;
        for (let i = 0; i < entries.length; i += 25) {
          const chunk = entries.slice(i, i + 25);
          console.log(`[League Creation] Processing chunk ${Math.floor(i / 25) + 1} with ${chunk.length} entries`);

          // Create a map to ensure uniqueness within this chunk using the same key format
          const chunkMap = new Map<string, typeof entries[0]>();
          chunk.forEach(entry => {
            // Category is already normalized to lowercase in entries array
            const uniqueKey = `${entry.category}_${entry.season}_${entry.userId}_${entry.totalPoints}`;
            if (!chunkMap.has(uniqueKey)) {
              chunkMap.set(uniqueKey, entry);
            } else {
              console.log(`[League Creation] DUPLICATE IN CHUNK - skipping: ${uniqueKey}`);
            }
          });
          const uniqueChunk = Array.from(chunkMap.values());

          console.log(`[League Creation] Chunk ${Math.floor(i / 25) + 1}: ${uniqueChunk.length} unique entries (removed ${chunk.length - uniqueChunk.length} duplicates)`);

          if (uniqueChunk.length > 0) {
            console.log(`[League Creation] Sending batch with entries:`, uniqueChunk.map(e => ({
              category: e.category,
              season: e.season,
              userId: e.userId,
              points: e.totalPoints
            })));

            await client.graphql({
              query: BATCH_CREATE_LEAGUE_LEADERBOARD_ENTRIES,
              variables: { entries: uniqueChunk },
            });

            totalCopied += uniqueChunk.length;
            console.log(`[League Creation] Successfully copied chunk ${Math.floor(i / 25) + 1} (${uniqueChunk.length} entries)`);
          }
        }
        console.log(`[League Creation] Successfully copied ${totalCopied} unique leaderboard entries to league ${league.leagueId}`);
      } else {
        console.log(`[League Creation] No leaderboard entries found for user, skipping copy`);
      }
    } catch (copyError) {
      console.error('Error copying leaderboard to league:', copyError);
      // We don't throw here to avoid failing the whole league creation
      // since the league and member are already created.
    }

    // Step 4: Copy all predictions to league predictions
    try {
      console.log('[League Creation] Copying predictions to league:', league.leagueId);

      // Get all predictions for the current user
      const userPredictions = await listMyPredictions(undefined, undefined, 100);
      console.log(`[League Creation] Found ${userPredictions.length} predictions for user`);

      if (userPredictions.length > 0) {
        const predictionEntries = userPredictions.map(prediction => {
          // Extract padded points from byLeaderboardSK if available
          let pointsPadded: string | undefined = undefined;
          if ((prediction as any).byLeaderboardSK) {
            const parts = (prediction as any).byLeaderboardSK.split('#');
            if (parts.length > 0) {
              pointsPadded = parts[0];
            }
          }

          return {
            leagueId: league.leagueId,
            userId: prediction.userId,
            category: prediction.category,
            season: prediction.season,
            raceId: prediction.raceId,
            prediction: prediction.prediction,
            points: prediction.points,
            pointsPadded: pointsPadded,
          };
        });

        console.log(`[League Creation] Prepared ${predictionEntries.length} predictions to copy to league ${league.leagueId}`);

        // Batch write in chunks of 25 (DynamoDB limit)
        let totalCopied = 0;
        for (let i = 0; i < predictionEntries.length; i += 25) {
          const chunk = predictionEntries.slice(i, i + 25);
          console.log(`[League Creation] Processing prediction chunk ${Math.floor(i / 25) + 1} with ${chunk.length} entries`);

          try {
            const copyResult = await client.graphql({
              query: BATCH_CREATE_LEAGUE_PREDICTION_ENTRIES,
              variables: { entries: chunk },
            }) as GraphQLResult<{ batchCreateLeaguePredictionEntries: boolean }>;

            if (copyResult.errors && copyResult.errors.length > 0) {
              console.error(`[League Creation] Error copying predictions to league:`, copyResult.errors);
              throw new Error(copyResult.errors[0].message || 'Failed to copy prediction entries');
            }

            totalCopied += chunk.length;
            console.log(`[League Creation] Successfully copied ${chunk.length} predictions in chunk ${Math.floor(i / 25) + 1}`);
          } catch (copyError) {
            console.error(`[League Creation] Error copying predictions to league:`, copyError);
            throw copyError;
          }
        }

        console.log(`[League Creation] Successfully copied ${totalCopied} predictions to league ${league.leagueId}`);
      } else {
        console.log('[League Creation] No predictions found for user, skipping copy');
      }
    } catch (copyError) {
      // Log but don't fail the whole process if predictions fail to copy
      console.warn('[League Creation] Failed to copy predictions to league (non-critical):', copyError);
    }

    return league;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}

/**
 * Fetches all leagues the current user is a member of
 * @param limit Optional limit (default: 50)
 * @param nextToken Optional pagination token
 * @returns LeagueMemberConnection with items and nextToken
 */
export async function getMyLeagues(
  limit: number = 50,
  nextToken?: string
): Promise<LeagueMemberConnection> {
  await fetchAuthSession();

  const startTime = Date.now();
  const logId = requestLogger.logRequest('getMyLeagues', { limit, nextToken });

  try {
    const result = await client.graphql({
      query: GET_MY_LEAGUES,
      variables: {
        limit,
        nextToken,
      },
    }) as GraphQLResult<GetMyLeaguesResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message || 'Failed to fetch leagues');
    }

    const data = result.data?.getMyLeagues || { items: [], nextToken: null };
    requestLogger.logSuccess(logId, data.items.length, duration);
    return data;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}

/**
 * Fetches league metadata by join code
 * @param byCode 6-character join code
 * @returns League if found, null otherwise
 */
export async function getLeagueByCode(byCode: string): Promise<League | null> {
  await fetchAuthSession();

  const startTime = Date.now();
  const logId = requestLogger.logRequest('getLeagueByCode', { byCode });

  try {
    const result = await client.graphql({
      query: GET_LEAGUE_BY_CODE,
      variables: { byCode },
    }) as GraphQLResult<GetLeagueByCodeResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message || 'Failed to fetch league by code');
    }

    const league = result.data?.getLeagueByCode || null;
    requestLogger.logSuccess(logId, league ? 1 : 0, duration);
    return league;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}

/**
 * Joins a league by code: first fetches metadata, then creates membership and copies leaderboards
 * @param byCode 6-character join code
 * @returns Created LeagueMember
 */
export async function joinLeagueByCode(byCode: string): Promise<LeagueMember> {
  await fetchAuthSession();

  // Step 1: Get the league metadata
  const league = await getLeagueByCode(byCode);

  if (!league) {
    throw new Error('No league found with this code');
  }

  const startTime = Date.now();
  const logId = requestLogger.logRequest('joinLeagueByCode', { byCode, leagueId: league.leagueId });

  try {
    // Step 2: Create the membership
    const result = await client.graphql({
      query: CREATE_LEAGUE_MEMBER,
      variables: {
        input: {
          leagueId: league.leagueId,
          leagueName: league.name,
          role: 'member',
          code: byCode
        },
      },
    }) as GraphQLResult<CreateLeagueMemberResponse>;

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message || 'Failed to join league');
    }

    if (!result.data?.createLeagueMember) {
      throw new Error('Failed to join league: No data returned');
    }

    const member = result.data.createLeagueMember;

    // Step 3: Copy global leaderboard to league leaderboard (same as createLeague)
    try {
      console.log('[League Join] Copying global leaderboard to league:', league.leagueId);

      // Get the current user's profile to get their userId
      const userProfile = await getMyProfile();
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Get all leaderboard entries for the current user across all categories/seasons
      const userLeaderboards = await getLeaderboardsByUserId(userProfile.userId, 100);
      console.log(`[League Join] Found ${userLeaderboards.items.length} leaderboard entries for user`);

      if (userLeaderboards.items.length > 0) {
        // Map entries and create a unique key for deduplication
        const entryMap = new Map<string, typeof userLeaderboards.items[0]>();

        userLeaderboards.items.forEach((entry, index) => {
          // Normalize category to lowercase to match backend SK generation
          const normalizedCategory = entry.category.toLowerCase();
          // Create a unique key that matches the DynamoDB SK structure
          const uniqueKey = `${normalizedCategory}_${entry.season}_${entry.userId}_${entry.totalPoints}`;
          console.log(`[League Join] Entry ${index}: category=${entry.category} (normalized: ${normalizedCategory}), season=${entry.season}, userId=${entry.userId}, points=${entry.totalPoints}, uniqueKey=${uniqueKey}`);

          // Only keep the first entry if there are duplicates
          if (!entryMap.has(uniqueKey)) {
            entryMap.set(uniqueKey, entry);
            console.log(`[League Join] Added entry with key: ${uniqueKey}`);
          } else {
            console.log(`[League Join] DUPLICATE DETECTED - skipping entry with key: ${uniqueKey} (original category: ${entry.category})`);
          }
        });

        const uniqueEntries = Array.from(entryMap.values());
        console.log(`[League Join] After deduplication: ${uniqueEntries.length} unique entries (removed ${userLeaderboards.items.length - uniqueEntries.length} duplicates)`);

        const entries = uniqueEntries.map(entry => {
          // Extract padded points from byLeaderboardSK if available
          // Format: <paddedPoints>#USER#<userId>
          let pointsPadded: string | undefined = undefined;
          if (entry.byLeaderboardSK) {
            const parts = entry.byLeaderboardSK.split('#');
            if (parts.length > 0) {
              pointsPadded = parts[0];
            }
          }

          return {
            leagueId: league.leagueId,
            userId: entry.userId,
            username: entry.username,
            totalPoints: entry.totalPoints,
            numberOfRaces: entry.numberOfRaces,
            nationality: entry.nationality || '',
            category: entry.category.toLowerCase(), // Normalize to lowercase to match backend
            season: entry.season,
            pointsPadded: pointsPadded, // Pass the padded points from source entry
          };
        });

        console.log(`[League Join] Prepared ${entries.length} entries to copy to league ${league.leagueId}`);

        // Batch write in chunks of 25 (DynamoDB limit)
        // Also deduplicate within each chunk to prevent duplicate key errors
        let totalCopied = 0;
        for (let i = 0; i < entries.length; i += 25) {
          const chunk = entries.slice(i, i + 25);
          console.log(`[League Join] Processing chunk ${Math.floor(i / 25) + 1} with ${chunk.length} entries`);

          // Create a map to ensure uniqueness within this chunk using the same key format
          const chunkMap = new Map<string, typeof entries[0]>();
          chunk.forEach(entry => {
            // Category is already normalized to lowercase in entries array
            const uniqueKey = `${entry.category}_${entry.season}_${entry.userId}_${entry.totalPoints}`;
            if (!chunkMap.has(uniqueKey)) {
              chunkMap.set(uniqueKey, entry);
            } else {
              console.log(`[League Join] DUPLICATE IN CHUNK - skipping: ${uniqueKey}`);
            }
          });
          const uniqueChunk = Array.from(chunkMap.values());

          console.log(`[League Join] Chunk ${Math.floor(i / 25) + 1}: ${uniqueChunk.length} unique entries (removed ${chunk.length - uniqueChunk.length} duplicates)`);

          if (uniqueChunk.length > 0) {
            console.log(`[League Join] Sending batch with entries:`, uniqueChunk.map(e => ({
              category: e.category,
              season: e.season,
              userId: e.userId,
              points: e.totalPoints
            })));

            try {
              const copyResult = await client.graphql({
                query: BATCH_CREATE_LEAGUE_LEADERBOARD_ENTRIES,
                variables: {
                  entries: uniqueChunk,
                },
              }) as GraphQLResult<{ batchCreateLeagueLeaderboardEntries: boolean }>;

              if (copyResult.errors && copyResult.errors.length > 0) {
                console.error(`[League Join] Error copying leaderboard to league:`, copyResult.errors);
                throw new Error(copyResult.errors[0].message || 'Failed to copy leaderboard entries');
              }

              totalCopied += uniqueChunk.length;
              console.log(`[League Join] Successfully copied ${uniqueChunk.length} entries in chunk ${Math.floor(i / 25) + 1}`);
            } catch (copyError) {
              console.error(`[League Join] Error copying leaderboard to league:`, copyError);
              throw copyError;
            }
          }
        }

        console.log(`[League Join] Successfully copied ${totalCopied} leaderboard entries to league ${league.leagueId}`);
      } else {
        console.log('[League Join] No leaderboard entries found for user, skipping copy');
      }
    } catch (copyError) {
      // Log but don't fail the whole process if leaderboards fail to copy
      console.warn('[League Join] Failed to copy leaderboards to league (non-critical):', copyError);
    }

    // Step 4: Copy all predictions to league predictions
    try {
      console.log('[League Join] Copying predictions to league:', league.leagueId);

      // Get all predictions for the current user
      const userPredictions = await listMyPredictions(undefined, undefined, 100);
      console.log(`[League Join] Found ${userPredictions.length} predictions for user`);

      if (userPredictions.length > 0) {
        const predictionEntries = userPredictions.map(prediction => {
          // Extract padded points from byLeaderboardSK if available
          let pointsPadded: string | undefined = undefined;
          if ((prediction as any).byLeaderboardSK) {
            const parts = (prediction as any).byLeaderboardSK.split('#');
            if (parts.length > 0) {
              pointsPadded = parts[0];
            }
          }

          return {
            leagueId: league.leagueId,
            userId: prediction.userId,
            category: prediction.category,
            season: prediction.season,
            raceId: prediction.raceId,
            prediction: prediction.prediction,
            points: prediction.points,
            pointsPadded: pointsPadded,
          };
        });

        console.log(`[League Join] Prepared ${predictionEntries.length} predictions to copy to league ${league.leagueId}`);

        // Batch write in chunks of 25 (DynamoDB limit)
        let totalCopied = 0;
        for (let i = 0; i < predictionEntries.length; i += 25) {
          const chunk = predictionEntries.slice(i, i + 25);
          console.log(`[League Join] Processing prediction chunk ${Math.floor(i / 25) + 1} with ${chunk.length} entries`);

          try {
            const copyResult = await client.graphql({
              query: BATCH_CREATE_LEAGUE_PREDICTION_ENTRIES,
              variables: { entries: chunk },
            }) as GraphQLResult<{ batchCreateLeaguePredictionEntries: boolean }>;

            if (copyResult.errors && copyResult.errors.length > 0) {
              console.error(`[League Join] Error copying predictions to league:`, copyResult.errors);
              throw new Error(copyResult.errors[0].message || 'Failed to copy prediction entries');
            }

            totalCopied += chunk.length;
            console.log(`[League Join] Successfully copied ${chunk.length} predictions in chunk ${Math.floor(i / 25) + 1}`);
          } catch (copyError) {
            console.error(`[League Join] Error copying predictions to league:`, copyError);
            throw copyError;
          }
        }

        console.log(`[League Join] Successfully copied ${totalCopied} predictions to league ${league.leagueId}`);
      } else {
        console.log('[League Join] No predictions found for user, skipping copy');
      }
    } catch (copyError) {
      // Log but don't fail the whole process if predictions fail to copy
      console.warn('[League Join] Failed to copy predictions to league (non-critical):', copyError);
    }

    const duration = Date.now() - startTime;
    requestLogger.logSuccess(logId, 1, duration);
    return member;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}

/**
 * Fetches all members of a specific league
 * @param leagueId The league ID
 * @param limit Optional limit (default: 50)
 * @param nextToken Optional pagination token
 * @returns LeagueMemberConnection with items and nextToken
 */
export async function getLeagueMembers(
  leagueId: string,
  limit: number = 50,
  nextToken?: string
): Promise<LeagueMemberConnection> {
  await fetchAuthSession();

  const startTime = Date.now();
  const logId = requestLogger.logRequest('getLeagueMembers', { leagueId, limit, nextToken });

  try {
    const result = await client.graphql({
      query: GET_LEAGUE_MEMBERS,
      variables: {
        leagueId,
        limit,
        nextToken,
      },
    }) as GraphQLResult<GetLeagueMembersResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message || 'Failed to fetch league members');
    }

    if (!result.data?.getLeagueMembers) {
      throw new Error('Failed to fetch league members: No data returned');
    }

    const connection = result.data.getLeagueMembers;
    requestLogger.logSuccess(logId, connection.items.length, duration);
    return connection;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}

/**
 * Fetches league leaderboard entries for a specific category and season, sorted by points
 * @param leagueId The league ID
 * @param category The category (e.g., "f1")
 * @param season The season (e.g., "2026")
 * @param limit Optional limit (default: 50)
 * @param nextToken Optional pagination token
 * @returns LeagueLeaderboardConnection with items and nextToken
 */
export async function getLeagueLeaderboard(
  leagueId: string,
  category: string,
  season: string,
  limit: number = 50,
  nextToken?: string
): Promise<LeagueLeaderboardConnection> {
  await fetchAuthSession();

  const startTime = Date.now();
  const logId = requestLogger.logRequest('getLeagueLeaderboard', { leagueId, category, season, limit, nextToken });

  try {
    const result = await client.graphql({
      query: GET_LEAGUE_LEADERBOARD,
      variables: {
        leagueId,
        category,
        season,
        limit,
        nextToken,
      },
    }) as GraphQLResult<GetLeagueLeaderboardResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message || 'Failed to fetch league leaderboard');
    }

    if (!result.data?.getLeagueLeaderboard) {
      throw new Error('Failed to fetch league leaderboard: No data returned');
    }

    const connection = result.data.getLeagueLeaderboard;
    requestLogger.logSuccess(logId, connection.items.length, duration);
    return connection;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}


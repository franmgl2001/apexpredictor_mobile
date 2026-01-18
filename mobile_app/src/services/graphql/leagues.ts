/**
 * League-related GraphQL queries and mutations
 * Functions for creating and managing leagues
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client } from './client';
import { requestLogger } from './requestLogger';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getLeaderboard, type LeaderboardEntry } from './leaderboard';
import { getMyProfile } from './users';

// Types for leagues
export interface League {
  PK: string;
  SK: string;
  entityType: string;
  leagueId: string;
  name: string;
  createdByUserId: string;
  createdAt: string;
  code: string;
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
            code
            description
        }
    }
`;

// Response types
interface CreateLeagueResponse {
  createLeague: League;
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

    // Step 2: Create the league member (admin role) and copy leaderboard entries
    // Note: These operations will be handled by the backend resolver in a future update
    // For now, the league is created and the member/leaderboard copying will be handled
    // by enhancing the backend resolver to use a pipeline or Lambda function

    return league;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}


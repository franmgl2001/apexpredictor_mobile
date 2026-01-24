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

// Response types
interface CreateLeagueResponse {
  createLeague: League;
}

interface CreateLeagueMemberResponse {
  createLeagueMember: LeagueMember;
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
            code: league.code
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


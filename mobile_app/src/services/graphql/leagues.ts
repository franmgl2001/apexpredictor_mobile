/**
 * League-related GraphQL queries
 * Functions for fetching league data, members, leaderboards, and predictions
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client, APEX_ENTITY_FIELDS } from './client';
import { listApexEntities } from './entities';
import type {
  ApexEntity,
  ListApexEntitiesResponse,
  ModelApexEntityFilterInput,
} from './types';

/**
 * Fetches all leagues where the user is a member
 * Filter: PK beginsWith "league", user_id equals the user's user_id, entityType equals "LEAGUE_MEMBER"
 * @param userId The user ID
 * @returns Array of league entities (LEAGUE_MEMBER entities with league details)
 */
export async function getUserLeagues(userId: string): Promise<ApexEntity[]> {
  const timestamp = new Date().toISOString();
  console.log(`[GraphQL] getUserLeagues executed at ${timestamp} - userId: ${userId}`);

  try {
    // Query LEAGUE_MEMBER entities by entityType and user_id
    // LEAGUE_MEMBER entities have: PK = "league#{league_id}", SK = "member#{member_id}"
    // We filter by entityType and user_id only (SK uses member_id, not user_id)
    const memberEntities = await listApexEntities({
      filter: {
        entityType: { eq: 'LEAGUE_MEMBER' },
        user_id: { eq: userId },
      } as ModelApexEntityFilterInput,
      limit: 1000,
    });

    // Extract unique league_ids
    const leagueIds = new Set<string>();
    memberEntities.forEach((member) => {
      if (member.league_id) {
        leagueIds.add(member.league_id);
      }
    });

    if (leagueIds.size === 0) {
      return [];
    }

    // Fetch league details for each league_id
    const leagues: ApexEntity[] = [];
    for (const leagueId of leagueIds) {
      try {
        const leagueDetails = await listApexEntities({
          filter: {
            PK: { eq: `league#${leagueId}` },
            SK: { eq: 'DETAILS' },
            entityType: { eq: 'LEAGUE' },
          } as ModelApexEntityFilterInput,
          limit: 1,
        });

        if (leagueDetails.length > 0) {
          // Merge member info (role) with league details
          const memberInfo = memberEntities.find((m) => m.league_id === leagueId);
          const league = { ...leagueDetails[0] };
          if (memberInfo?.role) {
            league.role = memberInfo.role;
          }
          leagues.push(league);
        }
      } catch (err) {
        console.error(`Error fetching league ${leagueId}:`, err);
      }
    }

    return leagues;
  } catch (error: any) {
    console.error('Error fetching user leagues:', error);
    throw error;
  }
}

/**
 * Fetches all public leagues (or all leagues if includePrivate is true)
 * @param limit Optional limit (default: 1000)
 * @param includePrivate Whether to include private leagues (default: false)
 * @returns Array of league entities
 */
export async function getLeagues(limit: number = 1000, includePrivate: boolean = false): Promise<ApexEntity[]> {
  const timestamp = new Date().toISOString();
  console.log(`[GraphQL] getLeagues executed at ${timestamp} - limit: ${limit}, includePrivate: ${includePrivate}`);

  try {
    const filter: ModelApexEntityFilterInput = {
      PK: { beginsWith: 'league#' },
      SK: { eq: 'DETAILS' },
      entityType: { eq: 'LEAGUE' },
    };

    if (!includePrivate) {
      filter.is_private = { eq: false };
    }

    const leagues = await listApexEntities({
      filter,
      limit,
    });

    return leagues;
  } catch (error: any) {
    console.error('Error fetching leagues:', error);
    throw error;
  }
}

/**
 * Fetches league members for a specific league
 * @param leagueId The league ID
 * @returns Array of league member entities
 */
export async function getLeagueMembers(leagueId: string): Promise<ApexEntity[]> {
  const timestamp = new Date().toISOString();
  console.log(`[GraphQL] getLeagueMembers executed at ${timestamp} - leagueId: ${leagueId}`);

  try {
    const members = await listApexEntities({
      filter: {
        PK: { eq: `league#${leagueId}` },
        SK: { beginsWith: 'member#' },
        entityType: { eq: 'LEAGUE_MEMBER' },
      } as ModelApexEntityFilterInput,
      limit: 1000,
    });

    return members;
  } catch (error: any) {
    console.error('Error fetching league members:', error);
    throw error;
  }
}

/**
 * Fetches league leaderboard for a specific league
 * Filter: SK eq "TOTALPOINTS", entityType eq "LEAGUE_LEADERBOARD", league_id eq leagueId
 * @param leagueId The league ID
 * @param limit Optional limit (default: 1000)
 * @returns Array of leaderboard entities
 */
export async function getLeagueLeaderboard(leagueId: string, limit: number = 1000): Promise<ApexEntity[]> {
  const timestamp = new Date().toISOString();
  console.log(`[GraphQL] getLeagueLeaderboard executed at ${timestamp} - leagueId: ${leagueId}, limit: ${limit}`);

  try {
    const result = await client.graphql({
      query: `
        query ListApexEntities(
          $PK: String
          $sortDirection: ModelSortDirection
          $SK: ModelStringKeyConditionInput
          $filter: ModelApexEntityFilterInput
          $limit: Int
          $nextToken: String
        ) {
          listApexEntities(
            PK: $PK
            sortDirection: $sortDirection
            SK: $SK
            filter: $filter
            limit: $limit
            nextToken: $nextToken
          ) {
            items {
              ${APEX_ENTITY_FIELDS}
            }
            nextToken
            __typename
          }
        }
      `,
      variables: {
        filter: {
          SK: { eq: 'TOTALPOINTS' },
          entityType: { eq: 'LEAGUE_LEADERBOARD' },
          league_id: { eq: leagueId },
        } as ModelApexEntityFilterInput,
        limit,
      },
    }) as GraphQLResult<ListApexEntitiesResponse>;

    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message || 'Failed to fetch league leaderboard');
    }

    return result.data?.listApexEntities.items || [];
  } catch (error: any) {
    console.error('Error fetching league leaderboard:', error);
    throw error;
  }
}

/**
 * Fetches race predictions for a specific league and race
 * Filter: PK beginsWith "prediction#", entityType eq "LEAGUE_PREDICTION", league_id eq leagueId, race_id eq raceId
 * @param leagueId The league ID
 * @param raceId The race ID
 * @param limit Optional limit (default: 1000)
 * @returns Array of prediction entities
 */
export async function getLeagueRacePredictions(
  leagueId: string,
  raceId: string,
  limit: number = 1000
): Promise<ApexEntity[]> {
  const timestamp = new Date().toISOString();
  console.log(`[GraphQL] getLeagueRacePredictions executed at ${timestamp} - leagueId: ${leagueId}, raceId: ${raceId}, limit: ${limit}`);

  try {
    const result = await client.graphql({
      query: `
        query ListApexEntities(
          $PK: String
          $sortDirection: ModelSortDirection
          $SK: ModelStringKeyConditionInput
          $filter: ModelApexEntityFilterInput
          $limit: Int
          $nextToken: String
        ) {
          listApexEntities(
            PK: $PK
            sortDirection: $sortDirection
            SK: $SK
            filter: $filter
            limit: $limit
            nextToken: $nextToken
          ) {
            items {
              PK
              SK
              entityType
              user_id
              username
              race_id
              predictions
              points
              league_id
            }
            nextToken
            __typename
          }
        }
      `,
      variables: {
        filter: {
          PK: { beginsWith: 'prediction#' },
          entityType: { eq: 'LEAGUE_PREDICTION' },
          league_id: { eq: leagueId },
          race_id: { eq: raceId },
        } as ModelApexEntityFilterInput,
        limit,
      },
    }) as GraphQLResult<ListApexEntitiesResponse>;

    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message || 'Failed to fetch league race predictions');
    }

    return result.data?.listApexEntities.items || [];
  } catch (error: any) {
    console.error('Error fetching league race predictions:', error);
    throw error;
  }
}


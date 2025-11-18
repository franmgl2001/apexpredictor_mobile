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
type GetUserLeaguesOptions = {
  includeDetails?: boolean;
};

export async function getUserLeagues(userId: string, options?: GetUserLeaguesOptions): Promise<ApexEntity[]> {
  const { includeDetails = true } = options || {};

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

    if (memberEntities.length === 0) {
      return [];
    }
    
    // Extract unique league_ids and build league map with data from member entities
    const leagueMap = new Map<string, { leagueId: string; role?: string; league_name?: string }>();
    
    memberEntities.forEach((member) => {
      if (member.league_id) {
        const leagueId = member.league_id;
        
        // Store league_id, role, and league_name from member entity (denormalized)
        if (!leagueMap.has(leagueId)) {
          leagueMap.set(leagueId, { 
            leagueId, 
            role: member.role,
            league_name: member.league_name, // Use league_name from member entity
          });
        } else {
          // Update role if admin (higher priority), and league_name if missing
          const existing = leagueMap.get(leagueId)!;
          if (member.role === 'admin' || (!existing.role && member.role)) {
            existing.role = member.role;
          }
          if (!existing.league_name && member.league_name) {
            existing.league_name = member.league_name;
          }
        }
      }
    });

    // If details aren't needed, return basic league info from member entities
    if (!includeDetails) {
      const basicLeagues: ApexEntity[] = Array.from(leagueMap.values()).map(({ leagueId, role, league_name }) => ({
        PK: `league#${leagueId}`,
        SK: 'DETAILS',
        entityType: 'LEAGUE',
        league_id: leagueId,
        league_name: league_name || 'Unnamed League',
        role,
      }));
      return basicLeagues;
    }

    // Fetch full league details for all leagues (to get member_count, is_private, description, etc.)
    // But use league_name from member entities (denormalized) if available
    const leagues: ApexEntity[] = [];
    for (const { leagueId, role, league_name } of leagueMap.values()) {
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
          // Merge league details with member role and use league_name from member entity
          const finalLeagueName = league_name || leagueDetails[0].league_name;
          const league: ApexEntity = {
            ...leagueDetails[0],
            role, // Add role from member
            league_name: finalLeagueName, // Prefer league_name from member entity
          };
          leagues.push(league);
        } else {
          // If LEAGUE details don't exist, create a minimal league object from member data
          // This handles cases where LEAGUE entity might be missing but member exists
          const league: ApexEntity = {
            PK: `league#${leagueId}`,
            SK: 'DETAILS',
            entityType: 'LEAGUE',
            league_id: leagueId,
            league_name: league_name || 'Unnamed League', // Use league_name from member or default
            role,
          };
          leagues.push(league);
        }
      } catch (err) {
        console.error(`[getUserLeagues] Error fetching league ${leagueId}:`, err);
        // Even if fetch fails, create a minimal league object from member data
        const league: ApexEntity = {
          PK: `league#${leagueId}`,
          SK: 'DETAILS',
          entityType: 'LEAGUE',
          league_id: leagueId,
          league_name: league_name || 'Unnamed League',
          role,
        };
        leagues.push(league);
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


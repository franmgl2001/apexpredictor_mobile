/**
 * Leaderboard-related GraphQL queries
 * Functions for fetching leaderboard data
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client, APEX_ENTITY_FIELDS } from './client';
import type {
  ApexEntity,
  LeaderboardByPointsResponse,
  ModelSortDirection,
  ModelIntKeyConditionInput,
  ModelApexEntityFilterInput,
} from './types';

const LEADERBOARD_BY_POINTS = `
  query LeaderboardByPoints(
    $entityType: String!
    $points: ModelIntKeyConditionInput
    $filter: ModelApexEntityFilterInput
    $sortDirection: ModelSortDirection
    $limit: Int
    $nextToken: String
  ) {
    leaderboardByPoints(
      entityType: $entityType
      points: $points
      filter: $filter
      sortDirection: $sortDirection
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
`;

/**
 * Fetches the leaderboard data from the GraphQL API
 * @param entityType The entity type filter (default: "LEADERBOARD")
 * @param sortDirection Sort direction (default: "DESC")
 * @param limit Optional limit (default: 1000)
 * @param points Optional points key condition input
 * @param filter Optional additional filter
 * @param nextToken Optional pagination token
 * @returns Array of leaderboard entities
 */
export async function getLeaderboard(
  entityType: string = 'LEADERBOARD',
  sortDirection: ModelSortDirection = 'DESC',
  limit: number = 1000,
  points?: ModelIntKeyConditionInput,
  filter?: ModelApexEntityFilterInput,
  nextToken?: string
): Promise<ApexEntity[]> {
  const timestamp = new Date().toISOString();
  console.log(`[GraphQL] getLeaderboard executed at ${timestamp} - entityType: ${entityType}, sortDirection: ${sortDirection}, limit: ${limit}`);

  try {
    const result = await client.graphql({
      query: LEADERBOARD_BY_POINTS,
      variables: {
        entityType,
        sortDirection,
        limit,
        points,
        filter,
        nextToken,
      },
    }) as GraphQLResult<LeaderboardByPointsResponse>;

    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message || 'Failed to fetch leaderboard');
    }

    return result.data?.leaderboardByPoints.items || [];
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
}


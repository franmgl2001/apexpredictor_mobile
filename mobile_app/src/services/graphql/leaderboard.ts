/**
 * Leaderboard-related GraphQL queries
 * Functions for fetching leaderboard data
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client, APEX_ENTITY_FIELDS } from './client';
import type {
  ApexEntity,
  LeaderboardByPointsResponse,
  ListApexEntitiesResponse,
  ModelSortDirection,
  ModelIntKeyConditionInput,
  ModelStringKeyConditionInput,
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
 * Filters by current season and category "F1" by default
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
  const currentYear = new Date().getFullYear().toString();
  console.log(`[GraphQL] getLeaderboard executed at ${timestamp} - entityType: ${entityType}, sortDirection: ${sortDirection}, limit: ${limit}, season: ${currentYear}, category: F1`);

  try {
    // Merge default filters with provided filter, always enforcing SK, season, and category
    const mergedFilter: ModelApexEntityFilterInput = {
      ...filter,
      // Always enforce these filters
      SK: { eq: 'TOTALPOINTS' },
      season: { eq: currentYear },
      category: { eq: 'F1' },
    };

    const result = await client.graphql({
      query: LEADERBOARD_BY_POINTS,
      variables: {
        entityType,
        sortDirection,
        limit,
        points,
        filter: mergedFilter,
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

/**
 * GraphQL query for fetching leaderboard predictions - only includes necessary fields
 * Excludes createdAt and updatedAt to avoid serialization errors
 */
const LIST_LEADERBOARD_PREDICTIONS = `
  query ListLeaderboardPredictions(
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
      }
      nextToken
      __typename
    }
  }
`;

/**
 * Fetches leaderboard predictions for a specific race
 * Only fetches username, predictions, and points fields to avoid DateTime serialization issues
 * @param raceId The race ID to fetch predictions for
 * @param limit Optional limit (default: 1000)
 * @returns Array of prediction entities with only necessary fields
 */
export async function getLeaderboardPredictions(
  raceId: string,
  limit: number = 1000
): Promise<ApexEntity[]> {
  const timestamp = new Date().toISOString();
  console.log(`[GraphQL] getLeaderboardPredictions executed at ${timestamp} - raceId: ${raceId}, limit: ${limit}`);

  try {
    const result = await client.graphql({
      query: LIST_LEADERBOARD_PREDICTIONS,
      variables: {
        filter: {
          PK: { beginsWith: 'prediction#' },
          entityType: { eq: 'PREDICTION' },
          race_id: { eq: raceId },
        },
        limit,
      },
    }) as GraphQLResult<ListApexEntitiesResponse>;

    // If we have data, return it even if there are some errors (partial success)
    if (result.data?.listApexEntities?.items) {
      if (result.errors && result.errors.length > 0) {
        // Log warnings for non-fatal errors but still return data
        console.warn('GraphQL warnings (non-fatal):', result.errors);
      }
      return result.data.listApexEntities.items;
    }

    // If we have errors but no data, throw
    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0].message || 'Failed to fetch leaderboard predictions';
      console.error('GraphQL errors:', result.errors);
      throw new Error(errorMessage);
    }

    // No data and no errors - return empty array
    return [];
  } catch (error: any) {
    // Only log error message, not the entire error object which might contain data
    const errorMessage = error?.message || 'Failed to fetch leaderboard predictions';
    console.error('Error fetching leaderboard predictions:', errorMessage);
    throw error;
  }
}


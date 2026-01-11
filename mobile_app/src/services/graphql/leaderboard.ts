/**
 * Leaderboard-related GraphQL queries
 * Functions for fetching leaderboard data
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client, APEX_ENTITY_FIELDS } from './client';
import { requestLogger } from './requestLogger';
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
  const startTime = Date.now();
  const currentYear = new Date().getFullYear().toString();
  const variables = { entityType, sortDirection, limit, season: currentYear, category: 'F1', hasPoints: !!points, hasFilter: !!filter, hasNextToken: !!nextToken };
  const logId = requestLogger.logRequest('getLeaderboard', variables);

  try {
    // Merge default filters with provided filter, always enforcing SK, season, and category
    const mergedFilter: ModelApexEntityFilterInput = {
      ...filter,
      // Always enforce these filters
      SK: { eq: 'TOTALPOINTS' },
      season: { eq: currentYear },
      category: { eq: 'F1' },
    };

    // COMMENTED OUT: GraphQL call disabled - migrating to CDK backend
    // const result = await client.graphql({
    //   query: LEADERBOARD_BY_POINTS,
    //   variables: {
    //     entityType,
    //     sortDirection,
    //     limit,
    //     points,
    //     filter: mergedFilter,
    //     nextToken,
    //   },
    // }) as GraphQLResult<LeaderboardByPointsResponse>;
    // Return empty array since GraphQL is disabled
    const duration = Date.now() - startTime;
    requestLogger.logSuccess(logId, 0, duration);
    return [];
    /* COMMENTED OUT - Original GraphQL code:
    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0].message || 'Failed to fetch leaderboard';
      requestLogger.logError(logId, new Error(errorMessage), duration);
      throw new Error(errorMessage);
    }

    const items = result.data?.leaderboardByPoints.items || [];
    requestLogger.logSuccess(logId, items.length, duration);
    return items;
    */
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
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
  const startTime = Date.now();
  const variables = { raceId, limit };
  const logId = requestLogger.logRequest('getLeaderboardPredictions', variables);

  try {
    // COMMENTED OUT: GraphQL call disabled - migrating to CDK backend
    // const result = await client.graphql({
    //   query: LIST_LEADERBOARD_PREDICTIONS,
    //   variables: {
    //     filter: {
    //       PK: { beginsWith: 'prediction#' },
    //       entityType: { eq: 'PREDICTION' },
    //       race_id: { eq: raceId },
    //     },
    //     limit,
    //   },
    // }) as GraphQLResult<ListApexEntitiesResponse>;
    // Return empty array since GraphQL is disabled
    const duration = Date.now() - startTime;
    requestLogger.logSuccess(logId, 0, duration);
    return [];
    /* COMMENTED OUT - Original GraphQL code:
    const duration = Date.now() - startTime;

    // If we have data, return it even if there are some errors (partial success)
    if (result.data?.listApexEntities?.items) {
      const items = result.data.listApexEntities.items;
      if (result.errors && result.errors.length > 0) {
        // Log warnings for non-fatal errors but still return data
        console.warn('GraphQL warnings (non-fatal):', result.errors);
      }
      requestLogger.logSuccess(logId, items.length, duration);
      return items;
    }

    // If we have errors but no data, throw
    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0].message || 'Failed to fetch leaderboard predictions';
      requestLogger.logError(logId, new Error(errorMessage), duration);
      throw new Error(errorMessage);
    }

    // No data and no errors - return empty array
    requestLogger.logSuccess(logId, 0, duration);
    return [];
    */
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}


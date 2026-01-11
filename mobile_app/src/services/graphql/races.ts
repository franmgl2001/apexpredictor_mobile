/**
 * Race-related GraphQL queries
 * Functions for fetching race details and information
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client, APEX_ENTITY_FIELDS } from './client';
import type { ApexEntity, ListApexEntitiesResponse } from './types';
import { requestLogger } from './requestLogger';

const LIST_APEX_ENTITIES = `
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
`;

/**
 * Fetches race results from the GraphQL API
 * Fetches race result entities with PK equal to "f1#<season>" (e.g., "f1#2025") and SK beginning with "results#"
 * @param season Optional season year (default: current year)
 * @param limit Optional limit (default: 1000)
 * @param category Optional category (default: "F1")
 * @returns Array of race result entities
 */
export async function getRaceResults(season?: string, limit: number = 1000, category: string = 'F1'): Promise<ApexEntity[]> {
  const startTime = Date.now();
  const currentYear = season || new Date().getFullYear().toString();
  const pk = `${category.toLowerCase()}#${currentYear}`;
  const variables = {
    PK: pk,
    SK: {
      beginsWith: 'results#',
    },
    limit,
  };
  const logId = requestLogger.logRequest('getRaceResults', variables);

  try {
    // COMMENTED OUT: GraphQL call disabled - migrating to CDK backend
    // const result = await client.graphql({
    //   query: LIST_APEX_ENTITIES,
    //   variables,
    // }) as GraphQLResult<ListApexEntitiesResponse>;
    // Return empty array since GraphQL is disabled
    const duration = Date.now() - startTime;
    requestLogger.logSuccess(logId, 0, duration);
    return [];
    /* COMMENTED OUT - Original GraphQL code:
    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0].message || 'Failed to fetch race results';
      requestLogger.logError(logId, new Error(errorMessage), duration);
      throw new Error(errorMessage);
    }

    const items = result.data?.listApexEntities.items || [];
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
 * Fetches all season data (drivers, races, and results) in a single query
 * This is more efficient than making three separate queries since they all use the same PK
 * @param season Optional season year (default: current year)
 * @param limit Optional limit (default: 1500 to accommodate all entities)
 * @param category Optional category (default: "F1")
 * @returns Object containing drivers, races, and results arrays
 */
export interface SeasonData {
  drivers: ApexEntity[];
  races: ApexEntity[];
  results: ApexEntity[];
}

export async function getSeasonData(
  season?: string,
  limit: number = 1500,
  category: string = 'F1'
): Promise<SeasonData> {
  const startTime = Date.now();
  const currentYear = season || new Date().getFullYear().toString();
  const pk = `${category.toLowerCase()}#${currentYear}`;

  // Query by PK only - no SK filter to get all entities for the season
  const variables = {
    PK: pk,
    limit,
  };
  const logId = requestLogger.logRequest('getSeasonData', variables);

  try {
    // COMMENTED OUT: GraphQL call disabled - migrating to CDK backend
    // const result = await client.graphql({
    //   query: LIST_APEX_ENTITIES,
    //   variables,
    // }) as GraphQLResult<ListApexEntitiesResponse>;
    // Return empty data since GraphQL is disabled
    const duration = Date.now() - startTime;
    requestLogger.logSuccess(logId, 0, duration);
    return {
      drivers: [],
      races: [],
      results: [],
    };
    /* COMMENTED OUT - Original GraphQL code:
    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0].message || 'Failed to fetch season data';
      requestLogger.logError(logId, new Error(errorMessage), duration);
      throw new Error(errorMessage);
    }

    const allItems = result.data?.listApexEntities.items || [];

    // Filter items client-side by SK prefix
    const drivers = allItems.filter(
      (item) => item.SK?.startsWith('drivers#') && item.entityType === 'DRIVER'
    );
    const races = allItems.filter(
      (item) => item.SK?.startsWith('race#') && item.entityType === 'RACE'
    );
    const results = allItems.filter(
      (item) => item.SK?.startsWith('results#')
    );

    requestLogger.logSuccess(logId, allItems.length, duration);

    return {
      drivers,
      races,
      results,
    };
    */
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}


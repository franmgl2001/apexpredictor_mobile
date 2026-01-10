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
 * Fetches all race details from the GraphQL API
 * Fetches race entities with PK equal to "f1#<season>" (e.g., "f1#2025") and SK beginning with "race#"
 * @param season Optional season year (default: current year)
 * @param limit Optional limit (default: 1000)
 * @param category Optional category (default: "F1")
 * @returns Array of race detail entities
 */
export async function getRaceDetails(season?: string, limit: number = 1000, category: string = 'F1'): Promise<ApexEntity[]> {
  const startTime = Date.now();
  const currentYear = season || new Date().getFullYear().toString();
  const pk = `${category.toLowerCase()}#${currentYear}`;
  const variables = {
    PK: pk,
    SK: {
      beginsWith: 'race#',
    },
    limit,
  };
  const logId = requestLogger.logRequest('getRaceDetails', variables);

  try {
    const result = await client.graphql({
      query: LIST_APEX_ENTITIES,
      variables,
    }) as GraphQLResult<ListApexEntitiesResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0].message || 'Failed to fetch race details';
      requestLogger.logError(logId, new Error(errorMessage), duration);
      throw new Error(errorMessage);
    }

    const items = result.data?.listApexEntities.items || [];
    requestLogger.logSuccess(logId, items.length, duration);
    return items;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}

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
    const result = await client.graphql({
      query: LIST_APEX_ENTITIES,
      variables,
    }) as GraphQLResult<ListApexEntitiesResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0].message || 'Failed to fetch race results';
      requestLogger.logError(logId, new Error(errorMessage), duration);
      throw new Error(errorMessage);
    }

    const items = result.data?.listApexEntities.items || [];
    requestLogger.logSuccess(logId, items.length, duration);
    return items;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}


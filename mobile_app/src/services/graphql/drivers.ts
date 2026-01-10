/**
 * Driver-related GraphQL queries
 * Functions for fetching driver information
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
 * Fetches all active drivers for a season from the GraphQL API
 * Fetches driver entities with:
 * - PK equal to "f1#<season>" (e.g., "f1#2025")
 * - SK beginning with "drivers#"
 * - isActive equal to true
 * @param season Season year (default: current year)
 * @param category Optional category (default: "F1")
 * @param limit Optional limit (default: 1000)
 * @returns Array of driver entities
 */
export async function getDrivers(season?: string, category: string = 'F1', limit: number = 1000): Promise<ApexEntity[]> {
  const startTime = Date.now();
  const currentYear = season || new Date().getFullYear().toString();
  const pk = `${category.toLowerCase()}#${currentYear}`;
  const variables = {
    PK: pk,
    SK: {
      beginsWith: 'drivers#',
    },
    filter: {
      isActive: {
        eq: true,
      },
    },
    limit,
  };
  const logId = requestLogger.logRequest('getDrivers', variables);

  try {
    const result = await client.graphql({
      query: LIST_APEX_ENTITIES,
      variables,
    }) as GraphQLResult<ListApexEntitiesResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0].message || 'Failed to fetch drivers';
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


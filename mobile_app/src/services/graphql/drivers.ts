/**
 * Driver-related GraphQL queries
 * Functions for fetching driver information
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client, APEX_ENTITY_FIELDS } from './client';
import type { ApexEntity, ListApexEntitiesResponse } from './types';

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
 * - PK beginning with "driver#"
 * - SK beginning with "SEASON#<season>"
 * - isActive equal to true
 * - category equal to "F1"
 * - season equal to current year
 * @param season Season year (default: current year)
 * @param category Optional category (default: "F1")
 * @param limit Optional limit (default: 1000)
 * @returns Array of driver entities
 */
export async function getDrivers(season?: string, category: string = 'F1', limit: number = 1000): Promise<ApexEntity[]> {
  const timestamp = new Date().toISOString();
  const currentYear = season || new Date().getFullYear().toString();
  console.log(`[GraphQL] getDrivers executed at ${timestamp} - season: ${currentYear}, category: ${category}, limit: ${limit}`);

  try {
    const result = await client.graphql({
      query: LIST_APEX_ENTITIES,
      variables: {
        filter: {
          PK: {
            beginsWith: 'driver#',
          },
          SK: {
            beginsWith: `SEASON#${currentYear}`,
          },
          isActive: {
            eq: true,
          },
          category: {
            eq: category,
          },
          season: {
            eq: currentYear,
          },
        },
        limit,
      },
    }) as GraphQLResult<ListApexEntitiesResponse>;

    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message || 'Failed to fetch drivers');
    }

    return result.data?.listApexEntities.items || [];
  } catch (error: any) {
    console.error('Error fetching drivers:', error);
    throw error;
  }
}


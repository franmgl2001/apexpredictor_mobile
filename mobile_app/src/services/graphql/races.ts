/**
 * Race-related GraphQL queries
 * Functions for fetching race details and information
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
 * Fetches all race details from the GraphQL API
 * Fetches race entities with PK beginning with "race#" and SK equal to "DETAILS"
 * Filters by current year (season) and category "f1" by default
 * @param limit Optional limit (default: 1000)
 * @param category Optional category (default: "f1")
 * @returns Array of race detail entities
 */
export async function getRaceDetails(limit: number = 1000, category: string = 'F1'): Promise<ApexEntity[]> {
  const timestamp = new Date().toISOString();
  const currentYear = new Date().getFullYear().toString();
  console.log(`[GraphQL] getRaceDetails executed at ${timestamp} - limit: ${limit}, season: ${currentYear}, category: ${category}`);

  try {
    const result = await client.graphql({
      query: LIST_APEX_ENTITIES,
      variables: {
        filter: {
          PK: {
            beginsWith: 'race#',
          },
          SK: {
            eq: 'DETAILS',
          },
          season: {
            eq: currentYear,
          },
          category: {
            eq: category,
          },
        },
        limit,
      },
    }) as GraphQLResult<ListApexEntitiesResponse>;

    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message || 'Failed to fetch race details');
    }

    return result.data?.listApexEntities.items || [];
  } catch (error: any) {
    console.error('Error fetching race details:', error);
    throw error;
  }
}

/**
 * Fetches race results from the GraphQL API
 * Fetches race result entities with SK equal to "RACERESULT"
 * @param limit Optional limit (default: 1000)
 * @returns Array of race result entities
 */
export async function getRaceResults(limit: number = 1000): Promise<ApexEntity[]> {
  const timestamp = new Date().toISOString();
  console.log(`[GraphQL] getRaceResults executed at ${timestamp} - limit: ${limit}`);

  try {
    const result = await client.graphql({
      query: LIST_APEX_ENTITIES,
      variables: {
        filter: {
          SK: {
            eq: 'RACERESULT',
          },
        },
        limit,
      },
    }) as GraphQLResult<ListApexEntitiesResponse>;

    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message || 'Failed to fetch race results');
    }

    return result.data?.listApexEntities.items || [];
  } catch (error: any) {
    console.error('Error fetching race results:', error);
    throw error;
  }
}


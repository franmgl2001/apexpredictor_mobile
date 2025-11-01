/**
 * General entity queries - for fetching and listing Apex Entities
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client, APEX_ENTITY_FIELDS, isEntityNotFoundError } from './client';
import type {
  ApexEntity,
  GetApexEntityResponse,
  ListApexEntitiesResponse,
  ModelSortDirection,
  ModelStringKeyConditionInput,
  ModelApexEntityFilterInput,
} from './types';

const GET_APEX_ENTITY = `
  query GetApexEntity($PK: String!, $SK: String!) {
    getApexEntity(PK: $PK, SK: $SK) {
      ${APEX_ENTITY_FIELDS}
    }
  }
`;

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
 * Fetches an Apex Entity from the GraphQL API
 * @param PK Primary key (e.g., "user#61cbf510-20d1-7047-5006-b3ae8d8fb6e5")
 * @param SK Sort key (e.g., "PROFILE")
 * @returns The Apex Entity or null if not found
 */
export async function getApexEntity(PK: string, SK: string): Promise<ApexEntity | null> {
  const timestamp = new Date().toISOString();
  console.log(`[GraphQL] getApexEntity executed at ${timestamp} - PK: ${PK}, SK: ${SK}`);

  try {
    const result = await client.graphql({
      query: GET_APEX_ENTITY,
      variables: { PK, SK },
    }) as GraphQLResult<GetApexEntityResponse>;

    if (result.errors && result.errors.length > 0) {
      // Check if the error is because entity doesn't exist (expected case)
      const errorMessage = result.errors[0].message || '';
      if (isEntityNotFoundError({ message: errorMessage })) {
        // Entity doesn't exist - return null (not an error)
        return null;
      }
      // For other errors, log and throw
      console.error('GraphQL errors:', result.errors);
      throw new Error(errorMessage || 'Failed to fetch entity');
    }

    return result.data?.getApexEntity || null;
  } catch (error: any) {
    // Check if error is due to entity not existing (expected case for predictions)
    if (isEntityNotFoundError(error)) {
      return null;
    }
    console.error('Error fetching Apex Entity:', error);
    throw error;
  }
}

/**
 * Lists Apex Entities from the GraphQL API
 * @param variables Query variables
 * @returns Array of Apex entities
 */
export async function listApexEntities(variables?: {
  PK?: string;
  sortDirection?: ModelSortDirection;
  SK?: ModelStringKeyConditionInput;
  filter?: ModelApexEntityFilterInput;
  limit?: number;
  nextToken?: string;
}): Promise<ApexEntity[]> {
  const timestamp = new Date().toISOString();
  console.log(`[GraphQL] listApexEntities executed at ${timestamp}`, variables ? { PK: variables.PK, limit: variables.limit, hasFilter: !!variables.filter } : 'no variables');

  try {
    const result = await client.graphql({
      query: LIST_APEX_ENTITIES,
      variables: variables || {},
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
      const errorMessage = result.errors[0].message || 'Failed to fetch entities';
      console.error('GraphQL errors:', result.errors);
      throw new Error(errorMessage);
    }

    // No data and no errors - return empty array
    return [];
  } catch (error: any) {
    // Only log error message, not the entire error object which might contain data
    const errorMessage = error?.message || 'Failed to fetch entities';
    console.error('Error fetching entities:', errorMessage);
    throw error;
  }
}


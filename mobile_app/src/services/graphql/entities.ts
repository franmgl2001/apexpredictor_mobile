/**
 * General entity queries - for fetching and listing Apex Entities
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client, APEX_ENTITY_FIELDS, isEntityNotFoundError } from './client';
import { requestLogger } from './requestLogger';
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

// Query for predictions that excludes DateTime fields to avoid serialization errors
const GET_APEX_ENTITY_NO_DATETIME = `
  query GetApexEntity($PK: String!, $SK: String!) {
    getApexEntity(PK: $PK, SK: $SK) {
      PK
      SK
      entityType
      user_id
      username
      email
      race_id
      race_name
      season
      qualy_date
      race_date
      category
      circuit
      country
      status
      has_sprint
      predictions
      points_earned
      results
      driver_id
      name
      team
      number
      imageUrl
      teamColor
      isActive
      nationality
      birthDate
      league_id
      league_name
      description
      creator_id
      is_private
      join_code
      max_members
      member_count
      role
      points
      races
    }
  }
`;

/**
 * Fetches an Apex Entity without DateTime fields (for predictions to avoid serialization errors)
 * @param PK Primary key (e.g., "prediction#userId#raceId")
 * @param SK Sort key (e.g., "RACEPREDICTION")
 * @returns The Apex Entity or null if not found
 */
export async function getApexEntityNoDateTime(PK: string, SK: string): Promise<ApexEntity | null> {
  const startTime = Date.now();
  const logId = requestLogger.logRequest('getApexEntityNoDateTime', { PK, SK });

  try {
    const result = await client.graphql({
      query: GET_APEX_ENTITY_NO_DATETIME,
      variables: { PK, SK },
    }) as GraphQLResult<GetApexEntityResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      // Check if the error is because entity doesn't exist (expected case)
      const firstError = result.errors[0];
      const errorMessage = firstError?.message || '';
      if (isEntityNotFoundError({ message: errorMessage })) {
        // Entity doesn't exist - return null (not an error)
        requestLogger.logSuccess(logId, 0, duration);
        return null;
      }
      // For other errors, preserve full error context
      const errorWithContext = {
        message: errorMessage || 'Failed to fetch entity',
        errors: result.errors,
        path: firstError?.path,
        extensions: firstError?.extensions,
      };
      requestLogger.logError(logId, errorWithContext, duration);
      throw new Error(errorMessage || 'Failed to fetch entity');
    }

    const item = result.data?.getApexEntity || null;
    requestLogger.logSuccess(logId, item ? 1 : 0, duration);
    return item;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    // Check if error is due to entity not existing (expected case for predictions)
    if (isEntityNotFoundError(error)) {
      requestLogger.logSuccess(logId, 0, duration);
      return null;
    }
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}

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
  const startTime = Date.now();
  const logId = requestLogger.logRequest('getApexEntity', { PK, SK });

  try {
    const result = await client.graphql({
      query: GET_APEX_ENTITY,
      variables: { PK, SK },
    }) as GraphQLResult<GetApexEntityResponse>;

    const duration = Date.now() - startTime;

    // Check for DateTime serialization errors (non-fatal - data is still available)
    const dateTimeErrors = result.errors?.filter((err: any) => 
      err?.message?.includes('serialize') && 
      (err?.path?.includes('createdAt') || err?.path?.includes('updatedAt'))
    ) || [];

    // Check for other errors (fatal)
    const otherErrors = result.errors?.filter((err: any) => 
      !dateTimeErrors.includes(err)
    ) || [];

    if (otherErrors.length > 0) {
      // Check if the error is because entity doesn't exist (expected case)
      const firstError = otherErrors[0];
      const errorMessage = firstError?.message || '';
      if (isEntityNotFoundError({ message: errorMessage })) {
        // Entity doesn't exist - return null (not an error)
        requestLogger.logSuccess(logId, 0, duration);
        return null;
      }
      // For other errors, preserve full error context
      const errorWithContext = {
        message: errorMessage || 'Failed to fetch entity',
        errors: otherErrors,
        path: firstError?.path,
        extensions: firstError?.extensions,
      };
      requestLogger.logError(logId, errorWithContext, duration);
      throw new Error(errorMessage || 'Failed to fetch entity');
    }

    // If we have data, return it even if there are DateTime serialization errors
    const item = result.data?.getApexEntity || null;
    
    // Log warning for DateTime errors but don't fail
    if (dateTimeErrors.length > 0 && item) {
      console.warn(`[getApexEntity] DateTime serialization errors for ${PK}/${SK}, but data is available:`, dateTimeErrors);
    }

    requestLogger.logSuccess(logId, item ? 1 : 0, duration);
    return item;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    // Check if error is due to entity not existing (expected case for predictions)
    if (isEntityNotFoundError(error)) {
      requestLogger.logSuccess(logId, 0, duration);
      return null;
    }
    requestLogger.logError(logId, error, duration);
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
  const startTime = Date.now();
  const logId = requestLogger.logRequest('listApexEntities', variables);

  try {
    const result = await client.graphql({
      query: LIST_APEX_ENTITIES,
      variables: variables || {},
    }) as GraphQLResult<ListApexEntitiesResponse>;

    const duration = Date.now() - startTime;

    // If we have data, return it even if there are some errors (partial success)
    if (result.data?.listApexEntities?.items) {
      if (result.errors && result.errors.length > 0) {
        // Log warnings for non-fatal errors but still return data
        console.warn('GraphQL warnings (non-fatal):', result.errors);
      }
      const items = result.data.listApexEntities.items;
      requestLogger.logSuccess(logId, items.length, duration);
      return items;
    }

    // If we have errors but no data, throw
    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0].message || 'Failed to fetch entities';
      requestLogger.logError(logId, new Error(errorMessage), duration);
      throw new Error(errorMessage);
    }

    // No data and no errors - return empty array
    requestLogger.logSuccess(logId, 0, duration);
    return [];
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage = error?.message || 'Failed to fetch entities';
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}


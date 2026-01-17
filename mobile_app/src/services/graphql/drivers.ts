/**
 * Driver-related GraphQL queries
 * Functions for fetching driver information
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client } from './client';
import type { ApexEntity } from './types';
import { requestLogger } from './requestLogger';
import { normalizeCategory } from './races';

const GET_DRIVERS = `
  query GetDrivers($category: String!, $season: String!, $limit: Int, $nextToken: String) {
    getDrivers(category: $category, season: $season, limit: $limit, nextToken: $nextToken) {
      items {
        PK
        SK
        entityType
        driver_id
        name
        team
        number
        imageUrl
        teamColor
        isActive
        nationality
        birthDate
        season
        category
        createdAt
        updatedAt
      }
      nextToken
      __typename
    }
  }
`;

interface GetDriversResponse {
  getDrivers: {
    items: ApexEntity[];
    nextToken: string | null;
    __typename: string;
  };
}

/**
 * Fetches all drivers for a specific category and season
 * Automatically normalizes the category input to a valid category prefix
 * @param category Category name (e.g., "F1", "Formula 1", "MotoGP", etc.) - will be normalized
 * @param season Season year (e.g., "2026")
 * @param limit Optional limit (default: 100)
 * @param nextToken Optional pagination token
 * @returns Array of driver entities
 */
export async function getDrivers(
  category: string,
  season: string,
  limit: number = 100,
  nextToken?: string
): Promise<ApexEntity[]> {
  const startTime = Date.now();

  // Normalize category to ensure it's one of the valid prefixes
  const normalizedCategory = normalizeCategory(category);
  const currentSeason = season || new Date().getFullYear().toString();

  const variables: {
    category: string;
    season: string;
    limit: number;
    nextToken?: string;
  } = {
    category: normalizedCategory,
    season: currentSeason,
    limit,
  };

  if (nextToken) {
    variables.nextToken = nextToken;
  }

  const logId = requestLogger.logRequest('getDrivers', variables);

  try {
    const result = await client.graphql({
      query: GET_DRIVERS,
      variables,
    }) as GraphQLResult<GetDriversResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0].message || 'Failed to fetch drivers';
      requestLogger.logError(logId, new Error(errorMessage), duration);
      throw new Error(errorMessage);
    }

    const items = result.data?.getDrivers.items || [];
    requestLogger.logSuccess(logId, items.length, duration);
    return items;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}


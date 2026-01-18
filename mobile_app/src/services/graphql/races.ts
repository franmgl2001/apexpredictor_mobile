/**
 * Race-related GraphQL queries
 * Functions for fetching race details and information
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client } from './client';
import { requestLogger } from './requestLogger';

/**
 * Race type matching the GraphQL Race schema
 */
export type Race = {
  PK: string;
  SK: string;
  entityType: string;
  raceId: string;
  raceName: string;
  season: string;
  qualyDate?: string | null;
  raceDate?: string | null;
  category: string;
  circuit?: string | null;
  country?: string | null;
  status?: string | null;
  hasSprint?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

/**
 * Valid category prefixes for race queries
 */
const VALID_CATEGORIES = ['f1', 'motogp', 'wrc', 'wec', 'dakar', 'indycar'] as const;

/**
 * Normalizes a category string to a valid category prefix
 * @param category Input category (e.g., "F1", "Formula 1", "MotoGP", etc.)
 * @returns Normalized category (f1, motogp, wrc, wec, dakar, or indycar)
 */
export function normalizeCategory(category: string): string {
  const normalized = category.toLowerCase().trim();

  // Direct matches
  if (VALID_CATEGORIES.includes(normalized as any)) {
    return normalized;
  }

  // Common variations
  const categoryMap: Record<string, string> = {
    'formula 1': 'f1',
    'formula1': 'f1',
    'formula one': 'f1',
    'f1': 'f1',
    'moto gp': 'motogp',
    'moto-gp': 'motogp',
    'motogp': 'motogp',
    'world rally championship': 'wrc',
    'wrc': 'wrc',
    'world endurance championship': 'wec',
    'wec': 'wec',
    'dakar rally': 'dakar',
    'dakar': 'dakar',
    'indy car': 'indycar',
    'indy-car': 'indycar',
    'indycar': 'indycar',
  };

  // Check for partial matches
  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  // Default to f1 if no match found
  return 'f1';
}

const GET_RACES = `
  query GetRaces($category: String!, $season: String!, $limit: Int, $nextToken: String) {
    getRaces(category: $category, season: $season, limit: $limit, nextToken: $nextToken) {
      items {
        PK
        SK
        entityType
        raceId
        raceName
        season
        qualyDate
        raceDate
        category
        circuit
        country
        status
        hasSprint
        createdAt
        updatedAt
      }
      nextToken
      __typename
    }
  }
`;

interface GetRacesResponse {
  getRaces: {
    items: Race[];
    nextToken: string | null;
    __typename: string;
  };
}

/**
 * Fetches races for a specific category and season
 * Automatically normalizes the category input to a valid category prefix
 * @param category Category name (e.g., "F1", "Formula 1", "MotoGP", etc.) - will be normalized
 * @param season Season year (e.g., "2026")
 * @param limit Optional limit (default: 100)
 * @param nextToken Optional pagination token
 * @returns Array of race entities
 */
export async function getRaces(
  category: string,
  season: string,
  limit: number = 100,
  nextToken?: string
): Promise<Race[]> {
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

  const logId = requestLogger.logRequest('getRaces', variables);

  try {
    const result = await client.graphql({
      query: GET_RACES,
      variables,
    }) as GraphQLResult<GetRacesResponse>;

    const duration = Date.now() - startTime;

    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0].message || 'Failed to fetch races';
      requestLogger.logError(logId, new Error(errorMessage), duration);
      throw new Error(errorMessage);
    }

    const items = result.data?.getRaces.items || [];
    requestLogger.logSuccess(logId, items.length, duration);
    return items;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    requestLogger.logError(logId, error, duration);
    throw error;
  }
}

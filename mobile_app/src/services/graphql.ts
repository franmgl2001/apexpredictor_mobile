import { generateClient } from 'aws-amplify/api';
import type { GraphQLResult } from '@aws-amplify/api-graphql';

export interface ApexEntity {
    PK: string;
    SK: string;
    entityType?: string;
    user_id?: string;
    username?: string;
    email?: string;
    race_id?: string;
    race_name?: string;
    season?: string;
    qualy_date?: string;
    race_date?: string;
    category?: string;
    circuit?: string;
    country?: string;
    status?: string;
    has_sprint?: boolean;
    predictions?: string;
    points_earned?: number;
    results?: string;
    driver_id?: string;
    name?: string;
    team?: string;
    number?: number;
    imageUrl?: string;
    teamColor?: string;
    isActive?: boolean;
    nationality?: string;
    birthDate?: string;
    league_id?: string;
    league_name?: string;
    description?: string;
    creator_id?: string;
    is_private?: boolean;
    join_code?: string;
    max_members?: number;
    member_count?: number;
    role?: string;
    points?: number;
    races?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetApexEntityResponse {
    getApexEntity: ApexEntity | null;
}

export interface ListApexEntitiesResponse {
    listApexEntities: {
        items: ApexEntity[];
        nextToken: string | null;
        __typename?: string;
    };
}

export interface ModelStringKeyConditionInput {
    eq?: string;
    beginsWith?: string;
}

export interface ModelApexEntityFilterInput {
    PK?: {
        beginsWith?: string;
        eq?: string;
    };
    SK?: ModelStringKeyConditionInput;
    entityType?: {
        eq?: string;
    };
    isActive?: {
        eq?: boolean;
    };
    [key: string]: any;
}

const GET_APEX_ENTITY = `
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
      createdAt
      updatedAt
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
        createdAt
        updatedAt
      }
      nextToken
      __typename
    }
  }
`;

const client = generateClient();

/**
 * Fetches an Apex Entity from the GraphQL API
 * @param PK Primary key (e.g., "user#61cbf510-20d1-7047-5006-b3ae8d8fb6e5")
 * @param SK Sort key (e.g., "PROFILE")
 * @returns The Apex Entity or null if not found
 */
export async function getApexEntity(PK: string, SK: string): Promise<ApexEntity | null> {
    try {
        const result = await client.graphql({
            query: GET_APEX_ENTITY,
            variables: { PK, SK },
        }) as GraphQLResult<GetApexEntityResponse>;

        if (result.errors && result.errors.length > 0) {
            // Check if the error is because entity doesn't exist (expected case)
            const errorMessage = result.errors[0].message || '';
            if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
                // Entity doesn't exist - return null (not an error)
                return null;
            }
            // For other errors, log and throw
            console.error('GraphQL errors:', result.errors);
            throw new Error(result.errors[0].message || 'Failed to fetch entity');
        }

        return result.data?.getApexEntity || null;
    } catch (error: any) {
        // Check if error is due to entity not existing (expected case for predictions)
        if (error?.message && (error.message.includes('not found') || error.message.includes('does not exist'))) {
            return null;
        }
        console.error('Error fetching Apex Entity:', error);
        throw error;
    }
}

/**
 * Fetches user profile from the GraphQL API
 * @param userId The Cognito user ID (without the "user#" prefix)
 * @returns The user profile or null if not found
 */
export async function getUserProfile(userId: string): Promise<ApexEntity | null> {
    const PK = `user#${userId}`;
    const SK = 'PROFILE';
    return getApexEntity(PK, SK);
}

/**
 * Fetches all race details from the GraphQL API
 * This is an atomic function specifically for fetching race entities with PK beginning with "race#" and SK equal to "DETAILS"
 * @param limit Optional limit (default: 1000)
 * @returns Array of race detail entities
 */
export async function getRaceDetails(limit: number = 1000): Promise<ApexEntity[]> {
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
 * Fetches all active drivers for a season from the GraphQL API
 * This is an atomic function specifically for fetching driver entities with:
 * - PK beginning with "driver#"
 * - SK beginning with "SEASON#2025" (or specified season)
 * - isActive equal to true
 * @param season Season year (default: "2025")
 * @param limit Optional limit (default: 1000)
 * @returns Array of driver entities
 */
export async function getDrivers(season: string = '2025', limit: number = 1000): Promise<ApexEntity[]> {
    try {
        const result = await client.graphql({
            query: LIST_APEX_ENTITIES,
            variables: {
                filter: {
                    PK: {
                        beginsWith: 'driver#',
                    },
                    SK: {
                        beginsWith: `SEASON#${season}`,
                    },
                    isActive: {
                        eq: true,
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

/**
 * Fetches user predictions for a specific race from the GraphQL API
 * This is an atomic function specifically for fetching prediction entities with:
 * - PK: "prediction#<userId>#<raceId>"
 * - SK: "RACEPREDICTION"
 * @param userId The Cognito user ID (without any prefix)
 * @param raceId The race ID (e.g., "mexico2025")
 * @returns The prediction entity or null if not found
 */
export async function getUserPredictions(userId: string, raceId: string): Promise<ApexEntity | null> {
    const PK = `prediction#${userId}#${raceId}`;
    const SK = 'RACEPREDICTION';
    return getApexEntity(PK, SK);
}


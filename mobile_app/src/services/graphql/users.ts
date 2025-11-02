/**
 * User-related GraphQL queries and mutations
 * Functions for fetching user profiles and predictions, and saving predictions
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import type { ApexEntity } from './types';
import { getApexEntity, listApexEntities } from './entities';
import { client, APEX_ENTITY_FIELDS } from './client';

/**
 * Fetches user profile from the GraphQL API
 * @param userId The Cognito user ID (without the "user#" prefix)
 * @returns The user profile or null if not found
 */
export async function getUserProfile(userId: string): Promise<ApexEntity | null> {
    const timestamp = new Date().toISOString();
    console.log(`[GraphQL] getUserProfile executed at ${timestamp} - userId: ${userId}`);

    const PK = `user#${userId}`;
    const SK = 'PROFILE';
    return getApexEntity(PK, SK);
}

/**
 * Fetches user predictions for a specific race from the GraphQL API
 * @param userId The Cognito user ID (without any prefix)
 * @param raceId The race ID (e.g., "mexico2025")
 * @returns The prediction entity or null if not found
 */
export async function getUserPredictions(userId: string, raceId: string): Promise<ApexEntity | null> {
    const timestamp = new Date().toISOString();
    console.log(`[GraphQL] getUserPredictions executed at ${timestamp} - userId: ${userId}, raceId: ${raceId}`);

    const PK = `prediction#${userId}#${raceId}`;
    const SK = 'RACEPREDICTION';
    return getApexEntity(PK, SK);
}

/**
 * Fetches all user predictions for races with results
 * @param userId The Cognito user ID (without any prefix)
 * @param raceIds Array of race IDs to fetch predictions for
 * @returns Map of race ID to prediction entity (null if not found)
 */
export async function getUserPredictionsForRaces(userId: string, raceIds: string[]): Promise<Map<string, ApexEntity | null>> {
    const timestamp = new Date().toISOString();
    console.log(`[GraphQL] getUserPredictionsForRaces executed at ${timestamp} - userId: ${userId}, raceIds: ${raceIds.length}`);

    try {
        const predictions = await listApexEntities({
            filter: {
                PK: { beginsWith: `prediction#${userId}#` },
                entityType: { eq: 'PREDICTION' },
                SK: { eq: 'RACEPREDICTION' },
            },
            limit: 1000,
        });

        // Create a map of raceId -> prediction entity
        const predictionsMap = new Map<string, ApexEntity | null>();

        // Initialize all raceIds with null (no prediction found)
        raceIds.forEach((raceId) => {
            predictionsMap.set(raceId, null);
        });

        // Fill in found predictions
        predictions.forEach((prediction) => {
            const raceId = prediction.race_id;
            if (raceId && raceIds.includes(raceId)) {
                predictionsMap.set(raceId, prediction);
            }
        });

        return predictionsMap;
    } catch (error: any) {
        console.error('Error fetching user predictions for races:', error);
        // Return map with all nulls on error
        const predictionsMap = new Map<string, ApexEntity | null>();
        raceIds.forEach((raceId) => {
            predictionsMap.set(raceId, null);
        });
        return predictionsMap;
    }
}

interface CreateApexEntityResponse {
    createApexEntity: ApexEntity;
}

interface UpdateApexEntityResponse {
    updateApexEntity: ApexEntity;
}

interface CreateApexEntityInput {
    PK: string;
    SK: string;
    entityType?: string;
    user_id?: string;
    username?: string;
    race_id?: string;
    predictions?: string;
    [key: string]: any;
}

interface UpdateApexEntityInput {
    PK: string;
    SK: string;
    entityType?: string;
    user_id?: string;
    username?: string;
    race_id?: string;
    predictions?: string;
    [key: string]: any;
}

const CREATE_APEX_ENTITY = `
  mutation CreateApexEntity($input: CreateApexEntityInput!) {
    createApexEntity(input: $input) {
      ${APEX_ENTITY_FIELDS}
    }
  }
`;

const UPDATE_APEX_ENTITY = `
  mutation UpdateApexEntity($input: UpdateApexEntityInput!) {
    updateApexEntity(input: $input) {
      ${APEX_ENTITY_FIELDS}
    }
  }
`;

/**
 * Saves user predictions for a specific race (creates or updates)
 * @param userId The Cognito user ID (without any prefix)
 * @param username The username
 * @param raceId The race ID (e.g., "brazil2025")
 * @param predictionsJson JSON string containing the predictions
 * @returns The created/updated prediction entity
 */
export async function saveUserPredictions(
    userId: string,
    username: string,
    raceId: string,
    predictionsJson: string
): Promise<ApexEntity> {
    const timestamp = new Date().toISOString();
    console.log(`[GraphQL] saveUserPredictions executed at ${timestamp} - userId: ${userId}, raceId: ${raceId}`);

    const PK = `prediction#${userId}#${raceId}`;
    const SK = 'RACEPREDICTION';

    // Check if prediction already exists
    const existing = await getApexEntity(PK, SK);
    const isUpdate = existing !== null;

    const input: CreateApexEntityInput | UpdateApexEntityInput = {
        PK,
        SK,
        entityType: 'PREDICTION',
        user_id: userId,
        username: username,
        race_id: raceId,
        predictions: predictionsJson,
    };

    try {
        let result;
        if (isUpdate) {
            // Update existing prediction
            result = await client.graphql({
                query: UPDATE_APEX_ENTITY,
                variables: { input },
            }) as GraphQLResult<UpdateApexEntityResponse>;

            if (result.errors && result.errors.length > 0) {
                const errorMessage = result.errors[0].message || 'Failed to update predictions';
                console.error('GraphQL errors:', result.errors);
                throw new Error(errorMessage);
            }

            if (!result.data?.updateApexEntity) {
                throw new Error('Failed to update predictions: No data returned');
            }

            return result.data.updateApexEntity;
        } else {
            // Create new prediction
            result = await client.graphql({
                query: CREATE_APEX_ENTITY,
                variables: { input },
            }) as GraphQLResult<CreateApexEntityResponse>;

            if (result.errors && result.errors.length > 0) {
                const errorMessage = result.errors[0].message || 'Failed to save predictions';
                console.error('GraphQL errors:', result.errors);
                throw new Error(errorMessage);
            }

            if (!result.data?.createApexEntity) {
                throw new Error('Failed to save predictions: No data returned');
            }

            return result.data.createApexEntity;
        }
    } catch (error: any) {
        console.error('Error saving predictions:', error);
        throw error;
    }
}


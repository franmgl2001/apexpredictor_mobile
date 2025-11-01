/**
 * User-related GraphQL queries
 * Functions for fetching user profiles and predictions
 */

import type { ApexEntity } from './types';
import { getApexEntity, listApexEntities } from './entities';

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


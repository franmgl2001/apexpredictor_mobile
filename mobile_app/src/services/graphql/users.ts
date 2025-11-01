/**
 * User-related GraphQL queries
 * Functions for fetching user profiles and predictions
 */

import type { ApexEntity } from './types';
import { getApexEntity } from './entities';

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


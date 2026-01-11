/**
 * User-related GraphQL queries and mutations
 * Functions for fetching user profiles and predictions, and saving predictions
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import type { ApexEntity, ListApexEntitiesResponse } from './types';
import { getApexEntity, getApexEntityNoDateTime, listApexEntities, listApexEntitiesNoDateTime } from './entities';
import { client, APEX_ENTITY_FIELDS } from './client';
import { requestLogger } from './requestLogger';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

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

    // Use getApexEntityNoDateTime to avoid DateTime serialization errors
    // Predictions don't need createdAt/updatedAt fields, and some have invalid DateTime values
    return getApexEntityNoDateTime(PK, SK);
}

/**
 * Fetches all user predictions in a single query (optimized for MyTeamScreen)
 * Uses user_id filter and SK = RACEPREDICTION
 * @param userId The Cognito user ID (without any prefix)
 * @returns Map of race ID to prediction entity (null if not found)
 */
export async function getAllUserPredictions(userId: string): Promise<Map<string, ApexEntity | null>> {
    const timestamp = new Date().toISOString();
    console.log(`[GraphQL] getAllUserPredictions executed at ${timestamp} - userId: ${userId}`);

    try {
        // Use listApexEntitiesNoDateTime to avoid DateTime serialization errors
        // Filter by user_id and SK to get all predictions in one query
        const predictions = await listApexEntitiesNoDateTime({
            filter: {
                user_id: { eq: userId },
                entityType: { eq: 'PREDICTION' },
                SK: { eq: 'RACEPREDICTION' },
            },
            limit: 1000,
        });

        // Create a map of raceId -> prediction entity
        const predictionsMap = new Map<string, ApexEntity | null>();

        // Fill in found predictions
        predictions.forEach((prediction: ApexEntity) => {
            const raceId = prediction.race_id;
            if (raceId) {
                predictionsMap.set(raceId, prediction);
            }
        });

        return predictionsMap;
    } catch (error: any) {
        // GraphQL client might throw the result object if there are errors
        // Check if the error contains data we can use
        if (error?.data?.listApexEntities?.items) {
            const predictions = error.data.listApexEntities.items;
            const predictionsMap = new Map<string, ApexEntity | null>();

            predictions.forEach((prediction: any) => {
                const raceId = prediction.race_id;
                if (raceId) {
                    predictionsMap.set(raceId, prediction);
                }
            });

            // Log warning about errors but return the data
            if (error.errors && error.errors.length > 0) {
                console.warn('[getAllUserPredictions] GraphQL errors but data available:', error.errors);
            }

            return predictionsMap;
        }

        // Only log real errors, not expected cases like "not found"
        const errorMessage = String(error?.message || error || '');
        const isExpectedCase =
            errorMessage.includes('not found') ||
            errorMessage.includes('does not exist') ||
            error === null ||
            error === undefined;

        if (!isExpectedCase) {
            console.error('Error fetching all user predictions:', error);
        }
        return new Map<string, ApexEntity | null>();
    }
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
        predictions.forEach((prediction: ApexEntity) => {
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

interface UpsertUserProfileInput {
    username: string;
    country: string;
    email: string;
}

interface UpsertMyProfileResponse {
    upsertMyProfile: {
        user_id: string;
        email?: string;
        username: string;
        country: string;
        createdAt?: string;
        updatedAt?: string;
    };
}

const UPSERT_MY_PROFILE = `
  mutation UpsertMyProfile($input: UpsertUserProfileInput!) {
    upsertMyProfile(input: $input) {
      user_id
      email
      username
      country
      createdAt
      updatedAt
    }
  }
`;

/**
 * Saves or updates user profile (creates or updates)
 * @param username The username
 * @param country The user's country
 * @returns The created/updated profile entity
 */
export async function saveUserProfile(
    username: string,
    country: string
): Promise<ApexEntity> {
    const startTime = Date.now();

    // Get the current user's ID and email
    const currentUser = await getCurrentUser();
    const userId = currentUser.userId;
    const userAttributes = await fetchUserAttributes();
    const email = userAttributes.email || userAttributes['email'] || '';

    if (!email) {
        throw new Error('User email not found. Please ensure your account has a verified email address.');
    }

    const input: UpsertUserProfileInput = {
        username: username,
        country: country,
        email: email,
    };

    // Log the actual variables being sent to GraphQL
    const variables = { input };
    const logId = requestLogger.logRequest('saveUserProfile', variables);

    try {
        const result = await client.graphql({
            query: UPSERT_MY_PROFILE,
            variables: { input },
        }) as GraphQLResult<UpsertMyProfileResponse>;

        const duration = Date.now() - startTime;

        if (result.errors && result.errors.length > 0) {
            const errorMessage = result.errors[0].message || 'Failed to save profile';
            const errorDetails = {
                errors: result.errors,
                data: result.data,
            };
            console.error('[GraphQL Error Details]', errorDetails);
            requestLogger.logError(logId, new Error(errorMessage), duration);
            throw new Error(errorMessage);
        }

        if (!result.data?.upsertMyProfile) {
            const errorDetails = {
                data: result.data,
                errors: result.errors,
                variables: { input },
                userId: userId,
            };
            console.error('[GraphQL No Data]', errorDetails);
            console.error('[GraphQL Full Response]', JSON.stringify(result, null, 2));

            // More descriptive error message
            const errorMessage = result.data?.upsertMyProfile === null
                ? 'Backend resolver returned null. This may indicate: 1) Resolver cannot access user email from auth context, 2) Database write failed, or 3) Resolver logic error. Check backend logs.'
                : 'Failed to save profile: No data returned';

            const error = new Error(errorMessage);
            requestLogger.logError(logId, error, duration);
            throw error;
        }

        // Convert the response to ApexEntity format
        const profileData = result.data.upsertMyProfile;
        const apexEntity: ApexEntity = {
            PK: `user#${profileData.user_id}`,
            SK: 'PROFILE',
            entityType: 'USER',
            user_id: profileData.user_id,
            username: profileData.username,
            email: profileData.email,
            country: profileData.country,
            createdAt: profileData.createdAt,
            updatedAt: profileData.updatedAt,
        };

        requestLogger.logSuccess(logId, 1, duration);
        return apexEntity;
    } catch (error: any) {
        const duration = Date.now() - startTime;
        requestLogger.logError(logId, error, duration);
        throw error;
    }
}

/**
 * Saves or creates user leaderboard entry for a season (creates or updates)
 * @param userId The Cognito user ID (without any prefix)
 * @param username The username
 * @param season The season year (defaults to current year)
 * @returns The created/updated leaderboard entity
 */
export async function saveUserLeaderboardEntry(
    userId: string,
    username: string,
    season?: string
): Promise<ApexEntity> {
    const startTime = Date.now();
    const seasonYear = season || new Date().getFullYear().toString();
    const PK = `user#${userId}#season#${seasonYear}`;
    const SK = 'TOTALPOINTS';
    const variables = { userId, username, season: seasonYear };
    const logId = requestLogger.logRequest('saveUserLeaderboardEntry', variables);

    // Check if leaderboard entry already exists
    const existing = await getApexEntity(PK, SK);
    const isUpdate = existing !== null;

    const input: CreateApexEntityInput | UpdateApexEntityInput = {
        PK,
        SK,
        entityType: 'LEADERBOARD',
        user_id: userId,
        username: username,
        season: seasonYear,
        points: existing?.points ?? 0,
        races: existing?.races ?? 0,
    };

    try {
        let result;
        const duration = Date.now() - startTime;
        // COMMENTED OUT: GraphQL calls disabled - migrating to CDK backend
        throw new Error('GraphQL mutations are disabled - backend migration in progress');
        /* COMMENTED OUT - Original GraphQL code:
        if (isUpdate) {
            // Update existing leaderboard entry (preserve existing points and races)
            result = await client.graphql({
                query: UPDATE_APEX_ENTITY,
                variables: { input },
            }) as GraphQLResult<UpdateApexEntityResponse>;

            if (result.errors && result.errors.length > 0) {
                const errorMessage = result.errors[0].message || 'Failed to update leaderboard entry';
                requestLogger.logError(logId, new Error(errorMessage), duration);
                throw new Error(errorMessage);
            }

            if (!result.data?.updateApexEntity) {
                const error = new Error('Failed to update leaderboard entry: No data returned');
                requestLogger.logError(logId, error, duration);
                throw error;
            }

            requestLogger.logSuccess(logId, 1, duration);
            return result.data.updateApexEntity;
        } else {
            // Create new leaderboard entry with initial values
            result = await client.graphql({
                query: CREATE_APEX_ENTITY,
                variables: { input },
            }) as GraphQLResult<CreateApexEntityResponse>;

            if (result.errors && result.errors.length > 0) {
                const errorMessage = result.errors[0].message || 'Failed to create leaderboard entry';
                requestLogger.logError(logId, new Error(errorMessage), duration);
                throw new Error(errorMessage);
            }

            if (!result.data?.createApexEntity) {
                const error = new Error('Failed to create leaderboard entry: No data returned');
                requestLogger.logError(logId, error, duration);
                throw error;
            }

            requestLogger.logSuccess(logId, 1, duration);
            return result.data.createApexEntity;
        }
        */
    } catch (error: any) {
        const duration = Date.now() - startTime;
        requestLogger.logError(logId, error, duration);
        throw error;
    }
}

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
    const startTime = Date.now();
    const PK = `prediction#${userId}#${raceId}`;
    const SK = 'RACEPREDICTION';
    const variables = { userId, username, raceId };
    const logId = requestLogger.logRequest('saveUserPredictions', variables);

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
        const duration = Date.now() - startTime;
        // COMMENTED OUT: GraphQL calls disabled - migrating to CDK backend
        throw new Error('GraphQL mutations are disabled - backend migration in progress');
        /* COMMENTED OUT - Original GraphQL code:
        if (isUpdate) {
            // Update existing prediction
            result = await client.graphql({
                query: UPDATE_APEX_ENTITY,
                variables: { input },
            }) as GraphQLResult<UpdateApexEntityResponse>;

            if (result.errors && result.errors.length > 0) {
                const errorMessage = result.errors[0].message || 'Failed to update predictions';
                requestLogger.logError(logId, new Error(errorMessage), duration);
                throw new Error(errorMessage);
            }

            if (!result.data?.updateApexEntity) {
                const error = new Error('Failed to update predictions: No data returned');
                requestLogger.logError(logId, error, duration);
                throw error;
            }

            requestLogger.logSuccess(logId, 1, duration);
            return result.data.updateApexEntity;
        } else {
            // Create new prediction
            result = await client.graphql({
                query: CREATE_APEX_ENTITY,
                variables: { input },
            }) as GraphQLResult<CreateApexEntityResponse>;

            if (result.errors && result.errors.length > 0) {
                const errorMessage = result.errors[0].message || 'Failed to save predictions';
                requestLogger.logError(logId, new Error(errorMessage), duration);
                throw new Error(errorMessage);
            }

            if (!result.data?.createApexEntity) {
                const error = new Error('Failed to save predictions: No data returned');
                requestLogger.logError(logId, error, duration);
                throw error;
            }

            requestLogger.logSuccess(logId, 1, duration);
            return result.data.createApexEntity;
        }
        */
    } catch (error: any) {
        const duration = Date.now() - startTime;
        requestLogger.logError(logId, error, duration);
        throw error;
    }
}


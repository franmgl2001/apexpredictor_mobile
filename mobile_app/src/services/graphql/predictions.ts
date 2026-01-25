/**
 * Prediction-related GraphQL queries and mutations
 * Functions for fetching and saving race predictions
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client } from './client';
import { requestLogger } from './requestLogger';
import { fetchAuthSession } from 'aws-amplify/auth';

const UPSERT_PREDICTION = /* GraphQL */ `
    mutation UpsertPrediction($input: UpsertPredictionInput!) {
        upsertPrediction(input: $input) {
            category
            season
            raceId
            userId
            prediction
            points
            createdAt
            updatedAt
        }
    }
`;

interface UpsertPredictionResponse {
    upsertPrediction: {
        category: string;
        season: string;
        raceId: string;
        userId: string;
        prediction: any;
        points: number;
        createdAt: string;
        updatedAt: string;
    };
}

const LIST_MY_RACES = /* GraphQL */ `
    query ListMyRaces($category: String, $season: String, $limit: Int, $nextToken: String) {
        listMyRaces(category: $category, season: $season, limit: $limit, nextToken: $nextToken) {
            items {
                category
                season
                raceId
                userId
                prediction
                points
                createdAt
                updatedAt
            }
            nextToken
        }
    }
`;

interface RacePrediction {
    category: string;
    season: string;
    raceId: string;
    userId: string;
    prediction: any;
    points: number;
    createdAt: string;
    updatedAt: string;
}

interface ListMyRacesResponse {
    listMyRaces: {
        items: RacePrediction[];
        nextToken: string | null;
    };
}

/**
 * Saves or updates a race prediction
 * @param category The racing category (e.g., "F1", "MotoGP")
 * @param season The season year (e.g., "2026")
 * @param raceId The race ID
 * @param prediction JSON string of the prediction data
 * @returns The created/updated prediction
 */
export async function upsertPrediction(
    category: string,
    season: string,
    raceId: string,
    prediction: string
): Promise<UpsertPredictionResponse['upsertPrediction']> {
    await fetchAuthSession();

    const startTime = Date.now();

    // Validate and normalize the JSON string
    // Storing as String type (simpler than AWSJSON)
    let predictionJson: string;
    try {
        // Parse to validate, then stringify to ensure clean JSON
        const parsed = JSON.parse(prediction);
        predictionJson = JSON.stringify(parsed);
    } catch (e) {
        throw new Error('Invalid prediction format: must be valid JSON');
    }

    const logId = requestLogger.logRequest('upsertPrediction', {
        category,
        season,
        raceId,
        hasPrediction: !!prediction
    });

    try {
        // Pass prediction as a JSON string - String type in schema
        const result = await client.graphql({
            query: UPSERT_PREDICTION,
            variables: {
                input: {
                    category,
                    season,
                    raceId,
                    prediction: predictionJson, // JSON string
                },
            },
        }) as GraphQLResult<UpsertPredictionResponse>;

        const duration = Date.now() - startTime;

        if (result.errors && result.errors.length > 0) {
            throw new Error(result.errors[0].message || 'Failed to save prediction');
        }

        if (!result.data?.upsertPrediction) {
            throw new Error('Failed to save prediction: No data returned');
        }

        const predictionData = result.data.upsertPrediction;
        requestLogger.logSuccess(logId, 1, duration);
        return predictionData;
    } catch (error: any) {
        const duration = Date.now() - startTime;
        requestLogger.logError(logId, error, duration);
        throw error;
    }
}

/**
 * Fetches all race predictions for the logged-in user
 * Uses the byUser GSI to query predictions
 * @param category Optional category filter (e.g., "F1", "MotoGP")
 * @param season Optional season filter (e.g., "2026")
 * @param limit Optional limit (default: 50)
 * @param nextToken Optional pagination token
 * @returns Array of race predictions
 */
export async function listMyPredictions(
    category?: string,
    season?: string,
    limit: number = 50,
    nextToken?: string
): Promise<RacePrediction[]> {
    await fetchAuthSession();

    const startTime = Date.now();

    const variables: {
        category?: string;
        season?: string;
        limit: number;
        nextToken?: string;
    } = {
        limit,
    };

    if (category) {
        variables.category = category;
    }

    if (season) {
        variables.season = season;
    }

    if (nextToken) {
        variables.nextToken = nextToken;
    }

    const logId = requestLogger.logRequest('listMyPredictions', variables);

    try {
        const result = await client.graphql({
            query: LIST_MY_RACES,
            variables,
        }) as GraphQLResult<ListMyRacesResponse>;

        const duration = Date.now() - startTime;

        if (result.errors && result.errors.length > 0) {
            throw new Error(result.errors[0].message || 'Failed to fetch predictions');
        }

        const items = result.data?.listMyRaces.items || [];
        requestLogger.logSuccess(logId, items.length, duration);
        return items;
    } catch (error: any) {
        const duration = Date.now() - startTime;
        requestLogger.logError(logId, error, duration);
        throw error;
    }
}

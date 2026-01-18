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
            series
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

const LIST_MY_RACES = /* GraphQL */ `
    query ListMyRaces($series: String, $season: String, $limit: Int, $nextToken: String) {
        listMyRaces(series: $series, season: $season, limit: $limit, nextToken: $nextToken) {
            items {
                series
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

interface ListMyRacesResponse {
    listMyRaces: {
        items: Array<{
            series: string;
            season: string;
            raceId: string;
            userId: string;
            prediction: any;
            points: number;
            createdAt: string;
            updatedAt: string;
        }>;
        nextToken: string | null;
    };
}

interface UpsertPredictionResponse {
    upsertPrediction: {
        series: string;
        season: string;
        raceId: string;
        userId: string;
        prediction: any;
        points: number;
        createdAt: string;
        updatedAt: string;
    };
}

/**
 * Saves or updates a race prediction
 * @param series The racing series (e.g., "f1", "motogp")
 * @param season The season year (e.g., "2026")
 * @param raceId The race ID
 * @param prediction JSON string of the prediction data
 * @returns The created/updated prediction
 */
export async function upsertPrediction(
    series: string,
    season: string,
    raceId: string,
    prediction: string
): Promise<UpsertPredictionResponse['upsertPrediction']> {
    await fetchAuthSession();

    const startTime = Date.now();

    // Validate and normalize the JSON string
    // AWSJSON type accepts JSON strings or objects
    let predictionJson: string;
    try {
        // Parse to validate, then stringify to ensure clean JSON
        const parsed = JSON.parse(prediction);
        predictionJson = JSON.stringify(parsed);
    } catch (e) {
        throw new Error('Invalid prediction format: must be valid JSON');
    }

    const logId = requestLogger.logRequest('upsertPrediction', {
        series,
        season,
        raceId,
        hasPrediction: !!prediction
    });

    try {
        // Pass prediction as a JSON string - AWSJSON type in schema
        const result = await client.graphql({
            query: UPSERT_PREDICTION,
            variables: {
                input: {
                    series,
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
 * Fetches all predictions for the authenticated user
 * @param series Optional series filter (e.g., "f1", "motogp")
 * @param season Optional season filter (e.g., "2026")
 * @returns Array of prediction items
 */
export async function listMyRaces(
    series?: string,
    season?: string,
    limit: number = 100
): Promise<ListMyRacesResponse['listMyRaces']['items']> {
    await fetchAuthSession();

    const startTime = Date.now();
    const logId = requestLogger.logRequest('listMyRaces', {
        series,
        season,
        limit
    });

    try {
        const result = await client.graphql({
            query: LIST_MY_RACES,
            variables: {
                series,
                season,
                limit,
            },
        }) as GraphQLResult<ListMyRacesResponse>;

        const duration = Date.now() - startTime;

        if (result.errors && result.errors.length > 0) {
            throw new Error(result.errors[0].message || 'Failed to fetch predictions');
        }

        if (!result.data?.listMyRaces) {
            throw new Error('Failed to fetch predictions: No data returned');
        }

        const predictions = result.data.listMyRaces.items;
        requestLogger.logSuccess(logId, predictions.length, duration);
        return predictions;
    } catch (error: any) {
        const duration = Date.now() - startTime;
        requestLogger.logError(logId, error, duration);
        throw error;
    }
}

/**
 * User-related GraphQL queries and mutations
 * Functions for fetching and saving user profiles
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client } from './client';
import { requestLogger } from './requestLogger';
import { fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';

export interface UserProfile {
    userId: string;
    email: string;
    username: string;
    country: string;
    createdAt?: string;
    updatedAt?: string;
}

const GET_MY_PROFILE = `
  query GetMyProfile {
    getMyProfile {
      userId
      email
      username
      country
      createdAt
      updatedAt
    }
  }
`;

interface UpsertUserProfileInput {
    username: string;
    country: string;
    email: string;
}

interface UpsertMyProfileResponse {
    upsertMyProfile: UserProfile;
}

interface InitMyLeaderboardsResponse {
    initMyLeaderboards: boolean;
}

const UPSERT_MY_PROFILE = `
  mutation UpsertMyProfile($input: UpsertUserProfileInput!) {
    upsertMyProfile(input: $input) {
      userId
      email
      username
      country
      createdAt
      updatedAt
    }
  }
`;

const INIT_MY_LEADERBOARDS = `
  mutation InitMyLeaderboards {
    initMyLeaderboards
  }
`;

/**
 * Fetches current user profile from the GraphQL API (uses auth context)
 * @returns The user profile or null if not found
 */
export async function getMyProfile(): Promise<UserProfile | null> {
    await fetchAuthSession();

    const startTime = Date.now();
    const logId = requestLogger.logRequest('getMyProfile', {});

    try {
        const result = await client.graphql({
            query: GET_MY_PROFILE,
            variables: {},
        }) as GraphQLResult<{
            getMyProfile: UserProfile | null;
        }>;

        const duration = Date.now() - startTime;

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        const profile = result.data?.getMyProfile || null;
        requestLogger.logSuccess(logId, profile ? 1 : 0, duration);
        return profile;
    } catch (e: any) {
        const duration = Date.now() - startTime;
        requestLogger.logError(logId, e, duration);
        throw e;
    }
}

/**
 * Saves or updates user profile (creates or updates)
 * @param username The username
 * @param country The user's country
 * @returns The created/updated profile
 */
export async function saveUserProfile(
    username: string,
    country: string
): Promise<UserProfile> {
    const startTime = Date.now();

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

    const logId = requestLogger.logRequest('saveUserProfile', { input });

    try {
        const result = await client.graphql({
            query: UPSERT_MY_PROFILE,
            variables: { input },
        }) as GraphQLResult<UpsertMyProfileResponse>;

        const duration = Date.now() - startTime;

        if (result.errors && result.errors.length > 0) {
            throw new Error(result.errors[0].message || 'Failed to save profile');
        }

        if (!result.data?.upsertMyProfile) {
            throw new Error('Failed to save profile: No data returned');
        }

        const profile = result.data.upsertMyProfile;

        // Step 2: Initialize leaderboards for all categories
        // Note: The username is now available from the profile we just created
        // The backend resolver will fetch it from the profile, but we ensure it exists first
        try {
            await client.graphql({
                query: INIT_MY_LEADERBOARDS,
                variables: {},
            });
        } catch (initError) {
            // Log but don't fail the whole process if leaderboards fail to init
            console.warn('Failed to initialize leaderboards:', initError);
        }

        requestLogger.logSuccess(logId, 1, duration);
        return profile;
    } catch (error: any) {
        const duration = Date.now() - startTime;
        requestLogger.logError(logId, error, duration);
        throw error;
    }
}

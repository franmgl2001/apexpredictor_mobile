/**
 * User-related GraphQL queries and mutations
 * Functions for fetching and saving user profiles
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import type { ApexEntity } from './types';
import { client } from './client';
import { requestLogger } from './requestLogger';
import { fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';

const GET_MY_PROFILE = `
  query GetMyProfile {
    getMyProfile {
      user_id
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
 * Fetches current user profile from the GraphQL API (uses auth context)
 * @returns The user profile or null if not found
 */
export async function getMyProfile(): Promise<ApexEntity | null> {
    await fetchAuthSession();

    const startTime = Date.now();
    const logId = requestLogger.logRequest('getMyProfile', {});

    try {
        const result = await client.graphql({
            query: GET_MY_PROFILE,
            variables: {},
        }) as GraphQLResult<{
            getMyProfile: {
                user_id: string;
                email: string;
                username: string;
                country: string;
                createdAt: string;
                updatedAt: string;
            } | null;
        }>;

        const duration = Date.now() - startTime;

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        const p = result.data?.getMyProfile;
        if (!p) {
            requestLogger.logSuccess(logId, 0, duration);
            return null;
        }

        const entity: ApexEntity = {
            PK: `user#${p.user_id}`,
            SK: 'PROFILE',
            entityType: 'USER',
            user_id: p.user_id,
            email: p.email,
            username: p.username,
            country: p.country,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };

        requestLogger.logSuccess(logId, 1, duration);
        return entity;
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
 * @returns The created/updated profile entity
 */
export async function saveUserProfile(
    username: string,
    country: string
): Promise<ApexEntity> {
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

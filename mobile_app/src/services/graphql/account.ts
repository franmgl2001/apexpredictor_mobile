/**
 * Account-related GraphQL mutations
 * Functions for account management (deletion, etc.)
 */

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client } from './client';
import { requestLogger } from './requestLogger';

const DELETE_MY_ACCOUNT = `
  mutation DeleteMyAccount {
    deleteMyAccount
  }
`;

interface DeleteMyAccountResponse {
    deleteMyAccount: boolean;
}

/**
 * Deletes the current user's account entirely.
 * This will:
 * - Remove all user data from DynamoDB (profile, predictions, leaderboard entries, league memberships)
 * - Delete the Cognito user
 * 
 * After calling this, the user must be signed out locally.
 * 
 * @returns true if the account was deleted successfully
 */
export async function deleteMyAccount(): Promise<boolean> {
    const startTime = Date.now();
    const logId = requestLogger.logRequest('deleteMyAccount', {});

    try {
        const result = await client.graphql({
            query: DELETE_MY_ACCOUNT,
            variables: {},
        }) as GraphQLResult<DeleteMyAccountResponse>;

        const duration = Date.now() - startTime;

        if (result.errors && result.errors.length > 0) {
            throw new Error(result.errors[0].message || 'Failed to delete account');
        }

        requestLogger.logSuccess(logId, 1, duration);
        return result.data?.deleteMyAccount ?? false;
    } catch (error: any) {
        const duration = Date.now() - startTime;
        requestLogger.logError(logId, error, duration);
        throw error;
    }
}


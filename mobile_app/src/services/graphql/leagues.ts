/**
 * League-related GraphQL queries
 * Functions for fetching league data
 */

import type { ApexEntity, ModelApexEntityFilterInput } from './types';
import { listApexEntities } from './entities';

/**
 * Fetches leagues from the GraphQL API
 * @param userId Optional user ID to filter leagues the user is a member of
 * @param isPrivate Optional flag to filter private/public leagues
 * @returns Array of league entities
 */
export async function getLeagues(
    userId?: string,
    isPrivate?: boolean
): Promise<ApexEntity[]> {
    const timestamp = new Date().toISOString();
    console.log(`[GraphQL] getLeagues executed at ${timestamp} - userId: ${userId}, isPrivate: ${isPrivate}`);

    try {
        const filter: ModelApexEntityFilterInput = {
            entityType: { eq: 'LEAGUE' },
        };

        // If filtering by user membership, we'd need to query league memberships
        // For now, we'll get all leagues and filter client-side if needed

        if (isPrivate !== undefined) {
            filter.is_private = { eq: isPrivate };
        }

        const leagues = await listApexEntities({
            filter,
            limit: 1000,
        });

        return leagues;
    } catch (error: any) {
        console.error('Error fetching leagues:', error);
        throw error;
    }
}

/**
 * Fetches leagues that a user is a member of
 * @param userId The user ID to find leagues for
 * @returns Array of league entities the user is a member of
 */
export async function getUserLeagues(userId: string): Promise<ApexEntity[]> {
    const timestamp = new Date().toISOString();
    console.log(`[GraphQL] getUserLeagues executed at ${timestamp} - userId: ${userId}`);

    try {
        // First, try to query leagues directly where user_id matches (if memberships are stored this way)
        // This depends on your backend structure - leagues might have user_id for memberships
        const filter: ModelApexEntityFilterInput = {
            entityType: { eq: 'LEAGUE' },
            user_id: { eq: userId },
        };

        let leagues = await listApexEntities({
            filter,
            limit: 1000,
        });

        // If no results, try querying league memberships
        if (leagues.length === 0) {
            const membershipFilter: ModelApexEntityFilterInput = {
                entityType: { eq: 'LEAGUE_MEMBERSHIP' },
                user_id: { eq: userId },
            };

            const memberships = await listApexEntities({
                filter: membershipFilter,
                limit: 1000,
            });

            // Extract league IDs from memberships
            const leagueIds = memberships
                .map((membership) => membership.league_id)
                .filter((id): id is string => !!id);

            if (leagueIds.length > 0) {
                // Fetch the actual league entities
                for (const leagueId of leagueIds) {
                    const leagueFilter: ModelApexEntityFilterInput = {
                        entityType: { eq: 'LEAGUE' },
                        league_id: { eq: leagueId },
                    };

                    const leagueResults = await listApexEntities({
                        filter: leagueFilter,
                        limit: 1,
                    });

                    if (leagueResults.length > 0) {
                        // Merge membership data (role, etc.) with league data
                        const membership = memberships.find(m => m.league_id === leagueId);
                        leagues.push({
                            ...leagueResults[0],
                            role: membership?.role,
                        });
                    }
                }
            }
        }

        return leagues;
    } catch (error: any) {
        console.error('Error fetching user leagues:', error);
        // If the query fails, return empty array instead of throwing
        // This allows the UI to show "no leagues" message gracefully
        return [];
    }
}


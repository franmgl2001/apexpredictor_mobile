/**
 * Shared TypeScript types and interfaces for GraphQL queries
 */

export interface ApexEntity {
    PK: string;
    SK: string;
    entityType?: string;
    user_id?: string;
    username?: string;
    email?: string;
    race_id?: string;
    race_name?: string;
    season?: string;
    qualy_date?: string;
    race_date?: string;
    category?: string;
    circuit?: string;
    country?: string;
    status?: string;
    has_sprint?: boolean;
    predictions?: string;
    points_earned?: number;
    results?: string;
    driver_id?: string;
    name?: string;
    team?: string;
    number?: number;
    imageUrl?: string;
    teamColor?: string;
    isActive?: boolean;
    nationality?: string;
    birthDate?: string;
    league_id?: string;
    league_name?: string;
    description?: string;
    creator_id?: string;
    is_private?: boolean;
    join_code?: string;
    max_members?: number;
    member_count?: number;
    role?: string;
    points?: number;
    races?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetApexEntityResponse {
    getApexEntity: ApexEntity | null;
}

export interface ListApexEntitiesResponse {
    listApexEntities: {
        items: ApexEntity[];
        nextToken: string | null;
        __typename?: string;
    };
}

export interface LeaderboardByPointsResponse {
    leaderboardByPoints: {
        items: ApexEntity[];
        nextToken: string | null;
        __typename?: string;
    };
}

export interface ModelStringKeyConditionInput {
    eq?: string;
    beginsWith?: string;
}

export interface ModelApexEntityFilterInput {
    PK?: {
        beginsWith?: string;
        eq?: string;
    };
    SK?: ModelStringKeyConditionInput;
    entityType?: {
        eq?: string;
    };
    isActive?: {
        eq?: boolean;
    };
    [key: string]: any;
}

export interface ModelIntKeyConditionInput {
    eq?: number;
    between?: [number, number];
    le?: number;
    lt?: number;
    ge?: number;
    gt?: number;
}

export type ModelSortDirection = 'ASC' | 'DESC';


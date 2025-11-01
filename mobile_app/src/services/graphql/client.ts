/**
 * GraphQL client initialization and shared utilities
 */

import { generateClient } from 'aws-amplify/api';
import type { GraphQLResult } from '@aws-amplify/api-graphql';

// Initialize the GraphQL client
export const client = generateClient();

/**
 * Checks if an error indicates that an entity was not found (expected case)
 */
export function isEntityNotFoundError(error: any): boolean {
    const errorMessage = error?.message || '';
    return errorMessage.includes('not found') || errorMessage.includes('does not exist');
}

/**
 * Shared fragment containing all ApexEntity fields
 */
export const APEX_ENTITY_FIELDS = `
  PK
  SK
  entityType
  user_id
  username
  email
  race_id
  race_name
  season
  qualy_date
  race_date
  category
  circuit
  country
  status
  has_sprint
  predictions
  points_earned
  results
  driver_id
  name
  team
  number
  imageUrl
  teamColor
  isActive
  nationality
  birthDate
  league_id
  league_name
  description
  creator_id
  is_private
  join_code
  max_members
  member_count
  role
  points
  races
  createdAt
  updatedAt
`;


/**
 * GraphQL client initialization and shared utilities
 */

import { generateClient } from 'aws-amplify/api';

// Initialize the GraphQL client
export const client = generateClient();

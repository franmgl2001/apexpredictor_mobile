/**
 * @format
 */

// Import and initialize Amplify React Native modules first to ensure native modules are registered
import { loadGetRandomValues } from '@aws-amplify/react-native';

// Load required native modules for Amplify
loadGetRandomValues();

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

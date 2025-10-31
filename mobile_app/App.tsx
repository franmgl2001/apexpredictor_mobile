/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, StyleSheet, useColorScheme, View, ActivityIndicator } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { Amplify } from 'aws-amplify';
import amplifyconfig from './amplify_outputs.json';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Configure Amplify with the outputs
// @aws-amplify/react-native automatically sets up AsyncStorage for React Native
Amplify.configure(amplifyconfig);
import MobileBottomNav, { RouteKey } from './src/components/MobileBottomNav';
import MyTeamScreen from './src/screens/MyTeamScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import LeaguesScreen from './src/screens/LeaguesScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

type AuthScreen = 'signin' | 'signup';

function AppContent() {
  const { isAuthenticated, isLoading, signIn, signUp } = useAuth();
  const [route, setRoute] = useState<RouteKey>('myteam');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('signin');

  // Show loading spinner while checking auth status
  if (isLoading && !isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      </SafeAreaView>
    );
  }

  // Show authentication screens if not authenticated
  if (!isAuthenticated) {
    if (authScreen === 'signup') {
      return (
        <SafeAreaView style={styles.container}>
          <SignUpScreen
            onSignUp={async (email, password) => {
              try {
                await signUp(email, password);
                // After successful signup, navigate to sign in
                // TODO: Handle email verification flow
                setAuthScreen('signin');
              } catch (error: any) {
                // Error handling is done in the screen component
                throw error;
              }
            }}
            onNavigateToSignIn={() => setAuthScreen('signin')}
            isLoading={isLoading}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <SignInScreen
          onSignIn={async (email, password) => {
            try {
              await signIn(email, password);
            } catch (error: any) {
              console.error('Sign in error:', error);
              // Error handling is done in the screen component if needed
            }
          }}
          onNavigateToSignUp={() => setAuthScreen('signup')}
          isLoading={isLoading}
        />
      </SafeAreaView>
    );
  }

  // Show main app if authenticated
  let Screen: React.ReactElement;
  if (route === 'myteam') {
    Screen = <MyTeamScreen />;
  } else if (route === 'leaderboard') {
    Screen = <LeaderboardScreen />;
  } else {
    Screen = <LeaguesScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{Screen}</View>
      <MobileBottomNav currentRoute={route} onNavigate={setRoute} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 76,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default App;

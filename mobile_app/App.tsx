/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, StyleSheet, useColorScheme, View, ActivityIndicator, Modal } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { fetchUserAttributes } from 'aws-amplify/auth';
import amplifyconfig from './amplify_outputs.json';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { DataProvider, useData } from './src/contexts/DataContext';
import { saveUserProfile, saveUserLeaderboardEntry } from './src/services/graphql/users';

// Configure Amplify with the outputs
// @aws-amplify/react-native automatically sets up AsyncStorage for React Native
Amplify.configure(amplifyconfig);
import MobileBottomNav, { RouteKey } from './src/components/MobileBottomNav';
import MyTeamScreen from './src/screens/MyTeamScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import LeaguesScreen from './src/screens/LeaguesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import VerificationCodeScreen from './src/screens/VerificationCodeScreen';
import UsernamePromptModal from './src/components/UsernamePromptModal';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

type AuthScreen = 'signin' | 'signup' | 'verification';

function AppContent() {
  const { isAuthenticated, isLoading, signIn, signUp, confirmSignUp, resendSignUpCode, user } = useAuth();
  const { profile, isLoading: profileLoading, refetchProfile } = useData();
  const [route, setRoute] = useState<RouteKey>('myteam');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('signin');
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [pendingPassword, setPendingPassword] = useState<string>('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Check if username is empty and show modal
  useEffect(() => {
    if (isAuthenticated && !profileLoading && profile !== undefined) {
      // Check if profile exists and username is empty/null
      if (profile === null || !profile.username) {
        setShowUsernameModal(true);
      }
    }
  }, [isAuthenticated, profileLoading, profile]);

  const handleSaveUsername = async (username: string) => {
    if (!user?.userId) {
      throw new Error('User not authenticated');
    }

    setIsSavingUsername(true);
    try {
      // Get user email from profile or fetch from attributes
      let email = profile?.email;
      if (!email) {
        try {
          const attributes = await fetchUserAttributes();
          email = attributes.email || user.username || '';
        } catch (error) {
          // Fallback to username if fetch fails
          email = user.username || '';
        }
      }

      if (!email) {
        throw new Error('Unable to retrieve user email');
      }

      // Create both profile and leaderboard entry
      await Promise.all([
        saveUserProfile(user.userId, username, email),
        saveUserLeaderboardEntry(user.userId, username),
      ]);

      await refetchProfile();
      setShowUsernameModal(false);
    } catch (error: any) {
      console.error('Error saving username:', error);
      throw error;
    } finally {
      setIsSavingUsername(false);
    }
  };

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
    if (authScreen === 'verification') {
      return (
        <SafeAreaView style={styles.container}>
          <VerificationCodeScreen
            email={pendingEmail}
            password={pendingPassword}
            onVerify={async (email, code, password) => {
              try {
                await confirmSignUp(email, code, password);
                // After successful verification, user will be automatically signed in
                // The auth state will update and show the main app
              } catch (error: any) {
                // Error handling is done in the screen component
                throw error;
              }
            }}
            onResendCode={async () => {
              try {
                await resendSignUpCode(pendingEmail);
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

    if (authScreen === 'signup') {
      return (
        <SafeAreaView style={styles.container}>
          <SignUpScreen
            onSignUp={async (email, password) => {
              try {
                await signUp(email, password);
                // After successful signup, navigate to verification screen
                setPendingEmail(email);
                setPendingPassword(password);
                setAuthScreen('verification');
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
    Screen = <MyTeamScreen onProfilePress={() => setShowProfileModal(true)} />;
  } else if (route === 'leaderboard') {
    Screen = <LeaderboardScreen onProfilePress={() => setShowProfileModal(true)} />;
  } else {
    Screen = <LeaguesScreen onProfilePress={() => setShowProfileModal(true)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{Screen}</View>
      <MobileBottomNav currentRoute={route} onNavigate={setRoute} />
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ProfileScreen onClose={() => setShowProfileModal(false)} />
        </SafeAreaView>
      </Modal>
      <UsernamePromptModal
        visible={showUsernameModal}
        onSave={handleSaveUsername}
        isLoading={isSavingUsername}
      />
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default App;

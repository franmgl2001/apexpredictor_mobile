/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, StyleSheet, useColorScheme, View, ActivityIndicator, Modal, Image, Text } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { fetchUserAttributes } from 'aws-amplify/auth';
import amplifyconfig from './amplify_config.json';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { DataProvider, useData } from './src/contexts/DataContext';
import { saveUserProfile } from './src/services/graphql/users';

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
  const { profile, profileLoading, refetchProfile } = useData();
  const [route, setRoute] = useState<RouteKey>('myteam');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('signin');
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [pendingPassword, setPendingPassword] = useState<string>('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);

  // Track when initial auth check is complete
  useEffect(() => {
    if (!isLoading) {
      setInitialAuthCheckComplete(true);
    }
  }, [isLoading]);

  // Check if profile exists after loading completes
  // Only show username modal if profile is null AFTER profile has finished loading
  // If profile exists, user goes directly to my team screen
  useEffect(() => {
    // Wait for profile to finish loading before making decision
    if (isAuthenticated && !profileLoading) {
      // Profile loading is complete - check if profile exists
      if (profile === null) {
        // No profile found - show username prompt modal
        setShowUsernameModal(true);
      } else {
        // Profile exists - hide modal and show my team screen
        setShowUsernameModal(false);
      }
    } else {
      // Hide modal while profile is still loading or not authenticated
      setShowUsernameModal(false);
    }
  }, [isAuthenticated, profileLoading, profile]);

  const handleSaveUsername = async (username: string, country: string) => {
    if (!user?.userId) {
      throw new Error('User not authenticated');
    }

    setIsSavingUsername(true);
    try {
      // Prepare profile data
      const profileData = {
        username,
        country,
      };

      // Log profile before sending
      console.log('Profile data to be saved:', profileData);

      // Create profile
      await saveUserProfile(user.userId, username, country);

      await refetchProfile();
      setShowUsernameModal(false);
    } catch (error: any) {
      console.error('Error saving username:', error);
      throw error;
    } finally {
      setIsSavingUsername(false);
    }
  };

  // Show loading spinner only during initial auth check (not during sign-in attempts)
  if (!initialAuthCheckComplete && isLoading && !isAuthenticated) {
    return (
      <SafeAreaView style={styles.loadingScreenContainer} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require('./src/assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <ActivityIndicator size="large" color="#dc2626" style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Apex Predictor</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show authentication screens if not authenticated
  if (!isAuthenticated) {
    if (authScreen === 'verification') {
      return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
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
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <SignInScreen
          onSignIn={async (email, password) => {
            setIsSigningIn(true);
            try {
              await signIn(email, password);
            } catch (error: any) {
              console.error('Sign in error:', error);
              // Error handling is done in the screen component
              // Re-throw so SignInScreen can show the alert
              throw error;
            } finally {
              setIsSigningIn(false);
            }
          }}
          onNavigateToSignUp={() => setAuthScreen('signup')}
          isLoading={isSigningIn}
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {Screen}
      </View>
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
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  loadingScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 180,
    height: 180,
  },
  loadingSpinner: {
    marginTop: 24,
    marginBottom: 16,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default App;

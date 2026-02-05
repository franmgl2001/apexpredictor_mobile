/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, StyleSheet, useColorScheme, View, ActivityIndicator, Modal, Image, Text, Alert } from 'react-native';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
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

type AuthScreen = 'signin' | 'signup' | 'verification' | 'forgot' | 'reset';

function AppContent() {
  const {
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    confirmSignUp,
    resendSignUpCode,
    resetPassword,
    confirmResetPassword,
    user,
  } = useAuth();
  const { profile, profileLoading, profileError, refetchProfile } = useData();
  const [route, setRoute] = useState<RouteKey>('myteam');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('signin');
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [pendingPassword, setPendingPassword] = useState<string>('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);
  const [isRestoringState, setIsRestoringState] = useState(true);

  // Keys for AsyncStorage
  const AUTH_SCREEN_KEY = '@auth_screen';
  const PENDING_EMAIL_KEY = '@pending_email';
  const PENDING_PASSWORD_KEY = '@pending_password';

  // Restore auth screen state on app startup (after auth check completes)
  useEffect(() => {
    // Wait for initial auth check to complete before restoring
    if (!initialAuthCheckComplete) return;

    const restoreAuthState = async () => {
      try {
        const savedAuthScreen = await AsyncStorage.getItem(AUTH_SCREEN_KEY);
        const savedEmail = await AsyncStorage.getItem(PENDING_EMAIL_KEY);
        const savedPassword = await AsyncStorage.getItem(PENDING_PASSWORD_KEY);

        // Only restore if user is not authenticated and we have saved state
        if (!isAuthenticated && savedAuthScreen && savedEmail) {
          // Only restore verification or reset screens
          if (savedAuthScreen === 'verification' || savedAuthScreen === 'reset') {
            setAuthScreen(savedAuthScreen as AuthScreen);
            setPendingEmail(savedEmail);
            if (savedPassword && savedAuthScreen === 'verification') {
              setPendingPassword(savedPassword);
            }
          }
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
      } finally {
        setIsRestoringState(false);
      }
    };

    restoreAuthState();
  }, [initialAuthCheckComplete, isAuthenticated]);

  // Save auth screen state when it changes (only for verification/reset)
  useEffect(() => {
    const saveAuthState = async () => {
      if (isRestoringState) return; // Don't save during initial restore

      try {
        if (authScreen === 'verification' || authScreen === 'reset') {
          await AsyncStorage.setItem(AUTH_SCREEN_KEY, authScreen);
          if (pendingEmail) {
            await AsyncStorage.setItem(PENDING_EMAIL_KEY, pendingEmail);
          }
          if (pendingPassword && authScreen === 'verification') {
            await AsyncStorage.setItem(PENDING_PASSWORD_KEY, pendingPassword);
          }
        } else {
          // Clear saved state when navigating away from verification/reset
          await AsyncStorage.multiRemove([AUTH_SCREEN_KEY, PENDING_EMAIL_KEY, PENDING_PASSWORD_KEY]);
        }
      } catch (error) {
        console.error('Error saving auth state:', error);
      }
    };

    saveAuthState();
  }, [authScreen, pendingEmail, pendingPassword, isRestoringState]);

  // Clear saved state when user becomes authenticated
  useEffect(() => {
    const clearAuthState = async () => {
      if (isAuthenticated) {
        try {
          await AsyncStorage.multiRemove([AUTH_SCREEN_KEY, PENDING_EMAIL_KEY, PENDING_PASSWORD_KEY]);
        } catch (error) {
          console.error('Error clearing auth state:', error);
        }
      }
    };

    clearAuthState();
  }, [isAuthenticated]);

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
    // We only show the modal if:
    // 1. User is authenticated
    // 2. Profile has been attempted (profile is not undefined)
    // 3. Profile is not currently loading
    // 4. There was no error fetching the profile
    // 5. Profile is null (confirmed not found)
    if (isAuthenticated && !profileLoading && !profileError) {
      if (profile === null) {
        // No profile found - show username prompt modal
        setShowUsernameModal(true);
      } else if (profile !== undefined) {
        // Profile exists - hide modal
        setShowUsernameModal(false);
      }
      // If profile is undefined, it hasn't been fetched yet, so we keep modal hidden
    } else {
      // Hide modal while profile is still loading, has error, or not authenticated
      setShowUsernameModal(false);
    }
  }, [isAuthenticated, profileLoading, profile, profileError]);

  // Show error alert if profile fails to load (only once when it happens)
  useEffect(() => {
    if (isAuthenticated && profileError && !profileLoading) {
      Alert.alert(
        'Profile Error',
        'We couldn\'t load your profile. Some features might be limited.',
        [{ text: 'Retry', onPress: () => refetchProfile() }, { text: 'OK' }]
      );
    }
  }, [profileError, profileLoading, isAuthenticated]);

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
      await saveUserProfile(username, country);

      await refetchProfile();
      setShowUsernameModal(false);
    } catch (error: any) {
      console.error('Error saving username:', error);
      throw error;
    } finally {
      setIsSavingUsername(false);
    }
  };

  // Show loading spinner during initial auth check or state restoration
  if ((!initialAuthCheckComplete && isLoading && !isAuthenticated) || isRestoringState) {
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
    if (authScreen === 'forgot') {
      return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
          <ForgotPasswordScreen
            onSubmitEmail={async (email) => {
              // State will be saved automatically via useEffect
              setPendingEmail(email);
              try {
                await resetPassword(email);
                // After successfully starting reset, go to reset screen
                setAuthScreen('reset');
              } catch (error: any) {
                // Let the screen handle showing the error
                throw error;
              }
            }}
            onNavigateBackToSignIn={() => setAuthScreen('signin')}
            isLoading={isLoading}
          />
        </SafeAreaView>
      );
    }

    if (authScreen === 'reset') {
      return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
          <ResetPasswordScreen
            email={pendingEmail}
            onSubmitNewPassword={async (code, newPassword) => {
              try {
                await confirmResetPassword(pendingEmail, code, newPassword);
                // After successful password reset, clear saved state
                try {
                  await AsyncStorage.multiRemove([AUTH_SCREEN_KEY, PENDING_EMAIL_KEY, PENDING_PASSWORD_KEY]);
                } catch (error) {
                  console.error('Error clearing auth state:', error);
                }
              } catch (error: any) {
                // Let the screen handle showing the error
                throw error;
              }
            }}
            onNavigateBackToSignIn={() => setAuthScreen('signin')}
            isLoading={isLoading}
          />
        </SafeAreaView>
      );
    }

    if (authScreen === 'verification') {
      return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
          <VerificationCodeScreen
            email={pendingEmail}
            password={pendingPassword}
            onVerify={async (email, code, password) => {
              try {
                await confirmSignUp(email, code, password);
                // After successful verification, clear saved state
                try {
                  await AsyncStorage.multiRemove([AUTH_SCREEN_KEY, PENDING_EMAIL_KEY, PENDING_PASSWORD_KEY]);
                } catch (error) {
                  console.error('Error clearing auth state:', error);
                }
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
            onNavigateToSignIn={async () => {
              // Clear saved state when navigating back to sign in
              try {
                await AsyncStorage.multiRemove([AUTH_SCREEN_KEY, PENDING_EMAIL_KEY, PENDING_PASSWORD_KEY]);
              } catch (error) {
                console.error('Error clearing auth state:', error);
              }
              setAuthScreen('signin');
            }}
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
                // State will be saved automatically via useEffect
                setPendingEmail(email);
                setPendingPassword(password);
                setAuthScreen('verification');
              } catch (error: any) {
                // If account already exists, resend code and go to verification
                // Check original error name (preserved from AuthContext) or message
                const isExistingAccount =
                  error.originalName === 'UsernameExistsException' ||
                  error.name === 'UsernameExistsException' ||
                  (error.message && (
                    error.message.includes('already exists') ||
                    error.message.includes('An account with this email already exists')
                  ));

                if (isExistingAccount) {
                  try {
                    // Resend the verification code
                    await resendSignUpCode(email);
                    // Navigate to verification screen
                    setPendingEmail(email);
                    setPendingPassword(password);
                    setAuthScreen('verification');
                    // Show success message
                    Alert.alert(
                      'Verification Code Sent',
                      'An account with this email already exists. We\'ve sent a new verification code to your email.',
                      [{ text: 'OK' }]
                    );
                    return; // Don't throw error, we handled it
                  } catch (resendError: any) {
                    // If resend fails, throw the original error
                    throw error;
                  }
                }
                // For other errors, let the screen component handle it
                throw error;
              }
            }}
            onNavigateToSignIn={async () => {
              // Clear saved state when navigating back to sign in
              try {
                await AsyncStorage.multiRemove([AUTH_SCREEN_KEY, PENDING_EMAIL_KEY, PENDING_PASSWORD_KEY]);
              } catch (error) {
                console.error('Error clearing auth state:', error);
              }
              setAuthScreen('signin');
            }}
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
          onForgotPassword={() => setAuthScreen('forgot')}
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
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
    color: '#000000',
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

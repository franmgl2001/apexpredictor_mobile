import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signIn as amplifySignIn, signUp as amplifySignUp, signOut as amplifySignOut, getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: any | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any | null>(null);

    // Check authentication state on mount
    useEffect(() => {
        checkAuthState();

        // Listen for auth events (sign in, sign out, etc.)
        const hubListenerCancelToken = Hub.listen('auth', (data) => {
            switch (data.payload.event) {
                case 'signedIn':
                    checkAuthState();
                    break;
                case 'signedOut':
                    setIsAuthenticated(false);
                    setUser(null);
                    break;
                case 'tokenRefresh':
                    checkAuthState();
                    break;
                default:
                    break;
            }
        });

        return () => {
            hubListenerCancelToken();
        };
    }, []);

    const checkAuthState = async () => {
        try {
            setIsLoading(true);
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            setIsAuthenticated(true);
        } catch (error) {
            // User is not authenticated
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            await amplifySignIn({
                username: email,
                password: password,
            });

            // If signIn succeeds, get the current user
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            setIsAuthenticated(true);
        } catch (error: any) {
            console.error('Sign in error:', error);
            // Transform Amplify errors to user-friendly messages
            let errorMessage = 'Invalid email or password. Please try again.';
            if (error.name === 'NotAuthorizedException') {
                errorMessage = 'Incorrect email or password.';
            } else if (error.name === 'UserNotConfirmedException') {
                errorMessage = 'Please verify your email address before signing in.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { userId, nextStep } = await amplifySignUp({
                username: email,
                password: password,
                options: {
                    userAttributes: {
                        email: email,
                    },
                },
            });

            // After signup, user needs to verify email, so don't auto-authenticate
            console.log('Sign up successful, userId:', userId);
            console.log('Next step:', nextStep.signUpStep);
        } catch (error: any) {
            console.error('Sign up error:', error);
            // Transform Amplify errors to user-friendly messages
            let errorMessage = 'Failed to create account. Please try again.';
            if (error.name === 'UsernameExistsException') {
                errorMessage = 'An account with this email already exists.';
            } else if (error.name === 'InvalidPasswordException') {
                errorMessage = 'Password does not meet requirements.';
            } else if (error.name === 'InvalidParameterException') {
                errorMessage = 'Invalid email address.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        setIsLoading(true);
        try {
            await amplifySignOut();
            setUser(null);
            setIsAuthenticated(false);
        } catch (error: any) {
            console.error('Sign out error:', error);
            // Even if sign out fails, clear local state
            setUser(null);
            setIsAuthenticated(false);
            throw new Error(error.message || 'Failed to sign out. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                user,
                signIn,
                signUp,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}


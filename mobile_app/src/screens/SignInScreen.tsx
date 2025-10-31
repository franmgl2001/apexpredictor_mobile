import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';

interface SignInScreenProps {
    onSignIn: (email: string, password: string) => Promise<void>;
    onNavigateToSignUp: () => void;
    onForgotPassword?: () => void;
    isLoading?: boolean;
}

export default function SignInScreen({
    onSignIn,
    onNavigateToSignUp,
    onForgotPassword,
    isLoading = false,
}: SignInScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }
        if (!password.trim()) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        try {
            await onSignIn(email.trim(), password);
        } catch (error: any) {
            Alert.alert(
                'Sign In Failed',
                error.message || 'Invalid email or password. Please try again.'
            );
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Sign In</Text>

                    {/* Welcome Message */}
                    <Text style={styles.welcomeMessage}>Welcome back to Apex Predictions</Text>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Email Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#9ca3af"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                        </View>

                        {/* Password Field */}
                        <View style={styles.inputContainer}>
                            <View style={styles.passwordHeader}>
                                <Text style={styles.label}>Password</Text>
                                {onForgotPassword && (
                                    <TouchableOpacity onPress={onForgotPassword} disabled={isLoading}>
                                        <Text style={styles.forgotPassword}>Forgot password?</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor="#9ca3af"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                        </View>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            style={[styles.signInButton, isLoading && styles.buttonDisabled]}
                            onPress={handleSignIn}
                            disabled={isLoading}
                        >
                            <Text style={styles.signInButtonText}>
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>

                        {/* Sign Up Link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={onNavigateToSignUp} disabled={isLoading}>
                                <Text style={styles.footerLink}>Sign up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        maxWidth: 400,
        alignSelf: 'center',
        width: '100%',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 120,
        height: 80,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    welcomeMessage: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 32,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    forgotPassword: {
        fontSize: 14,
        fontWeight: '600',
        color: '#dc2626',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#f9fafb',
        color: '#111827',
    },
    signInButton: {
        backgroundColor: '#dc2626',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    signInButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 14,
        color: '#6b7280',
    },
    footerLink: {
        fontSize: 14,
        color: '#dc2626',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});


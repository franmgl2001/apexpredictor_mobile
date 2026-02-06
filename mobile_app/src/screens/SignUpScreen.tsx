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

interface SignUpScreenProps {
    onSignUp: (email: string, password: string) => Promise<void>;
    onNavigateToSignIn: () => void;
    isLoading?: boolean;
}

export default function SignUpScreen({
    onSignUp,
    onNavigateToSignIn,
    isLoading = false,
}: SignUpScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailConsent, setEmailConsent] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

    // Password validation function
    const validatePassword = (pwd: string): string[] => {
        const errors: string[] = [];
        if (pwd.length < 8) {
            errors.push('At least 8 characters');
        }
        if (!/[A-Z]/.test(pwd)) {
            errors.push('At least one uppercase letter');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
            errors.push('At least one special character');
        }
        return errors;
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        if (text.length > 0) {
            setPasswordErrors(validatePassword(text));
        } else {
            setPasswordErrors([]);
        }
    };

    const handleSignUp = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        if (!password.trim()) {
            Alert.alert('Error', 'Please enter a password');
            return;
        }

        const validationErrors = validatePassword(password);
        if (validationErrors.length > 0) {
            Alert.alert('Error', `Password requirements:\n• ${validationErrors.join('\n• ')}`);
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            await onSignUp(email.trim(), password);
            Alert.alert(
                'Success',
                'Account created successfully! Please check your email for verification instructions.',
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            Alert.alert(
                'Sign Up Failed',
                error.message || 'Failed to create account. Please try again.'
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
                            source={require('../assets/apex_predictions.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Create Account</Text>

                    {/* Subtitle */}
                    <Text style={styles.subtitle}>
                        Join the ultimate motorsport prediction platform
                    </Text>

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
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    password.length > 0 && passwordErrors.length > 0 && styles.inputError
                                ]}
                                placeholder="Create a password"
                                placeholderTextColor="#9ca3af"
                                value={password}
                                onChangeText={handlePasswordChange}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                textContentType="none"
                                autoComplete="off"
                                passwordRules=""
                                editable={!isLoading}
                            />
                            {password.length > 0 && passwordErrors.length > 0 && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>Password must contain:</Text>
                                    {passwordErrors.map((error, index) => (
                                        <Text key={index} style={styles.errorItem}>
                                            • {error}
                                        </Text>
                                    ))}
                                </View>
                            )}
                            {password.length > 0 && passwordErrors.length === 0 && (
                                <Text style={styles.successText}>✓ Password meets all requirements</Text>
                            )}
                        </View>

                        {/* Confirm Password Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm your password"
                                placeholderTextColor="#9ca3af"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                textContentType="none"
                                autoComplete="off"
                                passwordRules=""
                                editable={!isLoading}
                            />
                        </View>

                        {/* Terms and Conditions with Email Consent */}
                        <View style={styles.termsContainer}>
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setEmailConsent(!emailConsent)}
                                disabled={isLoading}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, emailConsent && styles.checkboxChecked]}>
                                    {emailConsent && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={styles.termsText}>
                                    I agree to receive emails about updates and promotions
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Create Account Button */}
                        <TouchableOpacity
                            style={[styles.createAccountButton, isLoading && styles.buttonDisabled]}
                            onPress={handleSignUp}
                            disabled={isLoading}
                        >
                            <Text style={styles.createAccountButtonText}>
                                {isLoading ? 'Creating account...' : 'Create Account'}
                            </Text>
                        </TouchableOpacity>

                        {/* Sign In Link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={onNavigateToSignIn} disabled={isLoading}>
                                <Text style={styles.footerLink}>Sign in</Text>
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
    subtitle: {
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
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
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
    createAccountButton: {
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
    createAccountButtonText: {
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
    termsContainer: {
        marginTop: 8,
        marginBottom: 8,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#dc2626',
        borderRadius: 4,
        marginRight: 12,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    checkboxChecked: {
        backgroundColor: '#dc2626',
    },
    checkmark: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    termsText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
        lineHeight: 20,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    errorContainer: {
        marginTop: 8,
        padding: 12,
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#ef4444',
    },
    errorText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#dc2626',
        marginBottom: 4,
    },
    errorItem: {
        fontSize: 12,
        color: '#991b1b',
        marginLeft: 8,
        marginTop: 2,
    },
    successText: {
        fontSize: 12,
        color: '#16a34a',
        marginTop: 8,
        fontWeight: '500',
    },
});

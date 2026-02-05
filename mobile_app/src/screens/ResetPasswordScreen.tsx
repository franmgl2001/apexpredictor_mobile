import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';

interface ResetPasswordScreenProps {
    email: string;
    onSubmitNewPassword: (code: string, newPassword: string) => Promise<void>;
    onNavigateBackToSignIn: () => void;
    isLoading?: boolean;
}

export default function ResetPasswordScreen({
    email,
    onSubmitNewPassword,
    onNavigateBackToSignIn,
    isLoading = false,
}: ResetPasswordScreenProps) {
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

    const handleSubmit = async () => {
        if (!code.trim()) {
            Alert.alert('Error', 'Please enter the verification code');
            return;
        }

        if (!password.trim()) {
            Alert.alert('Error', 'Please enter a new password');
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
            await onSubmitNewPassword(code.trim(), password);
            Alert.alert(
                'Password reset',
                'Your password has been updated. You can now sign in with your new password.',
                [{ text: 'OK', onPress: onNavigateBackToSignIn }],
            );
        } catch (error: any) {
            Alert.alert(
                'Failed to reset password',
                error.message || 'Could not reset password. Please try again.',
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
                    <Text style={styles.title}>Enter New Password</Text>
                    <Text style={styles.subtitle}>
                        We sent a verification code to {email}. Enter the code and choose a new password.
                    </Text>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Verification Code</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter the code"
                                placeholderTextColor="#9ca3af"
                                value={code}
                                onChangeText={setCode}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>New Password</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    password.length > 0 && passwordErrors.length > 0 && styles.inputError
                                ]}
                                placeholder="Enter new password"
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

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm New Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm new password"
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

                        <TouchableOpacity
                            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            <Text style={styles.primaryButtonText}>
                                {isLoading ? 'Updating password...' : 'Reset Password'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={onNavigateBackToSignIn}
                            disabled={isLoading}
                        >
                            <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
                        </TouchableOpacity>
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
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 24,
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
    primaryButton: {
        backgroundColor: '#dc2626',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 14,
        color: '#dc2626',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    buttonDisabled: {
        opacity: 0.6,
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



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

    const handleSubmit = async () => {
        if (!code.trim()) {
            Alert.alert('Error', 'Please enter the verification code');
            return;
        }

        if (!password.trim()) {
            Alert.alert('Error', 'Please enter a new password');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters long');
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
                                style={styles.input}
                                placeholder="Enter new password"
                                placeholderTextColor="#9ca3af"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
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
});



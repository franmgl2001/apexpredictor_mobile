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

interface ForgotPasswordScreenProps {
    onSubmitEmail: (email: string) => Promise<void>;
    onNavigateBackToSignIn: () => void;
    isLoading?: boolean;
}

export default function ForgotPasswordScreen({
    onSubmitEmail,
    onNavigateBackToSignIn,
    isLoading = false,
}: ForgotPasswordScreenProps) {
    const [email, setEmail] = useState('');

    const handleSubmit = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        try {
            await onSubmitEmail(email.trim());
            Alert.alert(
                'Check your email',
                'We have sent a verification code to your email address.',
                [{ text: 'OK' }],
            );
        } catch (error: any) {
            Alert.alert(
                'Failed to send code',
                error.message || 'Could not start password reset. Please try again.',
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
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                        Enter the email associated with your account and we'll send you a code to reset
                        your password.
                    </Text>

                    <View style={styles.form}>
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

                        <TouchableOpacity
                            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            <Text style={styles.primaryButtonText}>
                                {isLoading ? 'Sending code...' : 'Send reset code'}
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



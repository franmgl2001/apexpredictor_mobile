import React, { useState, useRef } from 'react';
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

interface VerificationCodeScreenProps {
    email: string;
    password: string;
    onVerify: (email: string, code: string, password: string) => Promise<void>;
    onResendCode?: () => Promise<void>;
    onNavigateToSignIn: () => void;
    isLoading?: boolean;
}

export default function VerificationCodeScreen({
    email,
    password,
    onVerify,
    onResendCode,
    onNavigateToSignIn,
    isLoading = false,
}: VerificationCodeScreenProps) {
    const [code, setCode] = useState('');
    const codeInputRef = useRef<TextInput>(null);

    const handleVerify = async () => {
        if (!code.trim()) {
            Alert.alert('Error', 'Please enter the verification code');
            return;
        }

        if (code.length < 6) {
            Alert.alert('Error', 'Please enter the complete 6-digit code');
            return;
        }

        try {
            await onVerify(email, code.trim(), password);
        } catch (error: any) {
            Alert.alert(
                'Verification Failed',
                error.message || 'Invalid verification code. Please try again.'
            );
        }
    };

    const handleResendCode = async () => {
        if (onResendCode) {
            try {
                await onResendCode();
                Alert.alert('Success', 'Verification code has been resent to your email');
                setCode('');
            } catch (error: any) {
                Alert.alert(
                    'Error',
                    error.message || 'Failed to resend code. Please try again.'
                );
            }
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
                    <Text style={styles.title}>Verify Your Email</Text>

                    {/* Subtitle */}
                    <Text style={styles.subtitle}>
                        We've sent a 6-digit verification code to
                    </Text>
                    <Text style={styles.emailText}>{email}</Text>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Code Input Field */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Verification Code</Text>
                            <TextInput
                                ref={codeInputRef}
                                style={styles.input}
                                placeholder="Enter 6-digit code"
                                placeholderTextColor="#9ca3af"
                                value={code}
                                onChangeText={(text) => {
                                    // Only allow digits and limit to 6 characters
                                    const numericValue = text.replace(/[^0-9]/g, '').slice(0, 6);
                                    setCode(numericValue);
                                }}
                                keyboardType="number-pad"
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={6}
                                editable={!isLoading}
                                selectTextOnFocus
                            />
                        </View>

                        {/* Verify Button */}
                        <TouchableOpacity
                            style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
                            onPress={handleVerify}
                            disabled={isLoading}
                        >
                            <Text style={styles.verifyButtonText}>
                                {isLoading ? 'Verifying...' : 'Verify Email'}
                            </Text>
                        </TouchableOpacity>

                        {/* Resend Code */}
                        {onResendCode && (
                            <TouchableOpacity
                                onPress={handleResendCode}
                                disabled={isLoading}
                                style={styles.resendButton}
                            >
                                <Text style={styles.resendButtonText}>
                                    Didn't receive the code? Resend
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Sign In Link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already verified? </Text>
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
        marginBottom: 4,
        textAlign: 'center',
    },
    emailText: {
        fontSize: 16,
        color: '#dc2626',
        marginBottom: 32,
        textAlign: 'center',
        fontWeight: '600',
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
        fontSize: 24,
        fontWeight: '700',
        backgroundColor: '#f9fafb',
        color: '#111827',
        textAlign: 'center',
        letterSpacing: 8,
    },
    verifyButton: {
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
    verifyButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    resendButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    resendButtonText: {
        fontSize: 14,
        color: '#dc2626',
        fontWeight: '600',
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


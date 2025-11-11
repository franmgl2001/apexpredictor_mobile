import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Alert,
    ActivityIndicator,
} from 'react-native';

interface UsernamePromptModalProps {
    visible: boolean;
    onSave: (username: string) => Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
}

export default function UsernamePromptModal({
    visible,
    onSave,
    onCancel,
    isLoading = false,
}: UsernamePromptModalProps) {
    const [username, setUsername] = useState('');

    const handleSave = async () => {
        const trimmedUsername = username.trim();
        
        if (!trimmedUsername) {
            Alert.alert('Error', 'Please enter a username');
            return;
        }

        if (trimmedUsername.length < 3) {
            Alert.alert('Error', 'Username must be at least 3 characters long');
            return;
        }

        if (trimmedUsername.length > 20) {
            Alert.alert('Error', 'Username must be less than 20 characters');
            return;
        }

        try {
            await onSave(trimmedUsername);
            setUsername(''); // Clear input after successful save
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save username. Please try again.');
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        setUsername('');
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={undefined}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>Choose a Username</Text>
                    <Text style={styles.subtitle}>
                        Please enter a username to continue
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter username"
                            placeholderTextColor="#9ca3af"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                            maxLength={20}
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton, isLoading && styles.buttonDisabled]}
                            onPress={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
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
    inputContainer: {
        marginBottom: 24,
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
    buttonContainer: {
        width: '100%',
    },
    button: {
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButton: {
        backgroundColor: '#dc2626',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});


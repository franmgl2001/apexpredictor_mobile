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

interface JoinLeagueModalProps {
    visible: boolean;
    onClose: () => void;
    onJoin: (joinCode: string) => Promise<void>;
    isLoading?: boolean;
}

export default function JoinLeagueModal({
    visible,
    onClose,
    onJoin,
    isLoading = false,
}: JoinLeagueModalProps) {
    const [joinCode, setJoinCode] = useState('');

    const handleJoin = async () => {
        const trimmedCode = joinCode.trim().toUpperCase();

        if (!trimmedCode) {
            Alert.alert('Error', 'Please enter a join code');
            return;
        }

        if (trimmedCode.length !== 6) {
            Alert.alert('Error', 'Join code must be 6 characters');
            return;
        }

        try {
            await onJoin(trimmedCode);
            // Reset form on success
            setJoinCode('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to join league. Please check the code and try again.');
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setJoinCode('');
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>Join League</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-character join code to join a league
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter join code"
                            placeholderTextColor="#9ca3af"
                            value={joinCode}
                            onChangeText={(text) => setJoinCode(text.toUpperCase())}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            editable={!isLoading}
                            maxLength={6}
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleClose}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.joinButton, isLoading && styles.buttonDisabled]}
                            onPress={handleJoin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text style={styles.joinButtonText}>Join</Text>
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
        fontSize: 24,
        fontWeight: '700',
        backgroundColor: '#f9fafb',
        color: '#111827',
        textAlign: 'center',
        letterSpacing: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cancelButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    },
    joinButton: {
        backgroundColor: '#dc2626',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    joinButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});





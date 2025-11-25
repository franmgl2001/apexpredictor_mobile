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
    ScrollView,
} from 'react-native';

interface CreateLeagueModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (leagueName: string, description: string, maxMembers: number) => Promise<void>;
    isLoading?: boolean;
}

export default function CreateLeagueModal({
    visible,
    onClose,
    onCreate,
    isLoading = false,
}: CreateLeagueModalProps) {
    const [leagueName, setLeagueName] = useState('');
    const [description, setDescription] = useState('');
    const [maxMembers, setMaxMembers] = useState('50');

    const handleCreate = async () => {
        const trimmedName = leagueName.trim();
        const trimmedDescription = description.trim();
        const maxMembersNum = parseInt(maxMembers, 10);

        if (!trimmedName) {
            Alert.alert('Error', 'Please enter a league name');
            return;
        }

        if (trimmedName.length < 3) {
            Alert.alert('Error', 'League name must be at least 3 characters long');
            return;
        }

        if (trimmedName.length > 50) {
            Alert.alert('Error', 'League name must be less than 50 characters');
            return;
        }

        if (isNaN(maxMembersNum) || maxMembersNum < 2 || maxMembersNum > 100) {
            Alert.alert('Error', 'Max members must be between 2 and 100');
            return;
        }

        try {
            await onCreate(trimmedName, trimmedDescription, maxMembersNum);
            // Reset form on success
            setLeagueName('');
            setDescription('');
            setMaxMembers('50');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create league. Please try again.');
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setLeagueName('');
            setDescription('');
            setMaxMembers('50');
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
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.title}>Create League</Text>
                        <Text style={styles.subtitle}>
                            Create a private league and invite friends to compete
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>League Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter league name"
                                placeholderTextColor="#9ca3af"
                                value={leagueName}
                                onChangeText={setLeagueName}
                                autoCapitalize="words"
                                editable={!isLoading}
                                maxLength={50}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Description (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Enter description"
                                placeholderTextColor="#9ca3af"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                editable={!isLoading}
                                maxLength={200}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Max Members</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="50"
                                placeholderTextColor="#9ca3af"
                                value={maxMembers}
                                onChangeText={setMaxMembers}
                                keyboardType="numeric"
                                editable={!isLoading}
                            />
                            <Text style={styles.hint}>Between 2 and 100 members</Text>
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
                                style={[styles.button, styles.createButton, isLoading && styles.buttonDisabled]}
                                onPress={handleCreate}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.createButtonText}>Create</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
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
        maxHeight: '90%',
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
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    hint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
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
    createButton: {
        backgroundColor: '#dc2626',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    createButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});





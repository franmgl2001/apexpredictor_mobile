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
import CountryPicker from 'react-native-country-picker-modal';

interface UsernamePromptModalProps {
    visible: boolean;
    onSave: (username: string, country: string) => Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
}

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

export default function UsernamePromptModal({
    visible,
    onSave,
    onCancel,
    isLoading = false,
}: UsernamePromptModalProps) {
    const [username, setUsername] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<{ name: string; cca2: string } | null>(null);
    const [showCountryPicker, setShowCountryPicker] = useState(false);

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

        if (!selectedCountry) {
            Alert.alert('Error', 'Please select your country');
            return;
        }

        try {
            await onSave(trimmedUsername, selectedCountry.cca2);
            setUsername(''); // Clear input after successful save
            setSelectedCountry(null); // Clear country selection
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save username. Please try again.');
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        setUsername('');
        setSelectedCountry(null);
        setShowCountryPicker(false);
    };

    const handleCountrySelect = (country: any) => {
        const countryName = country.name?.common || country.name || 'Unknown';
        setSelectedCountry({
            name: countryName,
            cca2: country.cca2,
        });
        setShowCountryPicker(false);
    };

    const canDismiss = typeof onCancel === 'function';

    // Don't render modal at all when not visible to prevent touch blocking on physical devices
    if (!visible) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay} pointerEvents="box-none">
                {canDismiss ? (
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={handleCancel}
                    />
                ) : (
                    <View style={StyleSheet.absoluteFill} pointerEvents="none" />
                )}
                <View style={styles.modalContainer} pointerEvents="auto">
                    <Text style={styles.title}>Create Your Profile</Text>
                    <Text style={styles.subtitle}>
                        Please enter a username and select your country
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Username</Text>
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

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Country</Text>
                        <TouchableOpacity
                            style={styles.countryPicker}
                            onPress={() => setShowCountryPicker(true)}
                            disabled={isLoading}
                        >
                            <View style={styles.countryPickerContent}>
                                {selectedCountry ? (
                                    <>
                                        <Text style={styles.flagEmoji}>
                                            {getFlagEmoji(selectedCountry.cca2)}
                                        </Text>
                                        <Text
                                            style={styles.countryPickerText}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >
                                            {selectedCountry.name || 'Unknown'}
                                        </Text>
                                    </>
                                ) : (
                                    <Text style={styles.countryPickerPlaceholder}>
                                        Select your country
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.countryPickerArrow}>▼</Text>
                        </TouchableOpacity>
                    </View>

                    {showCountryPicker && (
                        <CountryPicker
                            visible={showCountryPicker}
                            countryCode={selectedCountry?.cca2 as any || 'US'}
                            withFilter
                            withFlag
                            withAlphaFilter
                            withCallingCode={false}
                            withEmoji
                            onSelect={handleCountrySelect}
                            onClose={() => setShowCountryPicker(false)}
                        />
                    )}

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
        shadowColor: '#000000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
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
    countryPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f9fafb',
    },
    countryPickerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
    },
    flagEmoji: {
        fontSize: 24,
        marginRight: 12,
        lineHeight: 24,
    },
    countryPickerText: {
        fontSize: 16,
        color: '#111827',
        flexShrink: 1,
        marginRight: 8,
    },
    countryPickerPlaceholder: {
        fontSize: 16,
        color: '#9ca3af',
        flex: 1,
    },
    countryPickerArrow: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 8,
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


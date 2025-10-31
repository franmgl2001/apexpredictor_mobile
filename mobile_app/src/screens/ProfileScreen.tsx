import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
    const { signOut, user, isLoading } = useAuth();

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to sign out. Please try again.');
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            {user && (
                <View style={styles.userInfo}>
                    {user.username && (
                        <Text style={styles.userEmail}>{user.username}</Text>
                    )}
                    {user.userId && (
                        <Text style={styles.userId}>ID: {user.userId}</Text>
                    )}
                </View>
            )}

            <View style={styles.signOutContainer}>
                <TouchableOpacity
                    style={[styles.signOutButton, isLoading && styles.signOutButtonDisabled]}
                    onPress={handleSignOut}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingBottom: 76,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 24,
    },
    userInfo: {
        marginBottom: 32,
        paddingBottom: 24,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e5e7eb',
    },
    userEmail: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    userId: {
        fontSize: 14,
        color: '#6b7280',
    },
    signOutContainer: {
        marginTop: 'auto',
        paddingTop: 24,
    },
    signOutButton: {
        backgroundColor: '#dc2626',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    signOutButtonDisabled: {
        opacity: 0.6,
    },
    signOutText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
});


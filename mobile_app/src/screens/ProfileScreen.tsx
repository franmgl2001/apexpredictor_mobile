import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

type ProfileScreenProps = {
    onClose?: () => void;
};

/**
 * Formats a duration in a human-readable format
 * @param createdAt ISO date string
 * @returns Human-readable duration string (e.g., "2 months", "1 year", "3 days")
 */
function formatMemberDuration(createdAt: string | undefined): string {
    if (!createdAt) {
        return 'Recently joined';
    }

    const now = new Date();
    const created = new Date(createdAt);
    const diffInMs = now.getTime() - created.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays < 1) {
        return 'Joined today';
    } else if (diffInDays === 1) {
        return 'Joined 1 day ago';
    } else if (diffInDays < 30) {
        return `Joined ${diffInDays} days ago`;
    } else if (diffInDays < 60) {
        return 'Joined 1 month ago';
    } else if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return `Joined ${months} month${months > 1 ? 's' : ''} ago`;
    } else {
        const years = Math.floor(diffInDays / 365);
        const remainingMonths = Math.floor((diffInDays % 365) / 30);
        if (remainingMonths > 0) {
            return `Joined ${years} year${years > 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''} ago`;
        }
        return `Joined ${years} year${years > 1 ? 's' : ''} ago`;
    }
}

/**
 * Gets initials from a username or email
 */
function getInitials(username?: string, email?: string): string {
    const name = username || email || 'U';
    const parts = name.split(/[\s@.]/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

/**
 * Formats date for display
 */
function formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

export default function ProfileScreen({ onClose }: ProfileScreenProps = {}) {
    const { signOut, isLoading: authLoading } = useAuth();
    const { profile, isLoading: profileLoading, profileError, refetchProfile } = useData();

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

    const handleEmailPress = () => {
        Linking.openURL('mailto:apexprediction@gmail.com');
    };

    const handlePhonePress = () => {
        Linking.openURL('tel:+525576583376');
    };

    return (
        <View style={styles.container}>
            {onClose && (
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}
            {profileLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#dc2626" />
                </View>
            )}

            {profileError && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{profileError}</Text>
                </View>
            )}

            {profile && !profileLoading && (
                <>
                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.avatarSection}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {getInitials(profile.username, profile.email)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoSection}>
                            {profile.username && (
                                <Text style={styles.nameText}>
                                    {profile.username}
                                </Text>
                            )}
                            {profile.email && (
                                <Text style={styles.emailText}>
                                    {profile.email}
                                </Text>
                            )}
                            {profile.createdAt && (
                                <Text style={styles.dateText}>
                                    Member since {formatDate(profile.createdAt)}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Contact Section */}
                    <View style={styles.contactSection}>
                        <Text style={styles.sectionTitle}>Need Help?</Text>
                        <Text style={styles.sectionSubtitle}>Get in touch with us</Text>

                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={handleEmailPress}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.contactLabel}>Email</Text>
                            <Text style={styles.contactValue}>apexprediction@gmail.com</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={handlePhonePress}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.contactLabel}>Phone</Text>
                            <Text style={styles.contactValue}>+52 5576583376</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <View style={styles.signOutContainer}>
                <TouchableOpacity
                    style={[styles.signOutButton, authLoading && styles.signOutButtonDisabled]}
                    onPress={handleSignOut}
                    disabled={authLoading}
                    activeOpacity={0.6}
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
        padding: 24,
        paddingBottom: 76,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 16,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 18,
        color: '#374151',
        fontWeight: '300',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    errorContainer: {
        backgroundColor: '#fef2f2',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        textAlign: 'center',
    },
    // Profile Card - Minimalist Design
    profileCard: {
        marginBottom: 48,
        alignItems: 'center',
    },
    avatarSection: {
        marginBottom: 32,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 120 / 2,
        backgroundColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 42,
        fontWeight: '300',
        color: '#ffffff',
        letterSpacing: 1,
    },
    infoSection: {
        alignItems: 'center',
        width: '100%',
    },
    nameText: {
        fontSize: 32,
        fontWeight: '300',
        color: '#dc2626',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    emailText: {
        fontSize: 17,
        fontWeight: '400',
        color: '#666666',
        marginBottom: 12,
        letterSpacing: -0.2,
    },
    dateText: {
        fontSize: 15,
        fontWeight: '300',
        color: '#999999',
        letterSpacing: -0.1,
    },
    // Contact Section
    contactSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '300',
        color: '#dc2626',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    sectionSubtitle: {
        fontSize: 15,
        fontWeight: '300',
        color: '#666666',
        marginBottom: 32,
        letterSpacing: -0.1,
    },
    contactItem: {
        paddingVertical: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f3f4f6',
    },
    contactLabel: {
        fontSize: 13,
        fontWeight: '400',
        color: '#999999',
        marginBottom: 6,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    contactValue: {
        fontSize: 17,
        fontWeight: '400',
        color: '#dc2626',
        letterSpacing: -0.2,
    },
    signOutContainer: {
        marginTop: 'auto',
        paddingTop: 32,
    },
    signOutButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#dc2626',
        borderRadius: 0,
    },
    signOutButtonDisabled: {
        opacity: 0.4,
    },
    signOutText: {
        color: '#dc2626',
        fontWeight: '400',
        fontSize: 17,
        letterSpacing: -0.2,
    },
});


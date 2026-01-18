import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Clipboard,
} from 'react-native';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../contexts/AuthContext';

// Local League type for this screen (leagues feature is placeholder)
interface League {
    PK: string;
    league_id?: string;
    league_name?: string;
    description?: string;
    is_private?: boolean;
    role?: string;
    member_count?: number;
    max_members?: number;
    join_code?: string;
}

type LeaguesScreenProps = {
    onProfilePress: () => void;
};

export default function LeaguesScreen({ onProfilePress }: LeaguesScreenProps) {
    const { user } = useAuth();
    const [myLeagues, setMyLeagues] = useState<League[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLeagues();
    }, [user]);

    const fetchLeagues = async () => {
        if (!user?.userId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // COMMENTED OUT: const leagues = await getUserLeagues(user.userId);
            // setMyLeagues(leagues);
            setMyLeagues([]); // Set to empty since we're not fetching
        } catch (err: any) {
            console.error('Error fetching leagues:', err);
            setError(err.message || 'Failed to load leagues');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateLeague = () => {
        // TODO: Implement create league functionality
        Alert.alert('Create League', 'This feature is coming soon!');
    };

    const handleJoinLeague = () => {
        // TODO: Implement join league functionality
        Alert.alert('Join League', 'This feature is coming soon!');
    };

    const handleCopyJoinCode = (code: string) => {
        Clipboard.setString(code);
        Alert.alert('Copied!', 'Join code copied to clipboard');
    };

    const handleLeaderboard = (leagueId: string) => {
        // TODO: Navigate to league leaderboard
        console.log('View leaderboard for league:', leagueId);
    };

    const handleManage = (leagueId: string) => {
        // TODO: Navigate to league management
        console.log('Manage league:', leagueId);
    };

    return (
        <View style={styles.container}>
            <AppHeader onProfilePress={onProfilePress} />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Top Navigation Buttons */}
                <View style={styles.topNav}>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={handleCreateLeague}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.createButtonIcon}>+</Text>
                        <Text style={styles.createButtonText}>Create League</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.joinButton}
                        onPress={handleJoinLeague}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.joinButtonIcon}>🔍</Text>
                        <Text style={styles.joinButtonText}>Join League</Text>
                    </TouchableOpacity>
                </View>

                {/* Section Title */}
                <Text style={styles.sectionTitle}>My Leagues ({myLeagues.length})</Text>

                {/* Content */}
                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#dc2626" />
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={fetchLeagues}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : myLeagues.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyText}>
                            You don't have any leagues yet. Create or join a league to get started!
                        </Text>
                    </View>
                ) : (
                    <View style={styles.leaguesContainer}>
                        {myLeagues.map((league) => (
                            <LeagueCard
                                key={league.league_id || league.PK}
                                league={league}
                                onCopyCode={handleCopyJoinCode}
                                onLeaderboard={handleLeaderboard}
                                onManage={handleManage}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

interface LeagueCardProps {
    league: League;
    onCopyCode: (code: string) => void;
    onLeaderboard: (leagueId: string) => void;
    onManage: (leagueId: string) => void;
}

function LeagueCard({
    league,
    onCopyCode,
    onLeaderboard,
    onManage,
}: LeagueCardProps) {
    const leagueId = league.league_id || league.PK;
    const leagueName = league.league_name || 'Unnamed League';
    const description = league.description || '';
    const isAdmin = league.role === 'Admin' || league.role === 'admin';
    const memberCount = league.member_count || 0;
    const joinCode = league.join_code || '';

    return (
        <View style={styles.leagueCard}>
            {/* League Header */}
            <View style={styles.leagueHeader}>
                <View style={styles.leagueHeaderLeft}>
                    <Text style={styles.leagueName}>{leagueName}</Text>
                    {isAdmin && (
                        <View style={styles.badgesContainer}>
                            <View style={styles.badgeAdmin}>
                                <Text style={styles.badgeIcon}>👑</Text>
                                <Text style={styles.badgeText}>Admin</Text>
                            </View>
                        </View>
                    )}
                    {description ? (
                        <Text style={styles.leagueDescription}>{description}</Text>
                    ) : null}
                </View>
            </View>

            {/* Membership Info */}
            <View style={styles.membershipInfo}>
                <View style={styles.membershipBox}>
                    <Text style={styles.membershipNumber}>{memberCount}</Text>
                    <Text style={styles.membershipLabel}>Members</Text>
                </View>
            </View>

            {/* Join Code */}
            {joinCode && (
                <View style={styles.joinCodeContainer}>
                    <Text style={styles.joinCodeLabel}>Join Code</Text>
                    <View style={styles.joinCodeRow}>
                        <Text style={styles.joinCodeText}>{joinCode}</Text>
                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={() => onCopyCode(joinCode)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.copyIcon}>📋</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.leaderboardButton}
                    onPress={() => onLeaderboard(leagueId)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.leaderboardButtonIcon}>📊</Text>
                    <Text style={styles.leaderboardButtonText}>Leaderboard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => onManage(leagueId)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.manageButtonIcon}>⚙️</Text>
                    <Text style={styles.manageButtonText}>Manage</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 80, // Space for bottom nav
    },
    topNav: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    createButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dc2626',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    createButtonIcon: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        marginRight: 6,
    },
    createButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    joinButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    joinButtonIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    joinButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    leaguesContainer: {
        gap: 16,
    },
    leagueCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    leagueHeader: {
        marginBottom: 16,
    },
    leagueHeaderLeft: {
        flex: 1,
    },
    leagueName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    badgesContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
    badgeAdmin: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    leagueDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    membershipInfo: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    membershipBox: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    membershipNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#dc2626',
        marginBottom: 4,
    },
    membershipLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    joinCodeContainer: {
        marginBottom: 16,
    },
    joinCodeLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 6,
    },
    joinCodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    joinCodeText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
    },
    copyButton: {
        padding: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 6,
    },
    copyIcon: {
        fontSize: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    leaderboardButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dc2626',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    leaderboardButtonIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    leaderboardButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    manageButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    manageButtonIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    manageButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    errorText: {
        fontSize: 16,
        color: '#dc2626',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});

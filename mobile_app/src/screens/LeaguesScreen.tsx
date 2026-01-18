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

type TabType = 'my' | 'public';

export default function LeaguesScreen({ onProfilePress }: LeaguesScreenProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('my');
    const [myLeagues, setMyLeagues] = useState<League[]>([]);
    const [publicLeagues, setPublicLeagues] = useState<League[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLeagues();
    }, [user, activeTab]);

    const fetchLeagues = async () => {
        if (!user?.userId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // COMMENTED OUT: if (activeTab === 'my') {
            //     const leagues = await getUserLeagues(user.userId);
            //     setMyLeagues(leagues);
            // } else {
            //     const leagues = await getLeagues(undefined, false);
            //     setPublicLeagues(leagues);
            // }
            setMyLeagues([]); // Set to empty since we're not fetching
            setPublicLeagues([]); // Set to empty since we're not fetching
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

    const currentLeagues = activeTab === 'my' ? myLeagues : publicLeagues;
    const capacityPercentage = (league: League) => {
        const members = league.member_count || 0;
        const max = league.max_members || 100;
        return Math.round((members / max) * 100);
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

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'my' && styles.tabActive]}
                        onPress={() => setActiveTab('my')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
                            My Leagues ({myLeagues.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'public' && styles.tabActive]}
                        onPress={() => setActiveTab('public')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabText, activeTab === 'public' && styles.tabTextActive]}>
                            Public
                        </Text>
                    </TouchableOpacity>
                </View>

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
                ) : currentLeagues.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyText}>
                            {activeTab === 'my'
                                ? "You don't have any leagues yet. Create or join a league to get started!"
                                : 'No public leagues available.'}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.leaguesContainer}>
                        {currentLeagues.map((league) => (
                            <LeagueCard
                                key={league.league_id || league.PK}
                                league={league}
                                capacityPercentage={capacityPercentage(league)}
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
    capacityPercentage: number;
    onCopyCode: (code: string) => void;
    onLeaderboard: (leagueId: string) => void;
    onManage: (leagueId: string) => void;
}

function LeagueCard({
    league,
    capacityPercentage,
    onCopyCode,
    onLeaderboard,
    onManage,
}: LeagueCardProps) {
    const leagueId = league.league_id || league.PK;
    const leagueName = league.league_name || 'Unnamed League';
    const description = league.description || '';
    const isPrivate = league.is_private ?? false;
    const isAdmin = league.role === 'Admin' || league.role === 'admin';
    const memberCount = league.member_count || 0;
    const maxMembers = league.max_members || 50;
    const joinCode = league.join_code || '';

    return (
        <View style={styles.leagueCard}>
            {/* League Header */}
            <View style={styles.leagueHeader}>
                <View style={styles.leagueHeaderLeft}>
                    <Text style={styles.leagueName}>{leagueName}</Text>
                    <View style={styles.badgesContainer}>
                        {isPrivate && (
                            <View style={styles.badgePrivate}>
                                <Text style={styles.badgeIcon}>🔒</Text>
                                <Text style={styles.badgeText}>Private</Text>
                            </View>
                        )}
                        {isAdmin && (
                            <View style={styles.badgeAdmin}>
                                <Text style={styles.badgeIcon}>👑</Text>
                                <Text style={styles.badgeText}>Admin</Text>
                            </View>
                        )}
                    </View>
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
                <View style={styles.membershipBox}>
                    <Text style={styles.maxMembersNumber}>{maxMembers}</Text>
                    <Text style={styles.membershipLabel}>Max Size</Text>
                </View>
            </View>

            {/* Capacity Bar */}
            <View style={styles.capacityContainer}>
                <Text style={styles.capacityLabel}>Capacity</Text>
                <View style={styles.capacityBarContainer}>
                    <View style={styles.capacityBar}>
                        <View
                            style={[
                                styles.capacityBarFill,
                                { width: `${Math.min(capacityPercentage, 100)}%` },
                            ]}
                        />
                    </View>
                    <Text style={styles.capacityPercentage}>{capacityPercentage}%</Text>
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
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 12,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#ffffff',
    },
    tabActive: {
        backgroundColor: '#dc2626',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    tabTextActive: {
        color: '#ffffff',
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
    badgePrivate: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fce7f3',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
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
    maxMembersNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    membershipLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    capacityContainer: {
        marginBottom: 16,
    },
    capacityLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 6,
    },
    capacityBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    capacityBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
    },
    capacityBarFill: {
        height: '100%',
        backgroundColor: '#dc2626',
        borderRadius: 4,
    },
    capacityPercentage: {
        fontSize: 12,
        color: '#6b7280',
        minWidth: 40,
        textAlign: 'right',
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

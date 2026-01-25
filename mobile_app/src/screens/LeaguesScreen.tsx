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
import { CreateLeagueModal, JoinLeagueModal } from '../components/leagues';
import { createLeague, getMyLeagues, joinLeagueByCode, getLeagueMembers, getLeagueLeaderboard, type LeagueMember, type LeagueLeaderboardEntry } from '../services/graphql/leagues';

// Local League type for this screen - using LeagueMember from the service
interface League {
    PK: string;
    league_id?: string;
    league_name?: string;
    description?: string;
    is_private?: boolean;
    role?: string;
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
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [isCreatingLeague, setIsCreatingLeague] = useState(false);
    const [isJoiningLeague, setIsJoiningLeague] = useState(false);
    const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
    const [leagueMembers, setLeagueMembers] = useState<LeagueMember[]>([]);
    const [leagueLeaderboard, setLeagueLeaderboard] = useState<LeagueLeaderboardEntry[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

    // Constants for category and season
    const category = 'f1';
    const season = new Date().getFullYear().toString();

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

            const result = await getMyLeagues(50);
            // Convert LeagueMember to League format for the UI
            const leagues: League[] = result.items.map((member: LeagueMember) => ({
                PK: member.PK,
                league_id: member.leagueId,
                league_name: member.leagueName || 'Unnamed League',
                description: member.description,
                role: member.role,
                join_code: member.code,
            }));
            setMyLeagues(leagues);
        } catch (err: any) {
            console.error('Error fetching leagues:', err);
            setError(err.message || 'Failed to load leagues');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateLeague = () => {
        setShowCreateModal(true);
    };

    const handleCreateLeagueSubmit = async (leagueName: string, description: string) => {
        if (!user?.userId) {
            Alert.alert('Error', 'You must be logged in to create a league');
            return;
        }

        setIsCreatingLeague(true);
        try {
            // Create the league
            const league = await createLeague(leagueName, description, category, season);

            // League member is created automatically by the service
            // TODO: Copy leaderboard entries if needed

            Alert.alert('Success', `League "${league.name}" created! Join code: ${league.byCode}`, [
                {
                    text: 'OK', onPress: () => {
                        setShowCreateModal(false);
                        fetchLeagues(); // Refresh leagues list
                    }
                }
            ]);
        } catch (err: any) {
            console.error('Error creating league:', err);
            Alert.alert('Error', err.message || 'Failed to create league. Please try again.');
        } finally {
            setIsCreatingLeague(false);
        }
    };

    const handleJoinLeague = () => {
        setShowJoinModal(true);
    };

    const handleJoinLeagueSubmit = async (joinCode: string) => {
        if (!user?.userId) {
            Alert.alert('Error', 'You must be logged in to join a league');
            return;
        }

        setIsJoiningLeague(true);
        try {
            const member = await joinLeagueByCode(joinCode);

            Alert.alert('Success', `You have joined the league!`, [
                {
                    text: 'OK', onPress: () => {
                        setShowJoinModal(false);
                        fetchLeagues(); // Refresh leagues list
                    }
                }
            ]);
        } catch (err: any) {
            console.error('Error joining league:', err);
            throw err; // Let the modal handle the error message
        } finally {
            setIsJoiningLeague(false);
        }
    };

    const handleCopyJoinCode = (code: string) => {
        Clipboard.setString(code);
    };

    const handleLeaderboard = async (leagueId: string) => {
        if (selectedLeagueId === leagueId) {
            // If already selected, close it
            handleCloseDetails();
            return;
        }
        setSelectedLeagueId(leagueId);
        setIsLoadingLeaderboard(true);
        setIsLoadingMembers(true);
        
        // Load both members and leaderboard
        try {
            const [membersResult, leaderboardResult] = await Promise.all([
                getLeagueMembers(leagueId, 50),
                getLeagueLeaderboard(leagueId, category, season, 50),
            ]);
            setLeagueMembers(membersResult.items);
            setLeagueLeaderboard(leaderboardResult.items);
        } catch (err: any) {
            console.error('Error fetching league data:', err);
            Alert.alert('Error', err.message || 'Failed to load league data');
        } finally {
            setIsLoadingLeaderboard(false);
            setIsLoadingMembers(false);
        }
    };

    const handleManage = async (leagueId: string) => {
        if (selectedLeagueId === leagueId) {
            // If already selected, close it
            handleCloseDetails();
            return;
        }
        setSelectedLeagueId(leagueId);
        setIsLoadingMembers(true);
        setIsLoadingLeaderboard(true);
        
        // Load both members and leaderboard
        try {
            const [membersResult, leaderboardResult] = await Promise.all([
                getLeagueMembers(leagueId, 50),
                getLeagueLeaderboard(leagueId, category, season, 50),
            ]);
            setLeagueMembers(membersResult.items);
            setLeagueLeaderboard(leaderboardResult.items);
        } catch (err: any) {
            console.error('Error fetching league data:', err);
            Alert.alert('Error', err.message || 'Failed to load league data');
        } finally {
            setIsLoadingMembers(false);
            setIsLoadingLeaderboard(false);
        }
    };

    const handleCloseDetails = () => {
        setSelectedLeagueId(null);
        setLeagueMembers([]);
        setLeagueLeaderboard([]);
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
                                isSelected={selectedLeagueId === (league.league_id || league.PK)}
                            />
                        ))}
                        {selectedLeagueId && (
                            <LeagueDetailsCard
                                leagueId={selectedLeagueId}
                                members={leagueMembers}
                                leaderboard={leagueLeaderboard}
                                isLoadingMembers={isLoadingMembers}
                                isLoadingLeaderboard={isLoadingLeaderboard}
                                onClose={handleCloseDetails}
                                category={category}
                                season={season}
                            />
                        )}
                    </View>
                )}
            </ScrollView>

            <CreateLeagueModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateLeagueSubmit}
                isLoading={isCreatingLeague}
            />

            <JoinLeagueModal
                visible={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                onJoin={handleJoinLeagueSubmit}
                isLoading={isJoiningLeague}
            />
        </View>
    );
}

interface LeagueCardProps {
    league: League;
    onCopyCode: (code: string) => void;
    onLeaderboard: (leagueId: string) => void;
    onManage: (leagueId: string) => void;
    isSelected?: boolean;
}

function LeagueCard({
    league,
    onCopyCode,
    onLeaderboard,
    onManage,
    isSelected = false,
}: LeagueCardProps) {
    const [copied, setCopied] = useState(false);
    const leagueId = league.league_id || league.PK;
    const leagueName = league.league_name || 'Unnamed League';
    const description = league.description || '';
    const isAdmin = league.role === 'Admin' || league.role === 'admin';
    const joinCode = league.join_code || '';

    const handleCopy = (code: string) => {
        onCopyCode(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <View style={[styles.leagueCard, isSelected && styles.leagueCardSelected]}>
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

            {/* Join Code */}
            {joinCode && (
                <View style={styles.joinCodeContainer}>
                    <Text style={styles.joinCodeLabel}>INVITATION CODE</Text>
                    <View style={styles.joinCodeChip}>
                        <Text style={styles.joinCodeText}>{joinCode}</Text>
                        <TouchableOpacity
                            style={[styles.copyButton, copied && styles.copyButtonSuccess]}
                            onPress={() => handleCopy(joinCode)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.copyButtonText, copied && styles.copyButtonTextSuccess]}>
                                {copied ? 'COPIED' : 'COPY'}
                            </Text>
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
                    <Text style={styles.leaderboardButtonText}>LEADERBOARD</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => onManage(leagueId)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.manageButtonText}>MANAGE</Text>
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
    joinCodeContainer: {
        marginBottom: 20,
    },
    joinCodeLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748b',
        marginBottom: 8,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    joinCodeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingLeft: 16,
        paddingRight: 6,
        paddingVertical: 6,
    },
    joinCodeText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        flex: 1,
        letterSpacing: 2,
    },
    copyButton: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    copyButtonSuccess: {
        backgroundColor: '#10b981',
    },
    copyButtonText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    copyButtonTextSuccess: {
        color: '#ffffff',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    leaderboardButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dc2626',
        borderRadius: 10,
        paddingVertical: 14,
    },
    leaderboardButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 1,
    },
    manageButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    manageButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 1,
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
    leagueCardSelected: {
        borderWidth: 2,
        borderColor: '#dc2626',
    },
    detailsCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    detailsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
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
        color: '#6b7280',
        fontWeight: '600',
    },
    detailsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    emptySectionText: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    membersList: {
        maxHeight: 200,
    },
    memberItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        marginBottom: 8,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    roleBadge: {
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    roleBadgeAdmin: {
        backgroundColor: '#fef3c7',
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        textTransform: 'capitalize',
    },
    leaderboardList: {
        maxHeight: 300,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        marginBottom: 8,
    },
    rankText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#dc2626',
        width: 40,
    },
    leaderboardItemContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leaderboardUsername: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    leaderboardPoints: {
        fontSize: 14,
        fontWeight: '700',
        color: '#dc2626',
    },
});

interface LeagueDetailsCardProps {
    leagueId: string;
    members: LeagueMember[];
    leaderboard: LeagueLeaderboardEntry[];
    isLoadingMembers: boolean;
    isLoadingLeaderboard: boolean;
    onClose: () => void;
    category: string;
    season: string;
}

function LeagueDetailsCard({
    members,
    leaderboard,
    isLoadingMembers,
    isLoadingLeaderboard,
    onClose,
    category,
    season,
}: LeagueDetailsCardProps) {
    return (
        <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
                <Text style={styles.detailsTitle}>League Details</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>

            {/* Members Section */}
            <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Members ({members.length})</Text>
                {isLoadingMembers ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                ) : members.length === 0 ? (
                    <Text style={styles.emptySectionText}>No members found</Text>
                ) : (
                    <ScrollView style={styles.membersList}>
                        {members.map((member) => (
                            <View key={member.userId} style={styles.memberItem}>
                                <Text style={styles.memberName}>{member.username || member.userId}</Text>
                                <View style={[styles.roleBadge, member.role === 'admin' && styles.roleBadgeAdmin]}>
                                    <Text style={styles.roleText}>{member.role}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Leaderboard Section */}
            <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Leaderboard ({category.toUpperCase()} {season})</Text>
                {isLoadingLeaderboard ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                ) : leaderboard.length === 0 ? (
                    <Text style={styles.emptySectionText}>No leaderboard entries found</Text>
                ) : (
                    <ScrollView style={styles.leaderboardList}>
                        {leaderboard.map((entry, index) => (
                            <View key={entry.userId} style={styles.leaderboardItem}>
                                <Text style={styles.rankText}>#{index + 1}</Text>
                                <View style={styles.leaderboardItemContent}>
                                    <Text style={styles.leaderboardUsername}>{entry.username || entry.userId}</Text>
                                    <Text style={styles.leaderboardPoints}>{entry.totalPoints} pts</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>
        </View>
    );
}

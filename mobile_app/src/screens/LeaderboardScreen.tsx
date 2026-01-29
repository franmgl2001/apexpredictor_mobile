import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import {
    LeaderboardFilters,
    LeaderboardList,
    type FilterType,
    type TimeFilterType,
    type LeaderboardEntryData,
} from '../components/leaderboard';
import PredictionsModal from '../components/leaderboard/PredictionsModal';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
    getLeaderboard,
    ensureLeaderboardEntry,
    type LeaderboardEntry,
} from '../services/graphql/leaderboard';
import { getMyLeagues, getLeagueLeaderboard, getLeagueRaceLeaderboard, type LeagueMember, type LeagueLeaderboardEntry } from '../services/graphql/leagues';
import { getRaceLeaderboard } from '../services/graphql/predictions';

type LeaderboardScreenProps = {
    onProfilePress: () => void;
};

export default function LeaderboardScreen({ onProfilePress }: LeaderboardScreenProps) {
    const { user } = useAuth();
    const { profile } = useData();
    const [filterType, setFilterType] = useState<FilterType>('global');
    const [timeFilter, setTimeFilter] = useState<TimeFilterType>('season');
    const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntryData | null>(null);
    const [showPredictionsModal, setShowPredictionsModal] = useState(false);

    // League state
    const [leagues, setLeagues] = useState<Array<{ league_id: string; league_name: string; role?: string; description?: string }>>([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
    const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);

    // Data state
    const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
    const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
    const [raceLeaderboard, setRaceLeaderboard] = useState<LeaderboardEntryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Constants for category and season
    const category = 'f1';
    const season = new Date().getFullYear().toString();

    // Ensure user has a leaderboard entry when screen loads
    useEffect(() => {
        const initializeUserLeaderboardEntry = async () => {
            if (!user?.userId || !profile?.username) {
                return;
            }

            try {
                const entry = await ensureLeaderboardEntry(category, season, profile.username, profile.country);
                setMyEntry(entry);
            } catch (err: any) {
                console.error('Error ensuring leaderboard entry:', err);
                // Don't set error state here - it's not critical
            }
        };

        initializeUserLeaderboardEntry();
    }, [user?.userId, profile?.username]);

    // Fetch leagues when league filter is activated
    const fetchLeagues = async () => {
        if (!user?.userId) {
            setLeagues([]);
            return;
        }

        try {
            setIsLoadingLeagues(true);
            const result = await getMyLeagues(50);
            // Map LeagueMember to the format expected by LeagueSelector
            const mappedLeagues = result.items.map((member: LeagueMember) => ({
                league_id: member.leagueId,
                league_name: member.leagueName || 'Unnamed League',
                role: member.role,
                description: member.description,
            }));
            setLeagues(mappedLeagues);
        } catch (err: any) {
            console.error('Error fetching leagues:', err);
            setError(err.message || 'Failed to load leagues');
        } finally {
            setIsLoadingLeagues(false);
        }
    };

    // Fetch season leaderboard
    const fetchSeasonLeaderboard = async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (filterType === 'league' && selectedLeagueId) {
                // Fetch league leaderboard using byLeaderboard GSI
                const data = await getLeagueLeaderboard(selectedLeagueId, category, season, 100);
                // Convert LeagueLeaderboardEntry to LeaderboardEntry format
                const convertedEntries: LeaderboardEntry[] = data.items.map((entry: LeagueLeaderboardEntry) => ({
                    PK: entry.PK,
                    SK: entry.SK,
                    entityType: entry.entityType,
                    userId: entry.userId,
                    category: entry.category,
                    season: entry.season,
                    totalPoints: entry.totalPoints,
                    username: entry.username,
                    numberOfRaces: entry.numberOfRaces,
                    nationality: entry.nationality,
                }));
                setLeaderboardEntries(convertedEntries);
            } else {
                // Fetch global leaderboard
                const data = await getLeaderboard(category, season, 100);
                setLeaderboardEntries(data.items);
            }
        } catch (err: any) {
            console.error('Error fetching season leaderboard:', err);
            setError(err.message || 'Failed to load leaderboard');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch race-specific leaderboard
    const fetchRaceLeaderboard = async (raceId: string) => {
        try {
            setIsLoading(true);
            setError(null);

            let predictions;
            let userIdToUsername = new Map<string, string>();
            let userIdToNationality = new Map<string, string | undefined>();

            if (filterType === 'league' && selectedLeagueId) {
                // Fetch league race leaderboard
                predictions = await getLeagueRaceLeaderboard(selectedLeagueId, category, raceId, 100);

                // Fetch league season leaderboard to get usernames for userIds
                const leagueSeasonLeaderboard = await getLeagueLeaderboard(selectedLeagueId, category, season, 100);
                leagueSeasonLeaderboard.items.forEach((entry) => {
                    userIdToUsername.set(entry.userId, entry.username);
                    userIdToNationality.set(entry.userId, entry.nationality);
                });
            } else {
                // Fetch global race leaderboard
                predictions = await getRaceLeaderboard(category, raceId, 100);

                // Fetch season leaderboard to get usernames for userIds
                const seasonLeaderboard = await getLeaderboard(category, season, 100);
                seasonLeaderboard.items.forEach((entry) => {
                    userIdToUsername.set(entry.userId, entry.username);
                    userIdToNationality.set(entry.userId, entry.nationality);
                });
            }

            // Map predictions to leaderboard entries
            const raceEntries: LeaderboardEntryData[] = predictions.map((pred, index) => {
                const username = userIdToUsername.get(pred.userId) || 'Unknown';
                const nationality = userIdToNationality.get(pred.userId);

                // Convert prediction to JSON string for the modal
                let predictionJson: string | null = null;
                if (pred.prediction) {
                    if (typeof pred.prediction === 'string') {
                        predictionJson = pred.prediction;
                    } else {
                        predictionJson = JSON.stringify(pred.prediction);
                    }
                } else {
                    console.log(`[LeaderboardScreen] No prediction data for user ${username} (userId: ${pred.userId})`);
                }

                return {
                    username,
                    points: pred.points,
                    nationality,
                    predictions: predictionJson,
                };
            });

            setRaceLeaderboard(raceEntries);
        } catch (err: any) {
            console.error('Error fetching race leaderboard:', err);
            const errorMessage = err?.message || err?.errors?.[0]?.message || 'Failed to load race leaderboard';
            setError(errorMessage);
            setRaceLeaderboard([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch leagues when league filter is activated
    useEffect(() => {
        if (filterType === 'league') {
            fetchLeagues();
        } else {
            setLeagues([]);
            setSelectedLeagueId(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterType, user?.userId]);

    // Fetch season leaderboard on mount and when filters change
    useEffect(() => {
        if (timeFilter === 'season') {
            if (filterType === 'global') {
                fetchSeasonLeaderboard();
            } else if (filterType === 'league' && selectedLeagueId) {
                fetchSeasonLeaderboard();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterType, selectedLeagueId, timeFilter]);

    // Fetch race leaderboard when race is selected
    useEffect(() => {
        if (timeFilter === 'race' && selectedRaceId) {
            if (filterType === 'global') {
                fetchRaceLeaderboard(selectedRaceId);
            } else if (filterType === 'league' && selectedLeagueId) {
                fetchRaceLeaderboard(selectedRaceId);
            }
        } else if (timeFilter === 'season') {
            setRaceLeaderboard([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeFilter, selectedRaceId, filterType, selectedLeagueId]);

    // Extract leaderboard entries based on filter type
    const entries: LeaderboardEntryData[] = useMemo(() => {
        if (timeFilter === 'race') {
            // Race leaderboard is already transformed and sorted
            if (!selectedRaceId || raceLeaderboard.length === 0) {
                return [];
            }
            return raceLeaderboard;
        } else {
            // Load season leaderboard from LeaderboardEntry type
            return leaderboardEntries.map((item) => ({
                username: item.username || 'Unknown',
                points: item.totalPoints || 0,
                races: item.numberOfRaces || 0,
                nationality: item.nationality,
            }));
        }
    }, [timeFilter, selectedRaceId, leaderboardEntries, raceLeaderboard]);

    const handleRaceChange = (raceId: string) => {
        setSelectedRaceId(raceId);
    };

    const handleLeagueChange = (leagueId: string) => {
        setSelectedLeagueId(leagueId);
    };

    const handleEntryPress = (entry: LeaderboardEntryData) => {
        // Open modal for race filter - show predictions
        // For season filter, modal could also be opened but may not have predictions
        if (timeFilter === 'race') {
            // Open modal to show user's predictions
            console.log('Entry pressed:', entry.username, 'Has predictions:', !!entry.predictions);
            setSelectedEntry(entry);
            setShowPredictionsModal(true);
        } else {
            // For season leaderboard, we could also show predictions if available
            // But typically season leaderboard doesn't have per-race predictions
            console.log('Entry pressed (season mode):', entry.username);
        }
    };

    const handleCloseModal = () => {
        setShowPredictionsModal(false);
        setSelectedEntry(null);
    };

    return (
        <View style={styles.container}>
            <AppHeader onProfilePress={onProfilePress} />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Filters */}
                <LeaderboardFilters
                    filterType={filterType}
                    timeFilter={timeFilter}
                    onFilterTypeChange={setFilterType}
                    onTimeFilterChange={setTimeFilter}
                    onRaceChange={handleRaceChange}
                    leagues={leagues}
                    selectedLeagueId={selectedLeagueId}
                    onLeagueChange={handleLeagueChange}
                    isLoadingLeagues={isLoadingLeagues}
                />

                {/* Loading State */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#dc2626" />
                        <Text style={styles.loadingText}>Loading leaderboard...</Text>
                    </View>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => {
                                if (timeFilter === 'season') {
                                    fetchSeasonLeaderboard();
                                } else if (selectedRaceId) {
                                    fetchRaceLeaderboard(selectedRaceId);
                                }
                            }}
                        >
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Leaderboard List */}
                {!isLoading && !error && (
                    <LeaderboardList entries={entries} onEntryPress={handleEntryPress} />
                )}
            </ScrollView>

            {/* Predictions Modal - Always render, control visibility with visible prop */}
            <PredictionsModal
                visible={showPredictionsModal}
                onClose={handleCloseModal}
                username={selectedEntry?.username || ''}
                predictionsJson={selectedEntry?.predictions || null}
                raceId={timeFilter === 'race' ? selectedRaceId : null}
            />
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
        paddingBottom: 96,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    errorContainer: {
        backgroundColor: '#fef2f2',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
    },
    retryButton: {
        backgroundColor: '#dc2626',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 14,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
});

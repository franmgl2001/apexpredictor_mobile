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
import {
    getLeaderboard,
    getLeaderboardPredictions,
    getUserLeagues,
    getLeagueLeaderboard,
    getLeagueRacePredictions,
    type ApexEntity,
} from '../services/graphql';

type LeaderboardScreenProps = {
    onProfilePress: () => void;
};

export default function LeaderboardScreen({ onProfilePress }: LeaderboardScreenProps) {
    const { user } = useAuth();
    const [filterType, setFilterType] = useState<FilterType>('global');
    const [timeFilter, setTimeFilter] = useState<TimeFilterType>('season');
    const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntryData | null>(null);
    const [showPredictionsModal, setShowPredictionsModal] = useState(false);

    // League state
    const [leagues, setLeagues] = useState<ApexEntity[]>([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
    const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);

    // Data state
    const [seasonLeaderboard, setSeasonLeaderboard] = useState<ApexEntity[]>([]);
    const [raceLeaderboard, setRaceLeaderboard] = useState<LeaderboardEntryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch leagues when league filter is activated
    const fetchLeagues = async () => {
        if (!user?.userId) {
            setLeagues([]);
            return;
        }

        try {
            setIsLoadingLeagues(true);
            // COMMENTED OUT: const data = await getUserLeagues(user.userId, { includeDetails: false });
            // COMMENTED OUT: setLeagues(data);
            setLeagues([]); // Set to empty since we're not fetching
            // Auto-select first league if available
            // COMMENTED OUT: if (data.length > 0 && !selectedLeagueId) {
            //     const firstLeagueId = data[0].league_id || data[0].PK?.replace('league#', '') || null;
            //     if (firstLeagueId) {
            //         setSelectedLeagueId(firstLeagueId);
            //     }
            // }
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
            
            // COMMENTED OUT: if (filterType === 'league' && selectedLeagueId) {
            //     // Fetch league leaderboard
            //     const data = await getLeagueLeaderboard(selectedLeagueId, 1000);
            //     setSeasonLeaderboard(data);
            // } else {
            //     // Fetch global leaderboard
            //     const data = await getLeaderboard('LEADERBOARD', 'DESC', 1000);
            //     setSeasonLeaderboard(data);
            // }
            setSeasonLeaderboard([]); // Set to empty since we're not fetching
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
            
            // COMMENTED OUT: let data: ApexEntity[];
            // COMMENTED OUT: if (filterType === 'league' && selectedLeagueId) {
            //     // Fetch league race predictions
            //     data = await getLeagueRacePredictions(selectedLeagueId, raceId, 1000);
            // } else {
            //     // Use getLeaderboardPredictions which only fetches necessary fields (excludes createdAt/updatedAt)
            //     data = await getLeaderboardPredictions(raceId, 1000);
            // }
            
            // COMMENTED OUT: Transform data immediately to only include needed fields
            // COMMENTED OUT: if (Array.isArray(data)) {
            //     const transformedData: LeaderboardEntryData[] = data
            //         .map((item) => {
            //             // Extract only what we need: username, points, and predictions (for gridOrder)
            //             return {
            //                 username: item.username || 'Unknown',
            //                 points: item.points ?? 0,
            //                 predictions: item.predictions, // Keep as string JSON for modal
            //             };
            //         })
            //         .sort((a, b) => b.points - a.points); // Sort by points descending
            //     setRaceLeaderboard(transformedData);
            // } else {
            //     console.warn('Race leaderboard data is not an array:', data);
            //     setRaceLeaderboard([]);
            // }
            setRaceLeaderboard([]); // Set to empty since we're not fetching
        } catch (err: any) {
            console.error('Error fetching race leaderboard:', err);
            // Extract error message more carefully
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
            // Load season leaderboard
            return seasonLeaderboard.map((item) => ({
                username: item.username || 'Unknown',
                points: item.points || 0,
                races: item.races,
            }));
        }
    }, [timeFilter, selectedRaceId, seasonLeaderboard, raceLeaderboard]);

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

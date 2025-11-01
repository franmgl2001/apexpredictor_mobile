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
import { getLeaderboard, getLeaderboardPredictions, type ApexEntity } from '../services/graphql';

type LeaderboardScreenProps = {
    onProfilePress: () => void;
};

export default function LeaderboardScreen({ onProfilePress }: LeaderboardScreenProps) {
    const [filterType, setFilterType] = useState<FilterType>('global');
    const [timeFilter, setTimeFilter] = useState<TimeFilterType>('season');
    const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntryData | null>(null);
    const [showPredictionsModal, setShowPredictionsModal] = useState(false);

    // Data state
    const [seasonLeaderboard, setSeasonLeaderboard] = useState<ApexEntity[]>([]);
    const [raceLeaderboard, setRaceLeaderboard] = useState<LeaderboardEntryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch season leaderboard
    const fetchSeasonLeaderboard = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getLeaderboard('LEADERBOARD', 'DESC', 1000);
            setSeasonLeaderboard(data);
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
            // Use getLeaderboardPredictions which only fetches necessary fields (excludes createdAt/updatedAt)
            const data = await getLeaderboardPredictions(raceId, 1000);
            // Transform data immediately to only include needed fields
            if (Array.isArray(data)) {
                const transformedData: LeaderboardEntryData[] = data
                    .map((item) => {
                        // Extract only what we need: username, points, and predictions (for gridOrder)
                        return {
                            username: item.username || 'Unknown',
                            points: item.points ?? 0,
                            predictions: item.predictions, // Keep as string JSON for modal
                        };
                    })
                    .sort((a, b) => b.points - a.points); // Sort by points descending
                setRaceLeaderboard(transformedData);
            } else {
                console.warn('Race leaderboard data is not an array:', data);
                setRaceLeaderboard([]);
            }
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

    // Fetch season leaderboard on mount
    useEffect(() => {
        fetchSeasonLeaderboard();
    }, []);

    // Fetch race leaderboard when race is selected
    useEffect(() => {
        if (timeFilter === 'race' && selectedRaceId) {
            fetchRaceLeaderboard(selectedRaceId);
        } else if (timeFilter === 'season') {
            setRaceLeaderboard([]);
        }
    }, [timeFilter, selectedRaceId]);

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

    const handleEntryPress = (entry: LeaderboardEntryData) => {
        if (timeFilter === 'race') {
            // Open modal for any entry in race mode
            // Modal will handle displaying predictions or showing "No predictions available"
            console.log('Entry pressed:', entry.username, 'Has predictions:', !!entry.predictions);
            setSelectedEntry(entry);
            setShowPredictionsModal(true);
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

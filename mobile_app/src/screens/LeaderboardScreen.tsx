import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import leaderboardData from '../mocks/leaderboard.json';
import raceLeaderboardData from '../mocks/raceleaderboard.json';
import {
    LeaderboardFilters,
    LeaderboardList,
    type FilterType,
    type TimeFilterType,
    type LeaderboardEntryData,
} from '../components/leaderboard';
import PredictionsModal from '../components/leaderboard/PredictionsModal';

// Get available race IDs from race leaderboard data
function getAvailableRaceIds(): string[] {
    const items = raceLeaderboardData.data.listApexEntities.items;
    const raceIds = new Set<string>();
    items.forEach((item) => {
        if (item.race_id && item.entityType === 'PREDICTION') {
            raceIds.add(item.race_id);
        }
    });
    return Array.from(raceIds);
}

// Get the latest race ID (mexico2025 based on the data)
function getLatestRaceId(): string | null {
    const raceIds = getAvailableRaceIds();
    // For now, return the first available race ID (in production, this would be the latest)
    // Since all entries in raceleaderboard.json are for mexico2025, return that
    return raceIds.length > 0 ? raceIds[0] : null;
}

export default function LeaderboardScreen() {
    const [filterType, setFilterType] = useState<FilterType>('global');
    const [timeFilter, setTimeFilter] = useState<TimeFilterType>('season');
    const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntryData | null>(null);
    const [showPredictionsModal, setShowPredictionsModal] = useState(false);

    // When switching to race mode, automatically select the latest race immediately
    React.useEffect(() => {
        if (timeFilter === 'race') {
            // Always set to latest race when switching to race mode to ensure entries load immediately
            const latestRaceId = getLatestRaceId();
            if (latestRaceId) {
                setSelectedRaceId(latestRaceId);
            }
        } else {
            // Reset selected race when switching back to season
            setSelectedRaceId(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeFilter]);

    // Extract leaderboard entries based on filter type
    const entries: LeaderboardEntryData[] = useMemo(() => {
        if (timeFilter === 'race') {
            // Load race-specific leaderboard
            const items = raceLeaderboardData.data.listApexEntities.items;
            const raceIdToUse = selectedRaceId || getLatestRaceId();

            if (raceIdToUse) {
                const raceEntries = items
                    .filter((item) => item.race_id === raceIdToUse && item.entityType === 'PREDICTION')
                    .map((item) => ({
                        username: item.username,
                        points: item.points || 0,
                        predictions: item.predictions,
                    }))
                    .sort((a, b) => b.points - a.points); // Sort by points descending

                return raceEntries;
            }
            return [];
        } else {
            // Load season leaderboard
            return leaderboardData.data.leaderboardByPoints.items.map((item) => ({
                username: item.username,
                points: item.points,
                races: item.races,
            }));
        }
    }, [timeFilter, selectedRaceId]);

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

                {/* Leaderboard List */}
                <LeaderboardList entries={entries} onEntryPress={handleEntryPress} />
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
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
});

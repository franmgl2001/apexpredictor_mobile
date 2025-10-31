import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import leaderboardData from '../mocks/leaderboard.json';
import {
    LeaderboardHeader,
    LeaderboardFilters,
    LeaderboardList,
    type FilterType,
    type TimeFilterType,
    type LeaderboardEntryData,
} from '../components/leaderboard';

export default function LeaderboardScreen() {
    const [filterType, setFilterType] = useState<FilterType>('global');
    const [timeFilter, setTimeFilter] = useState<TimeFilterType>('season');
    const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);

    // Extract leaderboard entries from mock data
    const entries: LeaderboardEntryData[] = leaderboardData.data.leaderboardByPoints.items.map((item) => ({
        username: item.username,
        points: item.points,
        races: item.races,
    }));

    const handleRaceChange = (raceId: string) => {
        setSelectedRaceId(raceId);
        // TODO: Filter leaderboard entries by race when race filter is implemented
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Filters */}
                <LeaderboardFilters
                    filterType={filterType}
                    timeFilter={timeFilter}
                    onFilterTypeChange={setFilterType}
                    onTimeFilterChange={setTimeFilter}
                    onRaceChange={handleRaceChange}
                />

                {/* Leaderboard List */}
                <LeaderboardList entries={entries} />
            </ScrollView>
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

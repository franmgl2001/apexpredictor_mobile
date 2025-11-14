import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import RaceFilterCarousel from './RaceFilterCarousel';
import LeagueSelector from './LeagueSelector';
import type { ApexEntity } from '../../services/graphql';

export type FilterType = 'global' | 'league';
export type TimeFilterType = 'season' | 'race';

interface LeaderboardFiltersProps {
    filterType: FilterType;
    timeFilter: TimeFilterType;
    onFilterTypeChange: (type: FilterType) => void;
    onTimeFilterChange: (type: TimeFilterType) => void;
    onRaceChange?: (raceId: string) => void;
    leagues?: ApexEntity[];
    selectedLeagueId?: string | null;
    onLeagueChange?: (leagueId: string) => void;
    isLoadingLeagues?: boolean;
}

export default function LeaderboardFilters({
    filterType,
    timeFilter,
    onFilterTypeChange,
    onTimeFilterChange,
    onRaceChange,
    leagues = [],
    selectedLeagueId = null,
    onLeagueChange,
    isLoadingLeagues = false,
}: LeaderboardFiltersProps) {
    return (
        <>
            {/* Filter Buttons - Global/League */}
            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={[styles.filterButton, filterType === 'global' && styles.filterButtonActive]}
                    onPress={() => onFilterTypeChange('global')}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.filterIcon,
                            { color: filterType === 'global' ? '#ffffff' : '#6b7280' },
                        ]}
                    >
                        🌐
                    </Text>
                    <Text style={[styles.filterText, filterType === 'global' && styles.filterTextActive]}>
                        Global
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filterType === 'league' && styles.filterButtonActive]}
                    onPress={() => onFilterTypeChange('league')}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.filterIcon,
                            { color: filterType === 'league' ? '#ffffff' : '#9ca3af' },
                        ]}
                    >
                        🏆
                    </Text>
                    <Text style={[styles.filterText, filterType === 'league' && styles.filterTextActive]}>
                        League
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Filter Buttons - Season/Race */}
            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={[styles.filterButton, timeFilter === 'season' && styles.filterButtonActiveDark]}
                    onPress={() => onTimeFilterChange('season')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.filterText, timeFilter === 'season' && styles.filterTextActive]}>
                        Season
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, timeFilter === 'race' && styles.filterButtonActiveDark]}
                    onPress={() => onTimeFilterChange('race')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.filterText, timeFilter === 'race' && styles.filterTextActive]}>Race</Text>
                </TouchableOpacity>
            </View>

            {/* League Selector - Only show when League filter is active, positioned after Season/Race */}
            {filterType === 'league' && onLeagueChange && (
                <LeagueSelector
                    leagues={leagues}
                    selectedLeagueId={selectedLeagueId}
                    onLeagueChange={onLeagueChange}
                    isLoading={isLoadingLeagues}
                />
            )}

            {/* Race Carousel - Only show when Race filter is selected */}
            {timeFilter === 'race' && <RaceFilterCarousel onRaceChange={onRaceChange} />}
        </>
    );
}

const styles = StyleSheet.create({
    filterRow: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 12,
    },
    filterButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    filterButtonActive: {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626',
    },
    filterButtonActiveDark: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    filterIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    filterTextActive: {
        color: '#ffffff',
    },
});


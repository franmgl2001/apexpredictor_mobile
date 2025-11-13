import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { ApexEntity } from '../../services/graphql';

interface LeagueSelectorProps {
    leagues: ApexEntity[];
    selectedLeagueId: string | null;
    onLeagueChange: (leagueId: string) => void;
    isLoading?: boolean;
}

export default function LeagueSelector({
    leagues,
    selectedLeagueId,
    onLeagueChange,
    isLoading = false,
}: LeagueSelectorProps) {
    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading leagues...</Text>
            </View>
        );
    }

    if (leagues.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>No leagues available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Select League</Text>
            <View style={styles.leagueList}>
                {leagues.map((league) => {
                    const leagueId = league.league_id || league.PK?.replace('league#', '') || '';
                    const isSelected = selectedLeagueId === leagueId;
                    return (
                        <TouchableOpacity
                            key={leagueId}
                            style={[styles.leagueButton, isSelected && styles.leagueButtonActive]}
                            onPress={() => onLeagueChange(leagueId)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.leagueButtonText, isSelected && styles.leagueButtonTextActive]}>
                                {league.league_name || 'Unnamed League'}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 12,
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
    },
    leagueList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    leagueButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    leagueButtonActive: {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626',
    },
    leagueButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    leagueButtonTextActive: {
        color: '#ffffff',
    },
    loadingText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        paddingVertical: 12,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        paddingVertical: 12,
    },
});





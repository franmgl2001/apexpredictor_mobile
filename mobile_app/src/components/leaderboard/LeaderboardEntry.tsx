import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type LeaderboardEntryData = {
    username: string;
    points: number;
    races: number;
};

interface LeaderboardEntryProps {
    entry: LeaderboardEntryData;
    rank: number;
    showSeparator: boolean;
}

export default function LeaderboardEntry({ entry, rank, showSeparator }: LeaderboardEntryProps) {
    const getRankBadgeStyle = (rank: number) => {
        if (rank === 1) {
            return { backgroundColor: '#fbbf24', color: '#ffffff' }; // yellow-400
        } else if (rank === 2) {
            return { backgroundColor: '#e5e7eb', color: '#111827' }; // gray-200
        } else if (rank === 3) {
            return { backgroundColor: '#fb923c', color: '#ffffff' }; // orange-400
        } else {
            return { backgroundColor: '#e5e7eb', color: '#111827' }; // gray-200
        }
    };

    const badgeStyle = getRankBadgeStyle(rank);

    return (
        <View>
            {showSeparator && <View style={styles.separator} />}
            <View style={styles.entry}>
                <View style={[styles.rankBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
                    <Text style={[styles.rankNumber, { color: badgeStyle.color }]}>{rank}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{entry.username}</Text>
                    <Text style={styles.raceCount}>{entry.races} races</Text>
                </View>
                <View style={styles.pointsContainer}>
                    <Text style={styles.points}>{entry.points}</Text>
                    <Text style={styles.pointsLabel}>points</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    entry: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    rankBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: '700',
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    raceCount: {
        fontSize: 14,
        color: '#6b7280',
    },
    pointsContainer: {
        alignItems: 'flex-end',
    },
    points: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    pointsLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    separator: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginLeft: 52,
    },
});


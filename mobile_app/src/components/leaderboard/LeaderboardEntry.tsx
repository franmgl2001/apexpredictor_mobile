import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type LeaderboardEntryData = {
    username: string;
    points: number;
    races?: number;
    nationality?: string;
    predictions?: string | null;
};

// Country code to flag emoji converter
const getFlagEmoji = (countryCode?: string): string => {
    if (!countryCode || countryCode.length !== 2) return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

interface LeaderboardEntryProps {
    entry: LeaderboardEntryData;
    rank: number;
    showSeparator: boolean;
    onPress?: () => void;
}

export default function LeaderboardEntry({ entry, rank, showSeparator, onPress }: LeaderboardEntryProps) {
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

    const EntryContent = (
        <View style={styles.entry}>
            <View style={[styles.rankBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
                <Text style={[styles.rankNumber, { color: badgeStyle.color }]}>{rank}</Text>
            </View>
            {entry.nationality && (
                <Text style={styles.flag}>{getFlagEmoji(entry.nationality)}</Text>
            )}
            <View style={styles.userInfo}>
                <Text style={[styles.username, entry.races !== undefined && styles.usernameWithSubtext]}>
                    {entry.username}
                </Text>
                {entry.races !== undefined && (
                    <Text style={styles.raceCount}>{entry.races} races</Text>
                )}
            </View>
            <View style={styles.pointsContainer}>
                <Text style={styles.points}>{entry.points}</Text>
                <Text style={styles.pointsLabel}>points</Text>
            </View>
            {onPress && (
                <Text style={styles.chevron}>›</Text>
            )}
        </View>
    );

    return (
        <View>
            {showSeparator && <View style={styles.separator} />}
            {onPress ? (
                <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                    {EntryContent}
                </TouchableOpacity>
            ) : (
                EntryContent
            )}
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
    flag: {
        fontSize: 22,
        marginRight: 10,
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: '700',
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    username: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    usernameWithSubtext: {
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
    chevron: {
        fontSize: 24,
        color: '#9ca3af',
        marginLeft: 8,
        fontWeight: '300',
    },
    separator: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginLeft: 52,
    },
});


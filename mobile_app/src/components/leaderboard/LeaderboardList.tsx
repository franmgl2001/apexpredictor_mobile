import React from 'react';
import { View, StyleSheet } from 'react-native';
import LeaderboardEntry, { LeaderboardEntryData } from './LeaderboardEntry';

interface LeaderboardListProps {
    entries: LeaderboardEntryData[];
}

export default function LeaderboardList({ entries }: LeaderboardListProps) {
    return (
        <View style={styles.listContainer}>
            {entries.map((entry, index) => (
                <LeaderboardEntry
                    key={`${entry.username}-${index}`}
                    entry={entry}
                    rank={index + 1}
                    showSeparator={index > 0}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    listContainer: {
        marginTop: 8,
    },
});


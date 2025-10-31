import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LeaderboardScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Leaderboard</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingBottom: 76,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
    },
});



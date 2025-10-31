import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LeaguesScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Leagues</Text>
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



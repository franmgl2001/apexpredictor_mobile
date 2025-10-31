import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader';

type LeaguesScreenProps = {
    onProfilePress: () => void;
};

export default function LeaguesScreen({ onProfilePress }: LeaguesScreenProps) {
    return (
        <View style={styles.container}>
            <AppHeader onProfilePress={onProfilePress} />
            <View style={styles.content}>
                <Text style={styles.title}>Leagues</Text>
                <Text style={styles.subtitle}>Coming soon...</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
    },
});


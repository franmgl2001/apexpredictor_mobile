import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CountryFlag from './CountryFlag';

export default function RaceHeader({ name, circuit, country, hasSprint }: { name: string; circuit: string; country: string; hasSprint?: boolean }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{name}</Text>
            {hasSprint ? <Text style={styles.sprintPill}>Sprint</Text> : null}
            <View style={styles.locationRow}>
                <Text style={styles.subTitle}>{circuit}, </Text>
                <CountryFlag country={country} />
                <Text style={[styles.subTitle, { marginLeft: 6 }]}>{country}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    sprintPill: {
        alignSelf: 'center',
        marginTop: 8,
        backgroundColor: '#ffedd5',
        color: '#b45309',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: '700',
    },
    title: {
        marginTop: 8,
        fontSize: 30,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
    },
    subTitle: {
        marginTop: 6,
        color: '#4b5563',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    locationRow: {
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});



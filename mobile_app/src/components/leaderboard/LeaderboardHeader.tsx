import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function LeaderboardHeader() {
    return (
        <View style={styles.header}>
            <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                    <Text style={styles.logoIconText}>📈</Text>
                </View>
                <View style={styles.logoText}>
                    <Text style={styles.logoApex}>Apex</Text>
                    <Text style={styles.logoPredictions}>Predictions</Text>
                </View>
                <Text style={styles.logoLarge}>APEX</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
                <View style={styles.profileIcon}>
                    <Text style={styles.profileLetter}>F</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        marginRight: 8,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoIconText: {
        fontSize: 16,
    },
    logoText: {
        marginRight: 8,
    },
    logoApex: {
        fontSize: 16,
        fontWeight: '700',
        color: '#dc2626',
    },
    logoPredictions: {
        fontSize: 10,
        fontWeight: '500',
        color: '#6b7280',
    },
    logoLarge: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileLetter: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
    },
});


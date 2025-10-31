import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TimeBox({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <View style={styles.timeBox}>
            <Text style={[styles.timeValue, highlight ? styles.timeValueHighlight : null]}>{String(value).padStart(2, '0')}</Text>
            <Text style={styles.timeLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    timeBox: {
        alignItems: 'center',
        flex: 1,
    },
    timeValue: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111827',
    },
    timeValueHighlight: {
        color: '#dc2626',
    },
    timeLabel: {
        marginTop: 4,
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
});



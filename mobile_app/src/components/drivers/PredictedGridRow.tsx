import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type DriverSummary = {
    id: string;
    name: string;
    team: string;
    number: number;
    teamColor?: string;
};

export default function PredictedGridRow({ position, driver, onPress, disabled }: { position: number; driver?: DriverSummary | null; onPress: () => void; disabled?: boolean }) {
    const positionBg = position === 1 ? '#f59e0b' : position === 2 ? '#9ca3af' : position === 3 ? '#fb923c' : '#e5e7eb';
    const positionColor = position <= 3 ? '#ffffff' : '#6b7280';

    return (
        <TouchableOpacity onPress={disabled ? undefined : onPress} style={[styles.row, disabled && styles.rowDisabled]} activeOpacity={disabled ? 1 : 0.8} disabled={disabled}>
            <View style={[styles.positionCircle, { backgroundColor: positionBg }]}>
                <Text style={[styles.positionText, { color: positionColor }]}>{position}</Text>
            </View>
            <View style={styles.driverWrap}>
                {driver ? (
                    <View style={styles.driverInfo}>
                        <View style={styles.driverNameRow}>
                            <Text style={styles.driverName}>{driver.name}</Text>
                            <View style={[styles.teamDot, { backgroundColor: driver.teamColor || '#9ca3af' }]} />
                            <Text style={styles.driverNumber}>#{driver.number}</Text>
                        </View>
                        <Text style={styles.driverTeam}>{driver.team}</Text>
                    </View>
                ) : (
                    <Text style={styles.placeholder}>Select Driver</Text>
                )}
            </View>
            <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#e5e7eb',
        backgroundColor: '#fafafa',
        marginBottom: 12,
    },
    positionCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    positionText: {
        fontWeight: '800',
    },
    driverWrap: {
        flex: 1,
    },
    placeholder: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '700',
    },
    driverInfo: {
        flexDirection: 'column',
        justifyContent: 'center',
    },
    driverNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    teamDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 8,
        marginRight: 6,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    driverNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    driverTeam: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    chevron: {
        color: '#9ca3af',
        fontSize: 24,
        marginLeft: 8,
    },
    rowDisabled: {
        opacity: 0.6,
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
    },
});



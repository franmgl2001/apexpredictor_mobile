import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { DriverSummary } from './PredictedGridRow';

export default function DriverPickRow({
    left,
    sublabel,
    driver,
    rightAddon,
    onPress,
    disabled,
}: {
    left: React.ReactNode;
    sublabel?: string;
    driver?: DriverSummary | null;
    rightAddon?: React.ReactNode;
    onPress: () => void;
    disabled?: boolean;
}) {
    return (
        <TouchableOpacity onPress={disabled ? undefined : onPress} style={[styles.row, disabled && styles.rowDisabled]} activeOpacity={disabled ? 1 : 0.8} disabled={disabled}>
            <View style={styles.leftWrap}>
                {left}
                {!!sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
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
            {!!rightAddon && <View style={{ marginRight: 8 }}>{rightAddon}</View>}
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
    leftWrap: {
        width: 56,
        alignItems: 'center',
        marginRight: 12,
    },
    sublabel: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 6,
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



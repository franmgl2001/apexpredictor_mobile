import React, { useMemo } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useData, Driver as ContextDriver } from '../../contexts/DataContext';

type PredictionData = {
    gridOrder: Array<{ position: number; driverNumber: number | null }>;
    sprintPositions: Array<any>;
    additionalPredictions: {
        pole?: number | null;
        fastestLap?: number | null;
        positionsGained?: number | null;
    };
};

type Driver = {
    number: number;
    name: string;
    team: string;
    teamColor?: string;
};

interface PredictionsModalProps {
    visible: boolean;
    onClose: () => void;
    username: string;
    predictionsJson: string | null;
}

function getDriverByNumber(drivers: Driver[], number: number | null): Driver | null {
    if (number === null || number === undefined) return null;
    // Ensure we compare numbers correctly (handle string to number conversions)
    const numValue = typeof number === 'number' ? number : Number(number);
    if (isNaN(numValue)) return null;
    return drivers.find((d) => d.number === numValue) || null;
}

export default function PredictionsModal({ visible, onClose, username, predictionsJson }: PredictionsModalProps) {
    const { drivers: contextDrivers } = useData();
    // Map context drivers to the format expected by this component
    const drivers = useMemo(() => {
        return contextDrivers.map((d: ContextDriver) => ({
            number: d.number,
            name: d.name,
            team: d.team,
            teamColor: d.teamColor,
        }));
    }, [contextDrivers]);

    const predictions: PredictionData | null = useMemo(() => {
        if (!predictionsJson) {
            console.log('[PredictionsModal] No predictionsJson provided');
            return null;
        }
        try {
            const parsed = JSON.parse(predictionsJson);
            console.log('[PredictionsModal] Parsed predictions successfully:', {
                hasGridOrder: !!parsed.gridOrder,
                gridOrderLength: parsed.gridOrder?.length || 0,
                hasAdditional: !!parsed.additionalPredictions,
                hasSprint: !!parsed.sprintPositions && parsed.sprintPositions.length > 0,
            });
            return parsed;
        } catch (error) {
            console.error('[PredictionsModal] Error parsing predictions JSON:', error);
            console.error('[PredictionsModal] Raw predictionsJson:', predictionsJson);
            return null;
        }
    }, [predictionsJson]);

    const getDriverName = (driverNumber: number | null): string => {
        if (driverNumber === null) return 'Not selected';
        const driver = getDriverByNumber(drivers, driverNumber);
        return driver ? `${driver.name} (#${driver.number})` : `Driver #${driverNumber}`;
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{username}'s Predictions</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.close}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}
                    >
                        {predictions ? (
                            <>
                                {/* Grid Order */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Predicted Grid Order</Text>
                                    {predictions.gridOrder.map((item) => {
                                        const driver = getDriverByNumber(drivers, item.driverNumber);
                                        return (
                                            <View key={item.position} style={styles.gridRow}>
                                                <View
                                                    style={[
                                                        styles.positionBadge,
                                                        {
                                                            backgroundColor:
                                                                item.position === 1
                                                                    ? '#fbbf24'
                                                                    : item.position === 2
                                                                        ? '#e5e7eb'
                                                                        : item.position === 3
                                                                            ? '#fb923c'
                                                                            : '#e5e7eb',
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.positionText,
                                                            {
                                                                color:
                                                                    item.position <= 3 ? '#ffffff' : '#111827',
                                                            },
                                                        ]}
                                                    >
                                                        {item.position}
                                                    </Text>
                                                </View>
                                                {driver ? (
                                                    <View style={styles.driverInfo}>
                                                        <View style={styles.driverNameRow}>
                                                            <Text style={styles.driverName}>{driver.name}</Text>
                                                            {driver.teamColor && (
                                                                <View
                                                                    style={[
                                                                        styles.teamDot,
                                                                        { backgroundColor: driver.teamColor },
                                                                    ]}
                                                                />
                                                            )}
                                                            <Text style={styles.driverNumber}>#{driver.number}</Text>
                                                        </View>
                                                        <Text style={styles.driverTeam}>{driver.team}</Text>
                                                    </View>
                                                ) : (
                                                    <Text style={styles.placeholder}>
                                                        {item.driverNumber
                                                            ? `Driver #${item.driverNumber}`
                                                            : 'Not selected'}
                                                    </Text>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* Sprint Positions */}
                                {predictions.sprintPositions && predictions.sprintPositions.length > 0 && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Sprint Positions</Text>
                                        {predictions.sprintPositions.map((item: any, idx: number) => {
                                            const driver = getDriverByNumber(drivers, item.driverNumber);
                                            return (
                                                <View key={idx} style={styles.gridRow}>
                                                    <View style={[styles.positionBadge, { backgroundColor: '#e5e7eb' }]}>
                                                        <Text style={[styles.positionText, { color: '#111827' }]}>
                                                            {item.position}
                                                        </Text>
                                                    </View>
                                                    {driver ? (
                                                        <View style={styles.driverInfo}>
                                                            <View style={styles.driverNameRow}>
                                                                <Text style={styles.driverName}>{driver.name}</Text>
                                                                {driver.teamColor && (
                                                                    <View
                                                                        style={[
                                                                            styles.teamDot,
                                                                            { backgroundColor: driver.teamColor },
                                                                        ]}
                                                                    />
                                                                )}
                                                                <Text style={styles.driverNumber}>#{driver.number}</Text>
                                                            </View>
                                                            <Text style={styles.driverTeam}>{driver.team}</Text>
                                                        </View>
                                                    ) : (
                                                        <Text style={styles.placeholder}>
                                                            {item.driverNumber ? `Driver #${item.driverNumber}` : 'Not selected'}
                                                        </Text>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}

                                {/* Additional Predictions */}
                                {predictions.additionalPredictions && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>ADDITIONAL PREDICTIONS</Text>
                                        {predictions.additionalPredictions.pole !== null &&
                                            predictions.additionalPredictions.pole !== undefined && (
                                                <View style={styles.gridRow}>
                                                    <View style={styles.additionalLabelBadge}>
                                                        <Text style={styles.additionalEmoji}>🏁</Text>
                                                        <Text style={styles.additionalLabelText}>POLE</Text>
                                                    </View>
                                                    {(() => {
                                                        const driver = getDriverByNumber(
                                                            drivers,
                                                            predictions.additionalPredictions.pole
                                                        );
                                                        return driver ? (
                                                            <View style={styles.driverInfo}>
                                                                <View style={styles.driverNameRow}>
                                                                    <Text style={styles.driverName}>{driver.name}</Text>
                                                                    {driver.teamColor && (
                                                                        <View
                                                                            style={[
                                                                                styles.teamDot,
                                                                                { backgroundColor: driver.teamColor },
                                                                            ]}
                                                                        />
                                                                    )}
                                                                    <Text style={styles.driverNumber}>#{driver.number}</Text>
                                                                </View>
                                                                <Text style={styles.driverTeam}>{driver.team}</Text>
                                                            </View>
                                                        ) : (
                                                            <Text style={styles.placeholder}>
                                                                {getDriverName(predictions.additionalPredictions.pole)}
                                                            </Text>
                                                        );
                                                    })()}
                                                </View>
                                            )}
                                        {predictions.additionalPredictions.fastestLap !== null &&
                                            predictions.additionalPredictions.fastestLap !== undefined && (
                                                <View style={styles.gridRow}>
                                                    <View style={styles.additionalLabelBadge}>
                                                        <Text style={styles.additionalEmoji}>⚡</Text>
                                                        <Text style={styles.additionalLabelText}>FAST</Text>
                                                    </View>
                                                    {(() => {
                                                        const driver = getDriverByNumber(
                                                            drivers,
                                                            predictions.additionalPredictions.fastestLap
                                                        );
                                                        return driver ? (
                                                            <View style={styles.driverInfo}>
                                                                <View style={styles.driverNameRow}>
                                                                    <Text style={styles.driverName}>{driver.name}</Text>
                                                                    {driver.teamColor && (
                                                                        <View
                                                                            style={[
                                                                                styles.teamDot,
                                                                                { backgroundColor: driver.teamColor },
                                                                            ]}
                                                                        />
                                                                    )}
                                                                    <Text style={styles.driverNumber}>#{driver.number}</Text>
                                                                </View>
                                                                <Text style={styles.driverTeam}>{driver.team}</Text>
                                                            </View>
                                                        ) : (
                                                            <Text style={styles.placeholder}>
                                                                {getDriverName(predictions.additionalPredictions.fastestLap)}
                                                            </Text>
                                                        );
                                                    })()}
                                                </View>
                                            )}
                                        {predictions.additionalPredictions.positionsGained !== null &&
                                            predictions.additionalPredictions.positionsGained !== undefined && (
                                                <View style={styles.gridRow}>
                                                    <View style={styles.additionalLabelBadge}>
                                                        <Text style={styles.additionalEmoji}>📈</Text>
                                                        <Text style={styles.additionalLabelText}>MOST</Text>
                                                    </View>
                                                    {(() => {
                                                        const driver = getDriverByNumber(
                                                            drivers,
                                                            predictions.additionalPredictions.positionsGained
                                                        );
                                                        return driver ? (
                                                            <View style={styles.driverInfo}>
                                                                <View style={styles.driverNameRow}>
                                                                    <Text style={styles.driverName}>{driver.name}</Text>
                                                                    {driver.teamColor && (
                                                                        <View
                                                                            style={[
                                                                                styles.teamDot,
                                                                                { backgroundColor: driver.teamColor },
                                                                            ]}
                                                                        />
                                                                    )}
                                                                    <Text style={styles.driverNumber}>#{driver.number}</Text>
                                                                </View>
                                                                <Text style={styles.driverTeam}>{driver.team}</Text>
                                                            </View>
                                                        ) : (
                                                            <Text style={styles.placeholder}>
                                                                {getDriverName(predictions.additionalPredictions.positionsGained)}
                                                            </Text>
                                                        );
                                                    })()}
                                                </View>
                                            )}
                                    </View>
                                )}
                            </>
                        ) : (
                            <Text style={styles.emptyText}>No predictions available</Text>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '90%',
        minHeight: 300, // Ensure minimum height so content is visible
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    close: {
        color: '#6b7280',
        fontWeight: '700',
        fontSize: 16,
    },
    content: {
        flexGrow: 1,
    },
    contentContainer: {
        paddingBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    gridRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    positionBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    positionText: {
        fontSize: 14,
        fontWeight: '700',
    },
    driverInfo: {
        flex: 1,
    },
    driverNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginRight: 6,
    },
    teamDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6,
    },
    driverNumber: {
        fontSize: 14,
        color: '#6b7280',
    },
    driverTeam: {
        fontSize: 14,
        color: '#6b7280',
    },
    placeholder: {
        fontSize: 14,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    additionalLabelBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    additionalEmoji: {
        fontSize: 14,
        marginBottom: 1,
    },
    additionalLabelText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#111827',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        lineHeight: 10,
    },
    additionalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    additionalLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4b5563',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        minWidth: 120,
    },
    additionalValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginRight: 8,
    },
    additionalValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    additionalDriverNumber: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6b7280',
    },
    emptyText: {
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 16,
        paddingVertical: 24,
    },
});


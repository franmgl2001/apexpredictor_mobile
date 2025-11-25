import React, { useMemo, useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useData, Driver as ContextDriver } from '../../contexts/DataContext';
import { getRaceResults, ApexEntity } from '../../services/graphql';
import { calculateDriverPoints, calculateBonusPoints, type RaceResultsData, type PredictionData as PointsPredictionData, type BonusPoints } from '../../utils/pointsCalculator';

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
    raceId: string | null;
}

function getDriverByNumber(drivers: Driver[], number: number | null): Driver | null {
    if (number === null || number === undefined) return null;
    // Ensure we compare numbers correctly (handle string to number conversions)
    const numValue = typeof number === 'number' ? number : Number(number);
    if (isNaN(numValue)) return null;
    return drivers.find((d) => d.number === numValue) || null;
}

export default function PredictionsModal({ visible, onClose, username, predictionsJson, raceId }: PredictionsModalProps) {
    const { drivers: contextDrivers, races } = useData();
    const [raceResults, setRaceResults] = useState<RaceResultsData | null>(null);
    const [pointsData, setPointsData] = useState<Map<number, { points: number; breakdown: any }>>(new Map());
    const [totalPoints, setTotalPoints] = useState<number>(0);
    const [bonusPoints, setBonusPoints] = useState<BonusPoints | null>(null);
    const [isLoadingResults, setIsLoadingResults] = useState(false);

    // Map context drivers to the format expected by this component
    const drivers = useMemo(() => {
        return contextDrivers.map((d: ContextDriver) => ({
            number: d.number,
            name: d.name,
            team: d.team,
            teamColor: d.teamColor,
        }));
    }, [contextDrivers]);

    // Get hasSprint from race data
    const hasSprint = useMemo(() => {
        if (!raceId) return false;
        const race = races.find((r) => r.race_id === raceId);
        return race?.has_sprint || false;
    }, [raceId, races]);

    // Parse predictions JSON
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

    // Fetch race results when modal opens and raceId is available
    useEffect(() => {
        if (!visible || !raceId) {
            setRaceResults(null);
            setPointsData(new Map());
            setTotalPoints(0);
            setBonusPoints(null);
            return;
        }

        const fetchResults = async () => {
            setIsLoadingResults(true);
            try {
                const allResults = await getRaceResults();
                // Find the result for this specific race
                const raceResult = allResults.find((result: ApexEntity) => {
                    const resultRaceId = result.race_id || (result.PK?.startsWith('race#') ? result.PK.replace('race#', '') : null);
                    return resultRaceId === raceId;
                });

                if (!raceResult) {
                    console.log('[PredictionsModal] No race results found for raceId:', raceId);
                    setRaceResults(null);
                    return;
                }

                if (!raceResult.results) {
                    console.warn(`[PredictionsModal] Race result missing results field for raceId: ${raceId}`);
                    setRaceResults(null);
                    return;
                }

                try {
                    // Handle case where results might be a string or already an object
                    let parsedResults: RaceResultsData;
                    if (typeof raceResult.results === 'string') {
                        parsedResults = JSON.parse(raceResult.results) as RaceResultsData;
                    } else if (typeof raceResult.results === 'object' && raceResult.results !== null) {
                        // Already parsed
                        parsedResults = raceResult.results as RaceResultsData;
                    } else {
                        console.error(`[PredictionsModal] Race results is not a valid format for raceId: ${raceId}`, typeof raceResult.results);
                        setRaceResults(null);
                        return;
                    }

                    // Validate parsed results structure
                    if (!parsedResults || typeof parsedResults !== 'object') {
                        console.error(`[PredictionsModal] Parsed results is not an object for raceId: ${raceId}`, parsedResults);
                        setRaceResults(null);
                        return;
                    }

                    setRaceResults(parsedResults);
                } catch (error) {
                    console.error('[PredictionsModal] Error parsing race results JSON:', error);
                    console.error('[PredictionsModal] Raw results (first 200 chars):', 
                        typeof raceResult.results === 'string' ? raceResult.results.substring(0, 200) : raceResult.results
                    );
                    setRaceResults(null);
                }
            } catch (error) {
                console.error('[PredictionsModal] Error fetching race results:', error);
                setRaceResults(null);
            } finally {
                setIsLoadingResults(false);
            }
        };

        fetchResults();
    }, [visible, raceId]);

    // Calculate points when predictions and race results are available
    useEffect(() => {
        if (!predictions || !raceResults) {
            setPointsData(new Map());
            setTotalPoints(0);
            setBonusPoints(null);
            return;
        }

        try {
            // Convert predictions to PointsPredictionData format
            const predictionsForPoints: PointsPredictionData = {
                gridOrder: predictions.gridOrder,
                sprintPositions: predictions.sprintPositions || [],
                additionalPredictions: predictions.additionalPredictions || {},
            };

            const driverPointsMap = calculateDriverPoints(predictionsForPoints, raceResults, hasSprint);

            // Calculate bonus points
            const bonus = calculateBonusPoints(predictionsForPoints, raceResults);
            setBonusPoints(bonus);

            // Calculate total points (driver points + bonus points)
            let total = 0;
            driverPointsMap.forEach((driverPoints) => {
                total += driverPoints.points;
            });
            total += bonus.total;

            // Store points data
            const pointsMap = new Map<number, { points: number; breakdown: any }>();
            driverPointsMap.forEach((driverPoints, driverNumber) => {
                pointsMap.set(driverNumber, {
                    points: driverPoints.points,
                    breakdown: driverPoints.breakdown,
                });
            });

            setPointsData(pointsMap);
            setTotalPoints(total);
        } catch (error) {
            console.error('[PredictionsModal] Error calculating points:', error);
            setPointsData(new Map());
            setTotalPoints(0);
            setBonusPoints(null);
        }
    }, [predictions, raceResults, hasSprint]);

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
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>{username}'s Predictions</Text>
                            {totalPoints > 0 && (
                                <View style={styles.totalPointsContainer}>
                                    <Text style={styles.totalPointsLabel}>Total Points:</Text>
                                    <Text style={styles.totalPointsValue}>{totalPoints}</Text>
                                </View>
                            )}
                        </View>
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
                                        const driverPoints = item.driverNumber ? pointsData.get(item.driverNumber) : null;
                                        const gridPoints = driverPoints?.breakdown?.gridPosition || 0;
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
                                                {gridPoints > 0 && (
                                                    <View style={styles.pointsBadge}>
                                                        <Text style={styles.pointsText}>+{gridPoints}</Text>
                                                    </View>
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
                                            const driverPoints = item.driverNumber ? pointsData.get(item.driverNumber) : null;
                                            const sprintPoints = driverPoints?.breakdown?.sprintPosition || 0;
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
                                                    {sprintPoints > 0 && (
                                                        <View style={styles.pointsBadge}>
                                                            <Text style={styles.pointsText}>+{sprintPoints}</Text>
                                                        </View>
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
                                                        const driverPoints = predictions.additionalPredictions.pole
                                                            ? pointsData.get(predictions.additionalPredictions.pole)
                                                            : null;
                                                        const polePoints = driverPoints?.breakdown?.pole || 0;
                                                        return driver ? (
                                                            <>
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
                                                                {polePoints > 0 && (
                                                                    <View style={styles.pointsBadge}>
                                                                        <Text style={styles.pointsText}>+{polePoints}</Text>
                                                                    </View>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Text style={styles.placeholder}>
                                                                    {getDriverName(predictions.additionalPredictions.pole)}
                                                                </Text>
                                                                {polePoints > 0 && (
                                                                    <View style={styles.pointsBadge}>
                                                                        <Text style={styles.pointsText}>+{polePoints}</Text>
                                                                    </View>
                                                                )}
                                                            </>
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
                                                        const driverPoints = predictions.additionalPredictions.fastestLap
                                                            ? pointsData.get(predictions.additionalPredictions.fastestLap)
                                                            : null;
                                                        const fastestLapPoints = driverPoints?.breakdown?.fastestLap || 0;
                                                        return driver ? (
                                                            <>
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
                                                                {fastestLapPoints > 0 && (
                                                                    <View style={styles.pointsBadge}>
                                                                        <Text style={styles.pointsText}>+{fastestLapPoints}</Text>
                                                                    </View>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Text style={styles.placeholder}>
                                                                    {getDriverName(predictions.additionalPredictions.fastestLap)}
                                                                </Text>
                                                                {fastestLapPoints > 0 && (
                                                                    <View style={styles.pointsBadge}>
                                                                        <Text style={styles.pointsText}>+{fastestLapPoints}</Text>
                                                                    </View>
                                                                )}
                                                            </>
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
                                                        const driverPoints = predictions.additionalPredictions.positionsGained
                                                            ? pointsData.get(predictions.additionalPredictions.positionsGained)
                                                            : null;
                                                        const positionsGainedPoints = driverPoints?.breakdown?.positionsGained || 0;
                                                        return driver ? (
                                                            <>
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
                                                                {positionsGainedPoints > 0 && (
                                                                    <View style={styles.pointsBadge}>
                                                                        <Text style={styles.pointsText}>+{positionsGainedPoints}</Text>
                                                                    </View>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Text style={styles.placeholder}>
                                                                    {getDriverName(predictions.additionalPredictions.positionsGained)}
                                                                </Text>
                                                                {positionsGainedPoints > 0 && (
                                                                    <View style={styles.pointsBadge}>
                                                                        <Text style={styles.pointsText}>+{positionsGainedPoints}</Text>
                                                                    </View>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </View>
                                            )}
                                    </View>
                                )}

                                {/* Bonus Points */}
                                {bonusPoints && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>BONUS POINTS</Text>

                                        {/* Winner Bonus */}
                                        <View style={[
                                            styles.gridRow,
                                            !bonusPoints.winner.earned && styles.gridRowLocked
                                        ]}>
                                            <View style={styles.additionalLabelBadge}>
                                                <Text style={styles.additionalEmoji}>🏆</Text>
                                                <Text style={styles.additionalLabelText}>WIN</Text>
                                                {!bonusPoints.winner.earned && (
                                                    <Text style={styles.lockIconOverlay}>🔒</Text>
                                                )}
                                            </View>
                                            <View style={styles.bonusInfo}>
                                                <Text style={[
                                                    styles.bonusLabel,
                                                    !bonusPoints.winner.earned && styles.bonusLabelLocked
                                                ]}>Winner prediction</Text>
                                                <Text style={[
                                                    styles.bonusPointsText,
                                                    !bonusPoints.winner.earned && styles.bonusPointsTextLocked
                                                ]}>+10 points</Text>
                                            </View>
                                            {bonusPoints.winner.earned && (
                                                <View style={styles.pointsBadge}>
                                                    <Text style={styles.pointsText}>+{bonusPoints.winner.points}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Podium Bonus */}
                                        <View style={[
                                            styles.gridRow,
                                            !bonusPoints.podium.earned && styles.gridRowLocked
                                        ]}>
                                            <View style={styles.additionalLabelBadge}>
                                                <Text style={styles.additionalEmoji}>🥇</Text>
                                                <Text style={styles.additionalLabelText}>POD</Text>
                                                {!bonusPoints.podium.earned && (
                                                    <Text style={styles.lockIconOverlay}>🔒</Text>
                                                )}
                                            </View>
                                            <View style={styles.bonusInfo}>
                                                <Text style={[
                                                    styles.bonusLabel,
                                                    !bonusPoints.podium.earned && styles.bonusLabelLocked
                                                ]}>Podium prediction (top 3)</Text>
                                                <Text style={[
                                                    styles.bonusPointsText,
                                                    !bonusPoints.podium.earned && styles.bonusPointsTextLocked
                                                ]}>+30 points</Text>
                                            </View>
                                            {bonusPoints.podium.earned && (
                                                <View style={styles.pointsBadge}>
                                                    <Text style={styles.pointsText}>+{bonusPoints.podium.points}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Top 6 Bonus */}
                                        <View style={[
                                            styles.gridRow,
                                            !bonusPoints.top6.earned && styles.gridRowLocked
                                        ]}>
                                            <View style={styles.additionalLabelBadge}>
                                                <Text style={styles.additionalEmoji}>🎯</Text>
                                                <Text style={styles.additionalLabelText}>TOP6</Text>
                                                {!bonusPoints.top6.earned && (
                                                    <Text style={styles.lockIconOverlay}>🔒</Text>
                                                )}
                                            </View>
                                            <View style={styles.bonusInfo}>
                                                <Text style={[
                                                    styles.bonusLabel,
                                                    !bonusPoints.top6.earned && styles.bonusLabelLocked
                                                ]}>6 predictions correct</Text>
                                                <Text style={[
                                                    styles.bonusPointsText,
                                                    !bonusPoints.top6.earned && styles.bonusPointsTextLocked
                                                ]}>+60 points</Text>
                                            </View>
                                            {bonusPoints.top6.earned && (
                                                <View style={styles.pointsBadge}>
                                                    <Text style={styles.pointsText}>+{bonusPoints.top6.points}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* All Correct Bonus */}
                                        <View style={[
                                            styles.gridRow,
                                            !bonusPoints.allCorrect.earned && styles.gridRowLocked
                                        ]}>
                                            <View style={styles.additionalLabelBadge}>
                                                <Text style={styles.additionalEmoji}>💯</Text>
                                                <Text style={styles.additionalLabelText}>ALL</Text>
                                                {!bonusPoints.allCorrect.earned && (
                                                    <Text style={styles.lockIconOverlay}>🔒</Text>
                                                )}
                                            </View>
                                            <View style={styles.bonusInfo}>
                                                <Text style={[
                                                    styles.bonusLabel,
                                                    !bonusPoints.allCorrect.earned && styles.bonusLabelLocked
                                                ]}>All drivers correct</Text>
                                                <Text style={[
                                                    styles.bonusPointsText,
                                                    !bonusPoints.allCorrect.earned && styles.bonusPointsTextLocked
                                                ]}>+100 points</Text>
                                            </View>
                                            {bonusPoints.allCorrect.earned && (
                                                <View style={styles.pointsBadge}>
                                                    <Text style={styles.pointsText}>+{bonusPoints.allCorrect.points}</Text>
                                                </View>
                                            )}
                                        </View>
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
    gridRowLocked: {
        opacity: 0.5,
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
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        position: 'relative',
    },
    lockIconOverlay: {
        position: 'absolute',
        fontSize: 12,
        top: -4,
        right: -4,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 2,
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
    titleContainer: {
        flex: 1,
    },
    totalPointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    totalPointsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginRight: 6,
    },
    totalPointsValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#dc2626',
    },
    pointsBadge: {
        backgroundColor: '#10b981',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    pointsText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
    },
    bonusInfo: {
        flex: 1,
    },
    bonusLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    bonusLabelLocked: {
        color: '#9ca3af',
    },
    bonusPointsText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
    },
    bonusPointsTextLocked: {
        color: '#9ca3af',
    },
});


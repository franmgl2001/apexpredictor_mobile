import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PredictedGridSelector, { GridSelection } from '../drivers/PredictedGridSelector';
import TimeBox from './TimeBox';
import PredictedGridRow, { DriverSummary } from '../drivers/PredictedGridRow';
import DriverPickerModal, { Driver } from '../drivers/DriverPickerModal';
import DriverPickRow from '../drivers/DriverPickRow';
import { getUserPredictions } from '../../services/graphql';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { calculateDriverPoints, calculateBonusPoints, type PredictionData as PointsPredictionData } from '../../utils/pointsCalculator';

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

type RacePredictions = {
    grid: GridSelection;
    sprintPodium: Array<DriverSummary | null>;
    pole: DriverSummary | null;
    fastest: DriverSummary | null;
    most: DriverSummary | null;
};

type ApiPredictionsData = {
    gridOrder: Array<{ position: number; driverNumber: number | null }>;
    sprintPositions: Array<{ position?: number; driverNumber: number | null }>;
    additionalPredictions: {
        pole?: number | null;
        fastestLap?: number | null;
        positionsGained?: number | null;
    };
};

export default function PredictionsSection({ raceId, timeLeft, isClosed, hasSprint, onPredictionsChange, predictionsByRaceId }: { raceId: string; timeLeft: TimeLeft; isClosed: boolean; hasSprint?: boolean; onPredictionsChange?: (predictions: string | null) => void; predictionsByRaceId?: Map<string, any> }) {
    const { user } = useAuth();
    const { drivers, raceResultsByRaceId } = useData();

    // Store predictions per race
    const [predictionsByRace, setPredictionsByRace] = useState<Map<string, RacePredictions>>(() => new Map());
    const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);

    // Get current race predictions or initialize empty
    function getRacePredictions(racePredictions: Map<string, RacePredictions>): RacePredictions {
        const existing = racePredictions.get(raceId);
        if (existing) return existing;
        return {
            grid: new Array(10).fill(null),
            sprintPodium: new Array(3).fill(null),
            pole: null,
            fastest: null,
            most: null,
        };
    }

    // Local state for current race
    const [grid, setGrid] = useState<GridSelection>(() => {
        const current = getRacePredictions(predictionsByRace);
        return current.grid;
    });
    const [sprintPodium, setSprintPodium] = useState<Array<DriverSummary | null>>(() => {
        const current = getRacePredictions(predictionsByRace);
        return current.sprintPodium;
    });
    const [pole, setPole] = useState<DriverSummary | null>(() => {
        const current = getRacePredictions(predictionsByRace);
        return current.pole;
    });
    const [fastest, setFastest] = useState<DriverSummary | null>(() => {
        const current = getRacePredictions(predictionsByRace);
        return current.fastest;
    });
    const [most, setMost] = useState<DriverSummary | null>(() => {
        const current = getRacePredictions(predictionsByRace);
        return current.most;
    });

    const [openSprintFor, setOpenSprintFor] = useState<number | null>(null);
    const [openPickerFor, setOpenPickerFor] = useState<'pole' | 'fastest' | 'most' | null>(null);

    // Points calculation state
    const [totalPoints, setTotalPoints] = useState<number>(0);
    const [bonusPoints, setBonusPoints] = useState<{ total: number; earned: boolean }>({ total: 0, earned: false });
    const [driverPointsMap, setDriverPointsMap] = useState<Map<number, { points: number; breakdown: any }>>(new Map());

    // Fetch predictions from GraphQL when race changes
    useEffect(() => {
        if (!user?.userId || !raceId) {
            // Reset to empty if no user or raceId
            const empty = {
                grid: new Array(10).fill(null),
                sprintPodium: new Array(3).fill(null),
                pole: null,
                fastest: null,
                most: null,
            };
            setGrid(empty.grid);
            setSprintPodium(empty.sprintPodium);
            setPole(empty.pole);
            setFastest(empty.fastest);
            setMost(empty.most);
            return;
        }

        // Helper to get driver by number
        const getDriverByNumber = (driverNumber: number | null): DriverSummary | null => {
            if (driverNumber === null || driverNumber === undefined) return null;
            const driver = drivers.find((d) => d.number === driverNumber);
            if (!driver) return null;
            return {
                id: driver.id,
                name: driver.name,
                team: driver.team,
                number: driver.number,
                teamColor: driver.teamColor,
            };
        };

        // Convert API predictions format to component format
        const convertApiPredictionsToRacePredictions = (apiData: ApiPredictionsData | null): RacePredictions => {
            if (!apiData) {
                return {
                    grid: new Array(10).fill(null),
                    sprintPodium: new Array(3).fill(null),
                    pole: null,
                    fastest: null,
                    most: null,
                };
            }

            // Convert gridOrder to grid array
            const grid: GridSelection = new Array(10).fill(null);
            if (apiData.gridOrder) {
                apiData.gridOrder.forEach((item) => {
                    const positionIndex = item.position - 1; // Convert 1-based to 0-based
                    if (positionIndex >= 0 && positionIndex < 10) {
                        grid[positionIndex] = getDriverByNumber(item.driverNumber);
                    }
                });
            }

            // Convert sprintPositions to sprintPodium array
            const sprintPodium: Array<DriverSummary | null> = new Array(3).fill(null);
            if (apiData.sprintPositions && Array.isArray(apiData.sprintPositions)) {
                apiData.sprintPositions.forEach((item, idx) => {
                    if (idx < 3) {
                        sprintPodium[idx] = getDriverByNumber(item.driverNumber);
                    }
                });
            }

            // Convert additional predictions
            const additional = apiData.additionalPredictions || {};
            const pole = getDriverByNumber(additional.pole ?? null);
            const fastest = getDriverByNumber(additional.fastestLap ?? null);
            const most = getDriverByNumber(additional.positionsGained ?? null);

            return {
                grid,
                sprintPodium,
                pole,
                fastest,
                most,
            };
        };

        const fetchPredictions = async () => {
            setIsLoadingPredictions(true);

            // Helper to set empty state
            const setEmptyState = () => {
                const empty = {
                    grid: new Array(10).fill(null),
                    sprintPodium: new Array(3).fill(null),
                    pole: null,
                    fastest: null,
                    most: null,
                };
                setGrid(empty.grid);
                setSprintPodium(empty.sprintPodium);
                setPole(empty.pole);
                setFastest(empty.fastest);
                setMost(empty.most);
            };

            try {
                // Use pre-fetched predictions if available, otherwise fetch individually
                let predictionEntity: any = null;
                
                // If predictionsByRaceId is provided, use it exclusively - don't make individual requests
                // This means predictions are being loaded centrally (e.g., in MyTeamScreen)
                if (predictionsByRaceId !== undefined) {
                    // Check if prediction exists in the map
                    if (predictionsByRaceId.has(raceId)) {
                        predictionEntity = predictionsByRaceId.get(raceId);
                        // If null, it means no prediction exists (expected case)
                        if (!predictionEntity) {
                            setEmptyState();
                            return;
                        }
                    } else {
                        // RaceId not in map - no prediction exists for this race
                        // Don't make individual request, just set empty state
                        setEmptyState();
                        return;
                    }
                } else {
                    // predictionsByRaceId is undefined - this is another screen, fetch individually
                    predictionEntity = await getUserPredictions(user.userId, raceId);
                }

                // No entity returned - predictions don't exist yet (normal case)
                if (!predictionEntity) {
                    setEmptyState();
                    return;
                }

                // Entity exists but predictions field is null/empty (normal case)
                if (!predictionEntity.predictions || predictionEntity.predictions.trim() === '') {
                    setEmptyState();
                    return;
                }

                // Try to parse and load predictions
                try {
                    const apiData: ApiPredictionsData = JSON.parse(predictionEntity.predictions);
                    const racePredictions = convertApiPredictionsToRacePredictions(apiData);

                    // Update local state
                    setGrid(racePredictions.grid);
                    setSprintPodium(racePredictions.sprintPodium);
                    setPole(racePredictions.pole);
                    setFastest(racePredictions.fastest);
                    setMost(racePredictions.most);

                    // Store in predictionsByRace
                    setPredictionsByRace((prev) => {
                        const next = new Map(prev);
                        next.set(raceId, racePredictions);
                        return next;
                    });
                } catch (parseError) {
                    // JSON parsing failed - log as error but use empty state
                    console.error('Error parsing predictions JSON:', parseError);
                    setEmptyState();
                }
            } catch (error: any) {
                // Only log real errors (network, GraphQL query failures, etc.)
                // Don't log if it's just that entity doesn't exist (null response)
                const errorMessage = String(error?.message || error || '');
                const errorString = JSON.stringify(error || '');

                // Check if this is just a "not found" or "null" response
                const isExpectedCase =
                    errorMessage.includes('not found') ||
                    errorMessage.includes('does not exist') ||
                    errorMessage.includes('null') ||
                    errorString.includes('null') ||
                    error === null ||
                    error === undefined ||
                    (error && typeof error === 'object' && error.data && !error.errors);

                if (!isExpectedCase) {
                    // This is a real error worth logging
                    console.error('Error fetching predictions:', error);
                }

                // Always set empty state on any error
                setEmptyState();
            } finally {
                setIsLoadingPredictions(false);
            }
        };

        fetchPredictions();

        // Close any open modals when switching races
        setOpenSprintFor(null);
        setOpenPickerFor(null);
    }, [raceId, user?.userId, drivers, predictionsByRaceId]);

    // Close modals when race becomes closed
    useEffect(() => {
        if (isClosed) {
            setOpenSprintFor(null);
            setOpenPickerFor(null);
        }
    }, [isClosed]);

    // Save predictions when they change
    useEffect(() => {
        const racePredictions = {
            grid,
            sprintPodium,
            pole,
            fastest,
            most,
        };
        setPredictionsByRace((prev) => {
            const next = new Map(prev);
            next.set(raceId, racePredictions);
            return next;
        });

        // Convert to API format and notify parent
        if (onPredictionsChange) {
            const hasAnyPredictions = grid.some((d) => d !== null) ||
                sprintPodium.some((d) => d !== null) ||
                pole !== null ||
                fastest !== null ||
                most !== null;

            if (hasAnyPredictions) {
                const apiFormat = {
                    gridOrder: grid.map((driver, index) => ({
                        position: index + 1,
                        driverNumber: driver?.number || null,
                    })),
                    sprintPositions: sprintPodium.map((driver, index) => ({
                        position: index + 1,
                        driverNumber: driver?.number || null,
                    })),
                    additionalPredictions: {
                        pole: pole?.number || null,
                        fastestLap: fastest?.number || null,
                        positionsGained: most?.number || null,
                    },
                };
                onPredictionsChange(JSON.stringify(apiFormat));
            } else {
                onPredictionsChange(null);
            }
        }
    }, [grid, sprintPodium, pole, fastest, most, raceId, onPredictionsChange]);

    // Calculate points when race has results and predictions are loaded
    useEffect(() => {
        const raceResults = raceResultsByRaceId.get(raceId);
        if (!raceResults || !user?.userId) {
            setTotalPoints(0);
            setBonusPoints({ total: 0, earned: false });
            return;
        }

        // Check if we have any predictions (grid is not all null)
        const hasPredictions = grid.some((driver) => driver !== null);
        if (!hasPredictions) {
            setTotalPoints(0);
            setBonusPoints({ total: 0, earned: false });
            return;
        }

        try {
            // Convert current local state predictions to PointsPredictionData format
            const predictionsForPoints: PointsPredictionData = {
                gridOrder: grid.map((driver, index) => ({
                    position: index + 1,
                    driverNumber: driver?.number || null,
                })),
                sprintPositions: sprintPodium.map((driver, index) => ({
                    position: index + 1,
                    driverNumber: driver?.number || null,
                })),
                additionalPredictions: {
                    pole: pole?.number || null,
                    fastestLap: fastest?.number || null,
                    positionsGained: most?.number || null,
                },
            };

            // Calculate driver points
            const calculatedDriverPointsMap = calculateDriverPoints(predictionsForPoints, raceResults, hasSprint || false);

            // Calculate bonus points
            const bonus = calculateBonusPoints(predictionsForPoints, raceResults);

            // Calculate total points
            let total = 0;
            calculatedDriverPointsMap.forEach((driverPoints) => {
                total += driverPoints.points;
            });
            total += bonus.total;

            // Store driver points breakdown
            const pointsMap = new Map<number, { points: number; breakdown: any }>();
            calculatedDriverPointsMap.forEach((driverPoints, driverNumber) => {
                pointsMap.set(driverNumber, {
                    points: driverPoints.points,
                    breakdown: driverPoints.breakdown,
                });
            });

            setDriverPointsMap(pointsMap);
            setTotalPoints(total);
            setBonusPoints({ total: bonus.total, earned: bonus.total > 0 });
        } catch (error) {
            console.error('[PredictionsSection] Error calculating points:', error);
            setTotalPoints(0);
            setBonusPoints({ total: 0, earned: false });
        }
    }, [raceId, raceResultsByRaceId, grid, sprintPodium, pole, fastest, most, hasSprint, user?.userId]);

    function handleSprintPick(positionIndex: number, d: Driver) {
        const existingIndex = sprintPodium.findIndex((g) => g?.id === d.id);
        const next = [...sprintPodium];
        const summary: DriverSummary = { id: d.id, name: d.name, team: d.team, number: d.number, teamColor: d.teamColor };
        if (existingIndex !== -1) {
            next[existingIndex] = next[positionIndex];
        }
        next[positionIndex] = summary;
        setSprintPodium(next);
    }

    function summaryFrom(d: Driver): DriverSummary {
        return { id: d.id, name: d.name, team: d.team, number: d.number, teamColor: d.teamColor };
    }

    // Check if race has results
    const hasResults = useMemo(() => raceResultsByRaceId.has(raceId), [raceId, raceResultsByRaceId]);

    return (
        <View style={[styles.container, isClosed && styles.containerClosed]}>
            <Text style={[
                styles.sectionLabel,
                isClosed && styles.sectionLabelClosed,
                !hasResults && !isClosed && styles.sectionLabelNoPoints
            ]}>PREDICTIONS CLOSE</Text>
            {isClosed ? (
                <View style={styles.closedRow}>
                    <Text style={styles.lock}>🔒</Text>
                    <Text style={styles.closedText}>Predictions Closed</Text>
                </View>
            ) : (
                <View style={styles.countdownRow}>
                    <TimeBox label="DAYS" value={timeLeft.days} />
                    <TimeBox label="HOURS" value={timeLeft.hours} />
                    <TimeBox label="MINUTES" value={timeLeft.minutes} />
                    <TimeBox label="SECONDS" value={timeLeft.seconds} highlight />
                </View>
            )}
            {hasResults && totalPoints > 0 && (
                <View style={styles.pointsContainer}>
                    <View style={styles.pointsRow}>
                        <Text style={styles.pointsLabel}>Your Points:</Text>
                        <Text style={styles.pointsValue}>{totalPoints}</Text>
                    </View>
                    {bonusPoints.earned && bonusPoints.total > 0 && (
                        <Text style={styles.bonusPointsText}>+{bonusPoints.total} bonus</Text>
                    )}
                </View>
            )}
            {hasResults && totalPoints > 0 && <View style={{ height: 16 }} />}
            <View style={styles.gridSelectorWrapper}>
                <PredictedGridSelector value={grid} onChange={setGrid} disabled={isClosed} driverPointsMap={hasResults ? driverPointsMap : undefined} />
            </View>

            {hasSprint ? (
                <View>
                    <View style={{ height: 24 }} />
                    <Text style={[styles.title, isClosed && styles.titleClosed]}>Sprint Race Podium</Text>
                    <View style={{ height: 8 }} />
                    {[1, 2, 3].map((pos, idx) => {
                        const driver = sprintPodium[idx];
                        const points = driver?.number ? driverPointsMap.get(driver.number) : null;
                        const sprintPoints = points?.breakdown?.sprintPosition || 0;
                        return (
                            <PredictedGridRow
                                key={`sprint-${pos}`}
                                position={pos}
                                driver={driver}
                                onPress={() => !isClosed && setOpenSprintFor(idx)}
                                disabled={isClosed}
                                points={sprintPoints > 0 ? sprintPoints : undefined}
                            />
                        );
                    })}

                    <DriverPickerModal
                        visible={openSprintFor !== null && !isClosed}
                        onClose={() => setOpenSprintFor(null)}
                        onPick={(d) => {
                            if (openSprintFor === null) return;
                            handleSprintPick(openSprintFor, d);
                        }}
                    />
                </View>
            ) : null}

            <View style={{ height: 24 }} />
            <Text style={[styles.title, isClosed && styles.titleClosed]}>Additional Predictions</Text>
            <View style={{ height: 8 }} />
            <DriverPickRow
                left={<Text style={styles.emoji}>🏁</Text>}
                sublabel="Pole"
                driver={pole}
                onPress={() => !isClosed && setOpenPickerFor('pole')}
                disabled={isClosed}
                rightAddon={pole?.number && driverPointsMap.get(pole.number)?.breakdown?.pole ? (
                    <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>+{driverPointsMap.get(pole.number)!.breakdown.pole}</Text>
                    </View>
                ) : undefined}
            />
            <DriverPickRow
                left={<Text style={styles.emoji}>⚡️</Text>}
                sublabel="Fastest"
                driver={fastest}
                onPress={() => !isClosed && setOpenPickerFor('fastest')}
                disabled={isClosed}
                rightAddon={fastest?.number && driverPointsMap.get(fastest.number)?.breakdown?.fastestLap ? (
                    <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>+{driverPointsMap.get(fastest.number)!.breakdown.fastestLap}</Text>
                    </View>
                ) : undefined}
            />
            <DriverPickRow
                left={<Text style={styles.emoji}>📈</Text>}
                sublabel="Most"
                driver={most}
                onPress={() => !isClosed && setOpenPickerFor('most')}
                disabled={isClosed}
                rightAddon={most?.number && driverPointsMap.get(most.number)?.breakdown?.positionsGained ? (
                    <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>+{driverPointsMap.get(most.number)!.breakdown.positionsGained}</Text>
                    </View>
                ) : undefined}
            />

            <DriverPickerModal
                visible={openPickerFor !== null && !isClosed}
                onClose={() => setOpenPickerFor(null)}
                onPick={(d) => {
                    const s = summaryFrom(d);
                    if (openPickerFor === 'pole') setPole(s);
                    if (openPickerFor === 'fastest') setFastest(s);
                    if (openPickerFor === 'most') setMost(s);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        opacity: 1,
    },
    containerClosed: {
        opacity: 0.7,
    },
    sectionLabel: {
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 8,
        marginBottom: 6,
        textAlign: 'center',
    },
    sectionLabelClosed: {
        color: '#9ca3af',
    },
    sectionLabelNoPoints: {
        marginBottom: 8,
    },
    countdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    gridSelectorWrapper: {
        marginTop: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
    },
    titleClosed: {
        color: '#6b7280',
    },
    closedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center',
    },
    lock: {
        fontSize: 20,
        marginRight: 8,
    },
    closedText: {
        color: '#dc2626',
        fontSize: 18,
        fontWeight: '800',
    },
    emoji: {
        fontSize: 26,
    },
    pointsContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#10b981',
    },
    pointsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    pointsLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginRight: 8,
    },
    pointsValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#10b981',
    },
    bonusPointsText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
        textAlign: 'center',
    },
    pointsBadge: {
        backgroundColor: '#10b981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pointsText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
    },
});

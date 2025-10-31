import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PredictedGridSelector, { GridSelection } from '../drivers/PredictedGridSelector';
import TimeBox from './TimeBox';
import PredictedGridRow, { DriverSummary } from '../drivers/PredictedGridRow';
import DriverPickerModal, { Driver } from '../drivers/DriverPickerModal';
import DriverPickRow from '../drivers/DriverPickRow';
import { getUserPredictions } from '../../services/graphql';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

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

export default function PredictionsSection({ raceId, timeLeft, isClosed, hasSprint }: { raceId: string; timeLeft: TimeLeft; isClosed: boolean; hasSprint?: boolean }) {
    const { user } = useAuth();
    const { drivers } = useData();

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
                const predictionEntity = await getUserPredictions(user.userId, raceId);

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
    }, [raceId, user?.userId, drivers]);

    // Close modals when race becomes closed
    useEffect(() => {
        if (isClosed) {
            setOpenSprintFor(null);
            setOpenPickerFor(null);
        }
    }, [isClosed]);

    // Save predictions when they change
    useEffect(() => {
        setPredictionsByRace((prev) => {
            const next = new Map(prev);
            next.set(raceId, {
                grid,
                sprintPodium,
                pole,
                fastest,
                most,
            });
            return next;
        });
    }, [grid, sprintPodium, pole, fastest, most, raceId]);

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

    return (
        <View style={[styles.container, isClosed && styles.containerClosed]}>
            <Text style={[styles.sectionLabel, isClosed && styles.sectionLabelClosed]}>PREDICTIONS CLOSE</Text>
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
            <View style={{ height: 16 }} />
            <PredictedGridSelector value={grid} onChange={setGrid} disabled={isClosed} />

            {hasSprint ? (
                <View>
                    <View style={{ height: 24 }} />
                    <Text style={[styles.title, isClosed && styles.titleClosed]}>Sprint Race Podium</Text>
                    <View style={{ height: 8 }} />
                    {[1, 2, 3].map((pos, idx) => (
                        <PredictedGridRow key={`sprint-${pos}`} position={pos} driver={sprintPodium[idx]}
                            onPress={() => !isClosed && setOpenSprintFor(idx)} disabled={isClosed} />
                    ))}

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
            />
            <DriverPickRow
                left={<Text style={styles.emoji}>⚡️</Text>}
                sublabel="Fastest"
                driver={fastest}
                onPress={() => !isClosed && setOpenPickerFor('fastest')}
                disabled={isClosed}
            />
            <DriverPickRow
                left={<Text style={styles.emoji}>📈</Text>}
                sublabel="Most"
                driver={most}
                onPress={() => !isClosed && setOpenPickerFor('most')}
                disabled={isClosed}
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
    countdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
});

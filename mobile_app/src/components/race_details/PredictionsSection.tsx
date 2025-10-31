import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PredictedGridSelector, { GridSelection } from '../drivers/PredictedGridSelector';
import TimeBox from './TimeBox';
import PredictedGridRow, { DriverSummary } from '../drivers/PredictedGridRow';
import DriverPickerModal, { Driver } from '../drivers/DriverPickerModal';
import DriverPickRow from '../drivers/DriverPickRow';

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

type RacePredictions = {
    grid: GridSelection;
    sprintPodium: Array<DriverSummary | null>;
    pole: DriverSummary | null;
    fastest: DriverSummary | null;
    most: DriverSummary | null;
};

export default function PredictionsSection({ raceId, timeLeft, isClosed, hasSprint }: { raceId: string; timeLeft: TimeLeft; isClosed: boolean; hasSprint?: boolean }) {
    // Store predictions per race
    const [predictionsByRace, setPredictionsByRace] = useState<Map<string, RacePredictions>>(() => new Map());

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

    // Load predictions when race changes
    useEffect(() => {
        setPredictionsByRace((prev) => {
            const racePredictions = getRacePredictions(prev);
            setGrid(racePredictions.grid);
            setSprintPodium(racePredictions.sprintPodium);
            setPole(racePredictions.pole);
            setFastest(racePredictions.fastest);
            setMost(racePredictions.most);
            return prev; // Return unchanged to avoid triggering save effect
        });
        // Close any open modals when switching races
        setOpenSprintFor(null);
        setOpenPickerFor(null);
    }, [raceId]);

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

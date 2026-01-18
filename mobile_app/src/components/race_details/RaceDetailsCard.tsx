import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RaceHeader from './RaceHeader';
import PredictionsSection from './PredictionsSection';

export type RaceEntity = {
    entityType: 'RACE';
    raceId: string;
    raceName: string;
    season: string;
    qualyDate: string;
    raceDate: string;
    category: string;
    circuit: string;
    country: string;
    status: 'upcoming' | 'completed' | string;
    hasSprint?: boolean;
};

function formatTarget(dateIso: string): string {
    const d = new Date(dateIso);
    return d.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

export default function RaceDetailsCard({ race, timeLeft, onPredictionsChange, predictionsByRaceId }: { race: RaceEntity; timeLeft: TimeLeft; onPredictionsChange?: (predictions: string | null) => void; predictionsByRaceId?: Map<string, any> }) {
    const isClosed = useMemo(() => Date.now() >= Date.parse(race.qualyDate), [race.qualyDate]);

    return (
        <View style={styles.card}>
            <RaceHeader name={race.raceName} circuit={race.circuit} country={race.country} hasSprint={race.hasSprint} />

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>RACE DATE</Text>
            <Text style={styles.whenText}>{formatTarget(race.raceDate)}</Text>

            <View style={{ height: 16 }} />

            <PredictionsSection 
                raceId={race.raceId} 
                timeLeft={timeLeft} 
                isClosed={isClosed} 
                hasSprint={race.hasSprint} 
                onPredictionsChange={onPredictionsChange}
                predictionsByRaceId={predictionsByRaceId}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        backgroundColor: '#ffffff',
        padding: 16,
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 16,
    },
    sectionLabel: {
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    whenText: {
        marginTop: 6,
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
});



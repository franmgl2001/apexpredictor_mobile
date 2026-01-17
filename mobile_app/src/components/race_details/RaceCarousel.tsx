import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import RaceDetailsCard, { RaceEntity } from './RaceDetailsCard';

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function loadRaces(): RaceEntity[] {
    const json: any = require('../../mocks/listApexEntities.json');
    const items: any[] = json?.data?.listApexEntities?.items ?? [];
    const races: RaceEntity[] = items.filter((it) => it?.entityType === 'RACE');
    // Always sort by qualy_date ascending to keep mock data organized by qualy
    races.sort((a, b) => Date.parse(a.qualy_date) - Date.parse(b.qualy_date));
    return races;
}

function getInitialIndex(races: RaceEntity[]): number {
    const now = Date.now();
    const fortyEightHoursMs = 48 * 60 * 60 * 1000;
    // Pick the first race whose (qualy_date + 48h) is in the future
    const idx = races.findIndex((r) => Date.parse(r.qualy_date) + fortyEightHoursMs > now && r.status !== 'completed');
    return idx === -1 ? 0 : idx;
}

function getTimeLeft(targetIso: string): TimeLeft {
    const target = Date.parse(targetIso);
    const now = Date.now();
    const diffMs = Math.max(0, target - now);
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diffMs % (60 * 1000)) / 1000);
    return { days, hours, minutes, seconds };
}

export default function RaceCarousel({
    races: racesProp,
    onIsClosedChange,
    onCurrentRaceChange,
    onPredictionsChange,
    predictionsByRaceId,
}: {
    races?: RaceEntity[];
    onIsClosedChange?: (isClosed: boolean) => void;
    onCurrentRaceChange?: (raceId: string) => void;
    onPredictionsChange?: (predictions: string | null) => void;
    predictionsByRaceId?: Map<string, any>;
}) {
    // Use provided races or fall back to loading from mocks
    const races = useMemo(() => {
        if (racesProp && racesProp.length > 0) {
            return racesProp;
        }
        return loadRaces();
    }, [racesProp]);

    const [index, setIndex] = useState(() => getInitialIndex(races));
    const race = races[index];

    // Reset index when races change
    useEffect(() => {
        if (races.length > 0) {
            const newIndex = getInitialIndex(races);
            setIndex(newIndex);
        }
    }, [races]);

    // Notify parent of current race change
    useEffect(() => {
        if (race?.race_id && onCurrentRaceChange) {
            onCurrentRaceChange(race.race_id);
        }
    }, [race?.race_id, onCurrentRaceChange]);

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => (race ? getTimeLeft(race.qualy_date) : { days: 0, hours: 0, minutes: 0, seconds: 0 }));
    const [isClosed, setIsClosed] = useState(() => race ? Date.now() >= Date.parse(race.qualy_date) : false);

    useEffect(() => {
        if (race) {
            const nowClosed = Date.now() >= Date.parse(race.qualy_date);
            setIsClosed(nowClosed);
        }
    }, [race?.qualy_date]);

    useEffect(() => {
        onIsClosedChange?.(isClosed);
    }, [isClosed, onIsClosedChange]);

    useEffect(() => {
        if (!race) return;
        const update = () => {
            setTimeLeft(getTimeLeft(race.qualy_date));
            const nowClosed = Date.now() >= Date.parse(race.qualy_date);
            setIsClosed(nowClosed);
        };
        // Update immediately when race changes (no lag)
        update();
        // Then set up interval for continuous updates
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [race?.qualy_date]);

    const total = races.length;

    function prev() {
        setIndex((i) => (i - 1 + total) % total);
    }
    function next() {
        setIndex((i) => (i + 1) % total);
    }

    if (!race) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>No races available</Text>
            </View>
        );
    }

    return (
        <View>
            <View style={styles.topRow}>
                <TouchableOpacity onPress={prev} style={[styles.navBtn, styles.navBtnLeft]}>
                    <Text style={styles.navIcon}>◀</Text>
                </TouchableOpacity>
                <View style={styles.indexWrap}>
                    <Text style={styles.indexPill}>{`${index + 1} of ${total}`}</Text>
                </View>
                <TouchableOpacity onPress={next} style={[styles.navBtn, styles.navBtnRight]}>
                    <Text style={styles.navIcon}>▶</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 12 }} />

            <RaceDetailsCard 
                race={race} 
                timeLeft={timeLeft} 
                onPredictionsChange={onPredictionsChange}
                predictionsByRaceId={predictionsByRaceId}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        height: 44,
    },
    navBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    navBtnLeft: {
        marginRight: 8,
    },
    navBtnRight: {
        marginLeft: 8,
    },
    navIcon: {
        fontSize: 16,
    },
    indexWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    indexPill: {
        // visual
        backgroundColor: '#ffe4e6',
        color: '#b91c1c',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: '700',
    },
    empty: {
        alignItems: 'center',
        padding: 16,
    },
    emptyText: {
        color: '#6b7280',
    },
});



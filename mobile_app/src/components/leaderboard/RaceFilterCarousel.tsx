import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useData } from '../../contexts/DataContext';
import type { RaceEntity } from '../race_details/RaceDetailsCard';

type RaceItem = {
    race_id: string;
    race_name: string;
    race_date: string;
};

function loadRacesFromContext(racesFromContext: RaceEntity[]): RaceItem[] {
    const races: RaceItem[] = racesFromContext
        .map((race) => ({
            race_id: race.race_id,
            race_name: race.race_name,
            race_date: race.race_date,
        }))
        .filter((race) => race.race_id && race.race_name && race.race_date);
    // Sort by race_date ascending (earliest first, latest last)
    races.sort((a, b) => Date.parse(a.race_date) - Date.parse(b.race_date));
    return races;
}

function formatRaceDate(dateIso: string): string {
    const d = new Date(dateIso);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[d.getUTCDay()];
    const month = months[d.getUTCMonth()];
    const day = d.getUTCDate();
    return `${dayName}, ${month} ${day}`;
}

interface RaceFilterCarouselProps {
    onRaceChange?: (raceId: string) => void;
}

export default function RaceFilterCarousel({ onRaceChange }: RaceFilterCarouselProps) {
    const { racesWithResults } = useData();
    const races = useMemo(() => loadRacesFromContext(racesWithResults), [racesWithResults]);
    const [index, setIndex] = useState(0);

    const race = races[index];
    const total = races.length;

    // Trigger initial race selection with latest race (last index after ascending sort)
    useEffect(() => {
        if (races.length > 0) {
            const lastIndex = races.length - 1;
            setIndex(lastIndex);
            onRaceChange?.(races[lastIndex].race_id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [races.length]); // Update when races are loaded or change

    function prev() {
        const newIndex = (index - 1 + total) % total;
        setIndex(newIndex);
        onRaceChange?.(races[newIndex].race_id);
    }

    function next() {
        const newIndex = (index + 1) % total;
        setIndex(newIndex);
        onRaceChange?.(races[newIndex].race_id);
    }

    if (!race || total === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
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

            <View style={styles.raceInfo}>
                <Text style={styles.raceTitle}>{race.race_name}</Text>
                <Text style={styles.raceDate}>{formatRaceDate(race.race_date)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 12,
    },
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
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    navBtnLeft: {
        marginRight: 8,
    },
    navBtnRight: {
        marginLeft: 8,
    },
    navIcon: {
        fontSize: 16,
        color: '#111827',
    },
    indexWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    indexPill: {
        backgroundColor: '#ffe4e6',
        color: '#b91c1c',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: '700',
    },
    raceInfo: {
        alignItems: 'center',
        marginTop: 12,
    },
    raceTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    raceDate: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6b7280',
    },
});


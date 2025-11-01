import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PredictedGridRow, { DriverSummary } from './PredictedGridRow';
import DriverPickerModal, { Driver } from './DriverPickerModal';

export type GridSelection = Array<DriverSummary | null>;

interface PredictedGridSelectorProps {
    value?: GridSelection;
    onChange?: (grid: GridSelection) => void;
    disabled?: boolean;
    driverPointsMap?: Map<number, { points: number; breakdown: any }>;
}

export default function PredictedGridSelector({ value, onChange, disabled, driverPointsMap }: PredictedGridSelectorProps) {
    const [grid, setGrid] = useState<GridSelection>(() => value ?? new Array(10).fill(null));
    const [openFor, setOpenFor] = useState<number | null>(null);

    // Sync with external value changes
    useEffect(() => {
        if (value !== undefined) {
            setGrid(value);
        }
    }, [value]);

    // Close modal when disabled
    useEffect(() => {
        if (disabled) {
            setOpenFor(null);
        }
    }, [disabled]);

    function updateGrid(next: GridSelection) {
        setGrid(next);
        onChange?.(next);
    }

    function handlePick(positionIndex: number, d: Driver) {
        const existingIndex = grid.findIndex((g) => g?.id === d.id);
        const next = [...grid];
        const summary: DriverSummary = { id: d.id, name: d.name, team: d.team, number: d.number, teamColor: d.teamColor };
        if (existingIndex !== -1) {
            next[existingIndex] = next[positionIndex];
        }
        next[positionIndex] = summary;
        updateGrid(next);
    }

    const rows = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);

    return (
        <View>
            <Text style={styles.title}>Predicted Grid Order (Top 10)</Text>
            <View style={{ height: 8 }} />
            {rows.map((position, idx) => {
                const driver = grid[idx];
                const points = driver?.number && driverPointsMap ? driverPointsMap.get(driver.number) : null;
                const gridPoints = points?.breakdown?.gridPosition || 0;
                return (
                    <PredictedGridRow
                        key={position}
                        position={position}
                        driver={driver}
                        onPress={() => !disabled && setOpenFor(idx)}
                        disabled={disabled}
                        points={gridPoints > 0 ? gridPoints : undefined}
                    />
                );
            })}

            <DriverPickerModal
                visible={openFor !== null && !disabled}
                onClose={() => setOpenFor(null)}
                onPick={(d) => {
                    if (openFor === null) return;
                    handlePick(openFor, d);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
    },
});



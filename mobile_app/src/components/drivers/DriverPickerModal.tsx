import React, { useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';

export type Driver = {
    id: string;
    name: string;
    team: string;
    number: number;
    nationality?: string;
    teamColor?: string;
};

function loadDrivers(): Driver[] {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const json: any = require('../../mocks/drivers.json');
    const items: any[] = json?.data?.listApexEntities?.items ?? [];
    const drivers = items
        .filter((it) => it?.entityType === 'DRIVER')
        .map((it) => ({
            id: String(it.driver_id ?? it.PK ?? it.name),
            name: String(it.name),
            team: String(it.team),
            number: Number(it.number),
            nationality: it.nationality ?? undefined,
            teamColor: it.teamColor ?? undefined,
        }));
    // Sort by team, then by name within team
    return drivers.sort((a, b) => {
        if (a.team !== b.team) {
            return a.team.localeCompare(b.team);
        }
        return a.name.localeCompare(b.name);
    });
}

export default function DriverPickerModal({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (driver: Driver) => void }) {
    const allDrivers = useMemo(() => loadDrivers(), []);
    const [query, setQuery] = useState('');

    const filteredDrivers = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = q
            ? allDrivers.filter(
                (d) =>
                    d.name.toLowerCase().includes(q) ||
                    d.team.toLowerCase().includes(q) ||
                    String(d.number).includes(q)
            )
            : allDrivers;
        // Keep deterministic ordering: by team, then name
        return [...filtered].sort((a, b) => (a.team === b.team ? a.name.localeCompare(b.name) : a.team.localeCompare(b.team)));
    }, [query, allDrivers]);

    function handlePick(d: Driver) {
        onPick(d);
        onClose();
        setQuery('');
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Select Driver</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.close}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        style={styles.search}
                        placeholder="Search name, team, or number"
                        placeholderTextColor="#9ca3af"
                    />
                    <FlatList
                        data={filteredDrivers}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item: driver }) => (
                            <TouchableOpacity
                                style={styles.item}
                                onPress={() => handlePick(driver)}
                            >
                                <View style={styles.itemLeft}>
                                    <View style={[styles.itemDot, { backgroundColor: driver.teamColor || '#9ca3af' }]} />
                                    <View style={styles.itemTextContainer}>
                                        <Text style={styles.itemName}>{driver.name}</Text>
                                        <Text style={styles.itemTeam}>{driver.team}</Text>
                                    </View>
                                </View>
                                <Text style={styles.itemNum}>#{driver.number}</Text>
                            </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={() => <View style={{ height: 3 }} />}
                        contentContainerStyle={{ paddingBottom: 16 }}
                    />
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
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '85%',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
    },
    close: {
        color: '#6b7280',
        fontWeight: '700',
    },
    search: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    teamHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    teamDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    teamName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        backgroundColor: '#fafafa',
        marginBottom: 8,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    itemTextContainer: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    itemTeam: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '400',
    },
    itemNum: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '700',
        marginLeft: 8,
    },
});



import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import RaceCarousel from '../components/race_details/RaceCarousel';
import RulesScoringButton from '../components/rules_modal/RulesScoringButton';
import RulesScoringModal from '../components/rules_modal/RulesScoringModal';
import { getRaceDetails, ApexEntity } from '../services/graphql';
import { RaceEntity } from '../components/race_details/RaceDetailsCard';

export default function MyTeamScreen() {
    const [isClosed, setIsClosed] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [races, setRaces] = useState<RaceEntity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRaces();
    }, []);

    const fetchRaces = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const raceData = await getRaceDetails();
            // Filter and map ApexEntity to RaceEntity
            const raceEntities: RaceEntity[] = raceData
                .filter((item): item is ApexEntity & { entityType: 'RACE' } => item.entityType === 'RACE')
                .map((item) => ({
                    entityType: 'RACE' as const,
                    race_id: item.race_id || '',
                    race_name: item.race_name || '',
                    season: item.season || '',
                    qualy_date: item.qualy_date || '',
                    race_date: item.race_date || '',
                    category: item.category || '',
                    circuit: item.circuit || '',
                    country: item.country || '',
                    status: item.status || 'upcoming',
                    has_sprint: item.has_sprint || false,
                }))
                // Sort by qualy_date ascending
                .sort((a, b) => Date.parse(a.qualy_date) - Date.parse(b.qualy_date));

            setRaces(raceEntities);
        } catch (err: any) {
            console.error('Error fetching races:', err);
            setError(err.message || 'Failed to load races');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                contentInsetAdjustmentBehavior="automatic"
                keyboardShouldPersistTaps="handled"
            >
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#dc2626" />
                        <Text style={styles.loadingText}>Loading races...</Text>
                    </View>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={fetchRaces} style={styles.retryButton}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!isLoading && !error && races.length > 0 && (
                    <>
                        <RaceCarousel races={races} onIsClosedChange={setIsClosed} />
                        <View style={{ height: 16 }} />
                    </>
                )}

                {!isLoading && !error && races.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No races available</Text>
                    </View>
                )}

                <View style={styles.rulesButtonContainer}>
                    <RulesScoringButton onPress={() => setShowRulesModal(true)} />
                </View>
                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.saveWrap}>
                <TouchableOpacity style={[styles.saveBtn, isClosed && styles.saveBtnDisabled]} activeOpacity={0.85} disabled={isClosed}>
                    <Text style={[styles.saveText, isClosed && styles.saveTextDisabled]}>Save Team</Text>
                </TouchableOpacity>
            </View>

            <RulesScoringModal visible={showRulesModal} onClose={() => setShowRulesModal(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 96, // leave room for the bottom nav
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    errorContainer: {
        backgroundColor: '#fef2f2',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
    },
    retryButton: {
        backgroundColor: '#dc2626',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 16,
    },
    rulesButtonContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
    },
    saveWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    saveBtn: {
        backgroundColor: '#d1d5db',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    saveBtnDisabled: {
        backgroundColor: '#e5e7eb',
        opacity: 0.6,
    },
    saveText: {
        color: '#374151',
        fontWeight: '800',
        fontSize: 16,
    },
    saveTextDisabled: {
        color: '#9ca3af',
    },
});



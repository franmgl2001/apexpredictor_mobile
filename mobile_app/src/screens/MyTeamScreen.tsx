import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RaceCarousel from '../components/race_details/RaceCarousel';
import RulesScoringButton from '../components/rules_modal/RulesScoringButton';
import RulesScoringModal from '../components/rules_modal/RulesScoringModal';
import AppHeader from '../components/AppHeader';
import { useData, type Driver } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { getRaces, getDrivers, type ApexEntity, type Race } from '../services/graphql';
import type { RaceEntity } from '../components/race_details/RaceDetailsCard';

type MyTeamScreenProps = {
    onProfilePress: () => void;
};

export default function MyTeamScreen({ onProfilePress }: MyTeamScreenProps) {
    const [isClosed, setIsClosed] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentRaceId, setCurrentRaceId] = useState<string | null>(null);
    const [currentPredictions, setCurrentPredictions] = useState<string | null>(null);
    const [predictionsByRaceId, setPredictionsByRaceId] = useState<Map<string, ApexEntity | null>>(new Map());
    const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
    const [localRaces, setLocalRaces] = useState<RaceEntity[]>([]);
    const [localDrivers, setLocalDrivers] = useState<Driver[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [dataError, setDataError] = useState<string | null>(null);
    const { profile, refetchRaces, refetchDrivers } = useData();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    // Fetch races and drivers using the services
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            setDataError(null);
            const category = 'F1';
            const season = '2026';

            try {
                // Fetch races and drivers in parallel
                const [racesData, driversData] = await Promise.all([
                    getRaces(category, season, 100),
                    getDrivers(category, season, 100),
                ]);

                // Convert Race[] to RaceEntity[] for races
                const raceEntities: RaceEntity[] = racesData
                    .filter((item): item is Race => item.entityType === 'RACE')
                    .map((item) => ({
                        entityType: 'RACE' as const,
                        race_id: item.race_id,
                        race_name: item.race_name,
                        season: item.season,
                        qualy_date: item.qualy_date || '',
                        race_date: item.race_date || '',
                        category: item.category,
                        circuit: item.circuit || '',
                        country: item.country || '',
                        status: (item.status || 'upcoming') as 'upcoming' | 'completed' | string,
                        has_sprint: item.has_sprint || false,
                    }))
                    .sort((a, b) => Date.parse(a.qualy_date) - Date.parse(b.qualy_date));

                // Convert drivers to Driver[] format (same structure as DataContext expects)
                const driverEntities: Driver[] = driversData
                    .filter((item) => item.entityType === 'DRIVER' && item.isActive === true)
                    .map((item) => ({
                        id: String(item.driver_id ?? item.PK ?? item.name ?? ''),
                        name: String(item.name ?? ''),
                        team: String(item.team ?? ''),
                        number: Number(item.number ?? 0),
                        nationality: item.nationality ?? undefined,
                        teamColor: item.teamColor ?? undefined,
                    }))
                    .sort((a, b) => {
                        if (a.team !== b.team) {
                            return a.team.localeCompare(b.team);
                        }
                        return a.name.localeCompare(b.name);
                    });

                setLocalRaces(raceEntities);
                setLocalDrivers(driverEntities);

                // Update DataContext so PredictionsSection can access drivers
                try {
                    await Promise.all([refetchRaces(), refetchDrivers()]);
                } catch (err) {
                    // Silently fail - DataContext update failed
                }
            } catch (error: any) {
                setDataError(error?.message || 'Failed to fetch data');
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, []);

    // Fetch all user predictions when screen loads
    useEffect(() => {
        if (!user?.userId || localRaces.length === 0) {
            setPredictionsByRaceId(new Map());
            return;
        }

        const fetchAllPredictions = async () => {
            setIsLoadingPredictions(true);
            try {
                // COMMENTED OUT: const predictionsMap = await getAllUserPredictions(user.userId);
                // COMMENTED OUT: setPredictionsByRaceId(predictionsMap);
                setPredictionsByRaceId(new Map()); // Set to empty since we're not fetching
            } catch (error) {
                setPredictionsByRaceId(new Map());
            } finally {
                setIsLoadingPredictions(false);
            }
        };

        fetchAllPredictions();
    }, [user?.userId, localRaces.length]);

    const handleSave = async () => {
        if (!user?.userId || !currentRaceId || !currentPredictions) {
            Alert.alert('Error', 'Please make predictions before saving.');
            return;
        }

        if (!profile?.username) {
            Alert.alert('Error', 'Username not available.');
            return;
        }

        setIsSaving(true);
        try {
            // COMMENTED OUT: await saveUserPredictions(user.userId, profile.username, currentRaceId, currentPredictions);
            // COMMENTED OUT: Alert.alert('Success', 'Predictions saved successfully!');
            Alert.alert('Info', 'Save functionality is currently disabled.');
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to save predictions. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <AppHeader onProfilePress={onProfilePress} />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                contentInsetAdjustmentBehavior="automatic"
                keyboardShouldPersistTaps="handled"
            >
                {isLoadingData && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#dc2626" />
                        <Text style={styles.loadingText}>Loading races...</Text>
                    </View>
                )}

                {dataError && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{dataError}</Text>
                        <TouchableOpacity
                            onPress={() => {
                                // Retry fetching
                                const fetchData = async () => {
                                    setIsLoadingData(true);
                                    setDataError(null);
                                    const category = 'F1';
                                    const season = '2026';

                                    try {
                                        const [racesData, driversData] = await Promise.all([
                                            getRaces(category, season, 100),
                                            getDrivers(category, season, 100),
                                        ]);

                                        const raceEntities: RaceEntity[] = racesData
                                            .filter((item): item is Race => item.entityType === 'RACE')
                                            .map((item) => ({
                                                entityType: 'RACE' as const,
                                                race_id: item.race_id,
                                                race_name: item.race_name,
                                                season: item.season,
                                                qualy_date: item.qualy_date || '',
                                                race_date: item.race_date || '',
                                                category: item.category,
                                                circuit: item.circuit || '',
                                                country: item.country || '',
                                                status: (item.status || 'upcoming') as 'upcoming' | 'completed' | string,
                                                has_sprint: item.has_sprint || false,
                                            }))
                                            .sort((a, b) => Date.parse(a.qualy_date) - Date.parse(b.qualy_date));

                                        const driverEntities: Driver[] = driversData
                                            .filter((item) => item.entityType === 'DRIVER' && item.isActive === true)
                                            .map((item) => ({
                                                id: String(item.driver_id ?? item.PK ?? item.name ?? ''),
                                                name: String(item.name ?? ''),
                                                team: String(item.team ?? ''),
                                                number: Number(item.number ?? 0),
                                                nationality: item.nationality ?? undefined,
                                                teamColor: item.teamColor ?? undefined,
                                            }))
                                            .sort((a, b) => {
                                                if (a.team !== b.team) {
                                                    return a.team.localeCompare(b.team);
                                                }
                                                return a.name.localeCompare(b.name);
                                            });

                                        setLocalRaces(raceEntities);
                                        setLocalDrivers(driverEntities);
                                    } catch (error: any) {
                                        setDataError(error?.message || 'Failed to fetch data');
                                    } finally {
                                        setIsLoadingData(false);
                                    }
                                };
                                fetchData();
                            }}
                            style={styles.retryButton}
                        >
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!isLoadingData && !dataError && localRaces.length > 0 && (
                    <>
                        <RaceCarousel
                            races={localRaces}
                            onIsClosedChange={setIsClosed}
                            onCurrentRaceChange={setCurrentRaceId}
                            onPredictionsChange={setCurrentPredictions}
                            predictionsByRaceId={predictionsByRaceId}
                        />
                        <View style={{ height: 16 }} />
                    </>
                )}

                {!isLoadingData && !dataError && localRaces.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No races available</Text>
                    </View>
                )}

                <View style={styles.rulesButtonContainer}>
                    <RulesScoringButton onPress={() => setShowRulesModal(true)} />
                </View>
                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={[styles.saveWrap, { bottom: 80 + insets.bottom }]}>
                <TouchableOpacity
                    style={[styles.saveBtn, (isClosed || isSaving || !currentPredictions) && styles.saveBtnDisabled]}
                    activeOpacity={0.85}
                    disabled={isClosed || isSaving || !currentPredictions}
                    onPress={handleSave}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#9ca3af" />
                    ) : (
                        <Text style={[styles.saveText, (isClosed || !currentPredictions) && styles.saveTextDisabled]}>Save Team</Text>
                    )}
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        zIndex: 100,
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



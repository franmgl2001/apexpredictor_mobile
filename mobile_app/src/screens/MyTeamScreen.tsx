import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RaceCarousel from '../components/race_details/RaceCarousel';
import RulesScoringButton from '../components/rules_modal/RulesScoringButton';
import RulesScoringModal from '../components/rules_modal/RulesScoringModal';
import AppHeader from '../components/AppHeader';
import { useData, type Driver } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { upsertPrediction, listMyPredictions } from '../services/graphql';

// Local type for cached predictions
interface CachedPrediction {
    prediction?: string | null;
    points?: number;
}

type MyTeamScreenProps = {
    onProfilePress: () => void;
};

export default function MyTeamScreen({ onProfilePress }: MyTeamScreenProps) {
    const [isClosed, setIsClosed] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentRaceId, setCurrentRaceId] = useState<string | null>(null);
    const [currentPredictions, setCurrentPredictions] = useState<string | null>(null);
    const [predictionsByRaceId, setPredictionsByRaceId] = useState<Map<string, CachedPrediction | null>>(new Map());
    const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
    const { profile, races, drivers, isLoading, racesError, driversError } = useData();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    // Use races and drivers from DataContext - no need to fetch separately
    const localRaces = races;
    const localDrivers = drivers;
    const isLoadingData = isLoading;
    const dataError = racesError || driversError;

    // Fetch all user predictions when screen loads
    useEffect(() => {
        if (!user?.userId || localRaces.length === 0) {
            setPredictionsByRaceId(new Map());
            return;
        }

        const fetchAllPredictions = async () => {
            setIsLoadingPredictions(true);
            try {
                // Fetch all predictions using the byUser GSI
                const predictions = await listMyPredictions(undefined, undefined, 100);

                // Convert predictions array to a Map keyed by raceId
                const predictionsMap = new Map<string, CachedPrediction | null>();

                predictions.forEach((pred) => {
                    // AWSJSON can be a string or object - convert to string for storage
                    let predictionString: string | null = null;
                    if (pred.prediction !== null && pred.prediction !== undefined) {
                        if (typeof pred.prediction === 'string') {
                            predictionString = pred.prediction;
                        } else {
                            // It's an object/array, stringify it
                            predictionString = JSON.stringify(pred.prediction);
                        }
                    }

                    predictionsMap.set(pred.raceId, {
                        prediction: predictionString,
                        points: pred.points,
                    });
                });

                // Also set null for races that don't have predictions (so we know they were checked)
                localRaces.forEach((race) => {
                    if (!predictionsMap.has(race.raceId)) {
                        predictionsMap.set(race.raceId, null);
                    }
                });

                setPredictionsByRaceId(predictionsMap);
            } catch (error) {
                console.error('Failed to fetch predictions:', error);
                // Set empty map on error - predictions will be loaded individually if needed
                setPredictionsByRaceId(new Map());
            } finally {
                setIsLoadingPredictions(false);
            }
        };

        fetchAllPredictions();
    }, [user?.userId, localRaces]);

    const handleSave = async () => {
        if (!user?.userId || !currentRaceId || !currentPredictions) {
            Alert.alert('Error', 'Please make predictions before saving.');
            return;
        }

        // Find the current race to get category and season
        const currentRace = localRaces.find(race => race.raceId === currentRaceId);
        if (!currentRace) {
            Alert.alert('Error', 'Race information not found.');
            return;
        }

        if (!currentRace.category || !currentRace.season) {
            Alert.alert('Error', 'Race category or season information is missing.');
            return;
        }

        setIsSaving(true);
        try {
            // Pass category directly (e.g., "F1", "MotoGP")
            const category = currentRace.category;
            const season = currentRace.season;

            await upsertPrediction(category, season, currentRaceId, currentPredictions);
            Alert.alert('Success', 'Predictions saved successfully!');
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



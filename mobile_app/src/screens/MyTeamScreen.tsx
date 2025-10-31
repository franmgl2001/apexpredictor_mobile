import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import RaceCarousel from '../components/race_details/RaceCarousel';
import RulesScoringButton from '../components/rules_modal/RulesScoringButton';
import RulesScoringModal from '../components/rules_modal/RulesScoringModal';
import AppHeader from '../components/AppHeader';
import { useData } from '../contexts/DataContext';

type MyTeamScreenProps = {
    onProfilePress: () => void;
};

export default function MyTeamScreen({ onProfilePress }: MyTeamScreenProps) {
    const [isClosed, setIsClosed] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const { races, isLoading, racesError, refetchRaces } = useData();

    return (
        <View style={{ flex: 1 }}>
            <AppHeader onProfilePress={onProfilePress} />
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

                {racesError && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{racesError}</Text>
                        <TouchableOpacity onPress={refetchRaces} style={styles.retryButton}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!isLoading && !racesError && races.length > 0 && (
                    <>
                        <RaceCarousel races={races} onIsClosedChange={setIsClosed} />
                        <View style={{ height: 16 }} />
                    </>
                )}

                {!isLoading && !racesError && races.length === 0 && (
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



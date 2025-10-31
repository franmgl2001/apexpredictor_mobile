import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface RulesScoringModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function RulesScoringModal({ visible, onClose }: RulesScoringModalProps) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Prediction Rules & Scoring</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.close}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Basic Position Scoring */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Basic Position Scoring</Text>
                            <View style={styles.ruleRow}>
                                <Text style={styles.ruleText}>Correct position prediction</Text>
                                <Text style={styles.pointsText}>10 points</Text>
                            </View>
                            <View style={styles.ruleRow}>
                                <Text style={styles.ruleText}>Miss by 1 position</Text>
                                <Text style={styles.pointsText}>5 points</Text>
                            </View>
                            <View style={styles.ruleRow}>
                                <Text style={styles.ruleText}>Miss by 2 positions</Text>
                                <Text style={styles.pointsText}>2 points</Text>
                            </View>
                            <View style={styles.ruleRow}>
                                <Text style={styles.ruleText}>Miss by 3+ positions</Text>
                                <Text style={styles.pointsText}>0 points</Text>
                            </View>
                        </View>

                        {/* Bonus Points */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Bonus Points</Text>
                            <Text style={styles.subsectionTitle}>Race Performance</Text>
                            <View style={styles.ruleRow}>
                                <Text style={styles.ruleText}>Winner prediction</Text>
                                <Text style={styles.pointsText}>+10 points</Text>
                            </View>
                            <View style={styles.ruleRow}>
                                <Text style={styles.ruleText}>Podium prediction (top 3)</Text>
                                <Text style={styles.pointsText}>+30 points</Text>
                            </View>
                            <View style={styles.ruleRow}>
                                <Text style={styles.ruleText}>Top 6 prediction</Text>
                                <Text style={styles.pointsText}>+60 points</Text>
                            </View>
                            <View style={styles.ruleRow}>
                                <Text style={styles.ruleText}>All drivers correct</Text>
                                <Text style={styles.pointsText}>+100 points</Text>
                            </View>
                        </View>

                        {/* Special Predictions */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Special Predictions</Text>
                            <View style={styles.ruleRow}>
                                <Text style={styles.ruleText}>Fastest lap</Text>
                                <Text style={styles.pointsText}>+10 points</Text>
                            </View>
                            <View style={styles.ruleRow}>
                                <Text style={styles.ruleText}>Pole position</Text>
                                <Text style={styles.pointsText}>+10 points</Text>
                            </View>
                            <View style={styles.ruleRow}>
                                <Text style={styles.ruleText}>Positions gained</Text>
                                <Text style={styles.pointsText}>+10 points</Text>
                            </View>
                            <Text style={styles.helperText}>
                                Awarded if you correctly pick the driver who gains the most positions from their starting grid spot to the final result. Ties are broken by the higher finishing position.
                            </Text>
                        </View>

                        {/* Sprint Race Scoring */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Sprint Race Scoring</Text>
                            <View style={styles.emojiRow}>
                                <Text style={styles.emoji}>🏁</Text>
                            </View>
                            <Text style={styles.subsectionTitle}>Sprint Weekend Predictions</Text>
                            <Text style={styles.description}>
                                Sprint race predictions work exactly the same as regular race predictions. On sprint weekends, you can predict both the sprint race and main race results for extra scoring opportunities.
                            </Text>
                            <View style={styles.noteBox}>
                                <Text style={styles.noteText}>
                                    Note: Sprint and race predictions are separate events. You can select the same drivers for both.
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
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
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '90%',
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    close: {
        color: '#6b7280',
        fontWeight: '700',
        fontSize: 16,
    },
    content: {
        flexGrow: 1,
    },
    contentContainer: {
        paddingBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
    },
    subsectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
        marginTop: 8,
    },
    ruleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    ruleText: {
        fontSize: 15,
        color: '#374151',
        flex: 1,
    },
    pointsText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    emojiRow: {
        alignItems: 'center',
        marginVertical: 8,
    },
    emoji: {
        fontSize: 24,
    },
    description: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginTop: 8,
    },
    noteBox: {
        backgroundColor: '#fef3c7',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#fbbf24',
    },
    noteText: {
        fontSize: 14,
        color: '#78350f',
        lineHeight: 20,
    },
    helperText: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
        marginTop: 4,
        paddingHorizontal: 4,
    },
});


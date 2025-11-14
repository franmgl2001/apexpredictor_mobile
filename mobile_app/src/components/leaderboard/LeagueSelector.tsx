import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import type { ApexEntity } from '../../services/graphql';

interface LeagueSelectorProps {
    leagues: ApexEntity[];
    selectedLeagueId: string | null;
    onLeagueChange: (leagueId: string) => void;
    isLoading?: boolean;
}

export default function LeagueSelector({
    leagues,
    selectedLeagueId,
    onLeagueChange,
    isLoading = false,
}: LeagueSelectorProps) {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const selectedLeague = leagues.find(
        (league) => (league.league_id || league.PK?.replace('league#', '')) === selectedLeagueId
    );

    const handleSelectLeague = (leagueId: string) => {
        onLeagueChange(leagueId);
        setIsModalVisible(false);
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.inputContainer}>
                    <ActivityIndicator size="small" color="#dc2626" />
                    <Text style={styles.loadingText}>Loading leagues...</Text>
                </View>
            </View>
        );
    }

    if (leagues.length === 0) {
        return (
            <View style={styles.container}>
                <View style={[styles.inputContainer, styles.inputContainerDisabled]}>
                    <Text style={styles.emptyText}>No leagues available</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.inputContainer, selectedLeagueId && styles.inputContainerActive]}
                onPress={() => setIsModalVisible(true)}
                activeOpacity={0.8}
            >
                {selectedLeague ? (
                    <View style={styles.selectedLeagueContent}>
                        <View style={styles.selectedLeagueMain}>
                            <View style={styles.selectedLeagueHeader}>
                                <Text style={styles.selectedLeagueName} numberOfLines={1}>
                                    {selectedLeague.league_name || 'Unnamed League'}
                                </Text>
                                <View style={styles.selectedLeagueIcons}>
                                    {selectedLeague.is_private && (
                                        <View style={styles.iconBadge}>
                                            <Text style={styles.iconText}>🔒</Text>
                                        </View>
                                    )}
                                    {selectedLeague.role === 'admin' && (
                                        <View style={[styles.iconBadge, styles.iconBadgeGold]}>
                                            <Text style={styles.iconText}>👑</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            {selectedLeague.member_count !== undefined && (
                                <Text style={styles.selectedLeagueMeta}>
                                    {selectedLeague.member_count} {selectedLeague.member_count === 1 ? 'member' : 'members'}
                                </Text>
                            )}
                        </View>
                        <View style={styles.chevronContainer}>
                            <Text style={styles.chevron}>▼</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.placeholderContent}>
                        <Text style={styles.placeholderText}>Select a league</Text>
                        <Text style={styles.chevron}>▼</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Premium Dropdown Modal */}
            <Modal
                visible={isModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setIsModalVisible(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderContent}>
                                <Text style={styles.modalTitle}>Select League</Text>
                                <Text style={styles.modalSubtitle}>{leagues.length} {leagues.length === 1 ? 'league' : 'leagues'} available</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setIsModalVisible(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={leagues}
                            keyExtractor={(item) => item.league_id || item.PK?.replace('league#', '') || ''}
                            renderItem={({ item: league }) => {
                                const leagueId = league.league_id || league.PK?.replace('league#', '') || '';
                                const isSelected = selectedLeagueId === leagueId;
                                return (
                                    <TouchableOpacity
                                        style={[styles.leagueOption, isSelected && styles.leagueOptionSelected]}
                                        onPress={() => handleSelectLeague(leagueId)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.leagueOptionContent}>
                                            <View style={styles.leagueOptionLeft}>
                                                <View style={styles.leagueOptionHeader}>
                                                    <Text style={[styles.leagueOptionName, isSelected && styles.leagueOptionNameSelected]}>
                                                        {league.league_name || 'Unnamed League'}
                                                    </Text>
                                                    <View style={styles.leagueOptionIcons}>
                                                        {league.is_private && (
                                                            <View style={styles.optionIconBadge}>
                                                                <Text style={styles.optionIconText}>🔒</Text>
                                                            </View>
                                                        )}
                                                        {league.role === 'admin' && (
                                                            <View style={[styles.optionIconBadge, styles.optionIconBadgeGold]}>
                                                                <Text style={styles.optionIconText}>👑</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                                <View style={styles.leagueOptionMeta}>
                                                    {league.member_count !== undefined && (
                                                        <Text style={styles.leagueOptionMetaText}>
                                                            {league.member_count} {league.member_count === 1 ? 'member' : 'members'}
                                                        </Text>
                                                    )}
                                                    {league.description && (
                                                        <Text style={styles.leagueOptionDescription} numberOfLines={1}>
                                                            {league.description}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                            {isSelected && (
                                                <View style={styles.checkmarkContainer}>
                                                    <View style={styles.checkmark}>
                                                        <Text style={styles.checkmarkText}>✓</Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            contentContainerStyle={styles.modalListContent}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
        marginBottom: 12,
    },
    inputContainer: {
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 16,
        minHeight: 64,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    inputContainerActive: {
        borderColor: '#dc2626',
        backgroundColor: '#fef2f2',
        shadowColor: '#dc2626',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    inputContainerDisabled: {
        opacity: 0.6,
        borderColor: '#f3f4f6',
    },
    selectedLeagueContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectedLeagueMain: {
        flex: 1,
        marginRight: 12,
    },
    selectedLeagueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    selectedLeagueName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    selectedLeagueIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBadgeGold: {
        backgroundColor: '#fef3c7',
    },
    iconText: {
        fontSize: 12,
    },
    selectedLeagueMeta: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    chevronContainer: {
        paddingLeft: 8,
    },
    chevron: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: '700',
    },
    placeholderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    placeholderText: {
        fontSize: 16,
        color: '#9ca3af',
        fontWeight: '500',
    },
    loadingText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 12,
        fontWeight: '500',
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '500',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '88%',
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalHeaderContent: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    modalCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    modalClose: {
        fontSize: 20,
        color: '#6b7280',
        fontWeight: '400',
        lineHeight: 20,
    },
    modalListContent: {
        padding: 20,
    },
    leagueOption: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    leagueOptionSelected: {
        borderColor: '#dc2626',
        backgroundColor: '#fef2f2',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    leagueOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
    },
    leagueOptionLeft: {
        flex: 1,
        marginRight: 12,
    },
    leagueOptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    leagueOptionName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    leagueOptionNameSelected: {
        color: '#dc2626',
    },
    leagueOptionIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    optionIconBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionIconBadgeGold: {
        backgroundColor: '#fef3c7',
    },
    optionIconText: {
        fontSize: 11,
    },
    leagueOptionMeta: {
        gap: 4,
    },
    leagueOptionMetaText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    leagueOptionDescription: {
        fontSize: 13,
        color: '#9ca3af',
        fontStyle: 'italic',
        fontWeight: '400',
    },
    checkmarkContainer: {
        marginLeft: 8,
    },
    checkmark: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    checkmarkText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '900',
    },
    separator: {
        height: 10,
    },
});

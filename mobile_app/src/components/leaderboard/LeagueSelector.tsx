import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

// Local League type for this component (leagues feature is placeholder)
interface League {
    PK?: string;
    league_id?: string;
    league_name?: string;
    description?: string;
    is_private?: boolean;
    role?: string;
}

interface LeagueSelectorProps {
    leagues: League[];
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
    const [isOpen, setIsOpen] = useState(false);

    const selectedLeague = leagues.find(
        (league) => (league.league_id || league.PK?.replace('league#', '')) === selectedLeagueId
    );

    const handleSelectLeague = (leagueId: string) => {
        onLeagueChange(leagueId);
        setIsOpen(false);
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.inputContainer}>
                    <ActivityIndicator size="small" color="#dc2626" />
                    <Text style={styles.loadingText}>LOADING LEAGUES...</Text>
                </View>
            </View>
        );
    }

    if (leagues.length === 0) {
        return (
            <View style={styles.container}>
                <View style={[styles.inputContainer, styles.inputContainerDisabled]}>
                    <Text style={styles.emptyText}>NO LEAGUES AVAILABLE</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>SELECT YOUR LEAGUE</Text>
            
            <TouchableOpacity
                style={[
                    styles.inputContainer, 
                    selectedLeagueId && styles.inputContainerActive,
                    isOpen && styles.inputContainerOpen
                ]}
                onPress={() => setIsOpen(!isOpen)}
                activeOpacity={0.8}
            >
                {selectedLeague ? (
                    <View style={styles.selectedLeagueContent}>
                        <View style={styles.selectedLeagueMain}>
                            <View style={styles.selectedLeagueHeader}>
                                <Text style={styles.selectedLeagueName} numberOfLines={1}>
                                    {selectedLeague.league_name || 'Unnamed League'}
                                </Text>
                                {selectedLeague.role === 'admin' && (
                                    <View style={[styles.iconBadge, styles.iconBadgeGold]}>
                                        <Text style={styles.iconText}>👑</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={styles.chevronContainer}>
                            <Text style={[styles.chevron, isOpen && styles.chevronUpside]}>▼</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.placeholderContent}>
                        <Text style={styles.placeholderText}>Select a league</Text>
                        <Text style={[styles.chevron, isOpen && styles.chevronUpside]}>▼</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Dropdown Content */}
            {isOpen && (
                <View style={styles.dropdownContainer}>
                    <View style={styles.dropdownHeader}>
                        <Text style={styles.dropdownTitle}>MY LEAGUES</Text>
                    </View>
                    <View style={styles.listWrapper}>
                        {leagues.map((league) => {
                            const leagueId = league.league_id || league.PK?.replace('league#', '') || '';
                            const isSelected = selectedLeagueId === leagueId;
                            return (
                                <TouchableOpacity
                                    key={leagueId}
                                    style={[styles.leagueOption, isSelected && styles.leagueOptionSelected]}
                                    onPress={() => handleSelectLeague(leagueId)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.leagueOptionContent}>
                                        <View style={styles.leagueOptionLeft}>
                                            <View style={styles.leagueOptionHeader}>
                                                <Text 
                                                    style={[styles.leagueOptionName, isSelected && styles.leagueOptionNameSelected]}
                                                    numberOfLines={1}
                                                >
                                                    {league.league_name || 'Unnamed League'}
                                                </Text>
                                                {league.role === 'admin' && (
                                                    <View style={[styles.optionIconBadge, styles.optionIconBadgeGold]}>
                                                        <Text style={styles.optionIconText}>👑</Text>
                                                    </View>
                                                )}
                                            </View>
                                            {league.description && (
                                                <Text style={styles.leagueOptionDescription} numberOfLines={1}>
                                                    {league.description}
                                                </Text>
                                            )}
                                        </View>
                                        {isSelected && (
                                            <View style={styles.checkmark}>
                                                <Text style={styles.checkmarkText}>✓</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
        marginBottom: 12,
        zIndex: 1000,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748b',
        marginBottom: 8,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    inputContainer: {
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 52,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    inputContainerActive: {
        borderColor: '#dc2626',
        backgroundColor: '#fff',
    },
    inputContainerOpen: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderColor: '#dc2626',
        shadowOpacity: 0,
    },
    inputContainerDisabled: {
        opacity: 0.6,
        backgroundColor: '#f8fafc',
    },
    selectedLeagueContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectedLeagueMain: {
        flex: 1,
        marginRight: 8,
    },
    selectedLeagueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedLeagueName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginRight: 8,
    },
    iconBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#fef3c7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBadgeGold: {
        backgroundColor: '#fef3c7',
    },
    iconText: {
        fontSize: 10,
    },
    chevronContainer: {
        paddingLeft: 4,
    },
    chevron: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '800',
    },
    chevronUpside: {
        transform: [{ rotate: '180deg' }],
        color: '#dc2626',
    },
    placeholderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    placeholderText: {
        fontSize: 15,
        color: '#94a3b8',
        fontWeight: '500',
    },
    loadingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        marginLeft: 12,
        letterSpacing: 0.5,
    },
    emptyText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94a3b8',
        letterSpacing: 0.5,
    },
    dropdownContainer: {
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: '#dc2626',
        borderTopWidth: 0,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
    },
    dropdownHeader: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dropdownTitle: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1.5,
    },
    listWrapper: {
        maxHeight: 280,
    },
    leagueOption: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    leagueOptionSelected: {
        backgroundColor: '#fef2f2',
    },
    leagueOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leagueOptionLeft: {
        flex: 1,
        marginRight: 12,
    },
    leagueOptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    leagueOptionName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        marginRight: 8,
    },
    leagueOptionNameSelected: {
        color: '#dc2626',
    },
    optionIconBadge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fef3c7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionIconBadgeGold: {
        backgroundColor: '#fef3c7',
    },
    optionIconText: {
        fontSize: 8,
    },
    leagueOptionDescription: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '400',
    },
    checkmark: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmarkText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '900',
    },
});

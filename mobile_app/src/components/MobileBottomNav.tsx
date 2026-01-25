import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TeamIcon } from './icons/TeamIcon';
import { LeaderboardIcon } from './icons/LeaderboardIcon';
import { LeaguesIcon } from './icons/LeaguesIcon';

export type RouteKey = 'myteam' | 'leaderboard' | 'leagues';

type NavItem = {
    key: RouteKey;
    label: string;
    icon: (props: { color: string; size: number }) => React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
    { key: 'myteam', label: 'My Team', icon: TeamIcon },
    { key: 'leaderboard', label: 'Leaderboard', icon: LeaderboardIcon },
    { key: 'leagues', label: 'Leagues', icon: LeaguesIcon },
];

export default function MobileBottomNav({
    currentRoute,
    onNavigate,
    theme = 'light',
}: {
    currentRoute: RouteKey;
    onNavigate: (key: RouteKey) => void;
    theme?: 'light' | 'dark';
}) {
    const insets = useSafeAreaInsets();
    const activeColor = theme === 'dark' ? '#ffffff' : '#dc2626'; // red-600
    const inactiveColor = theme === 'dark' ? '#d1d5db' : '#6b7280'; // gray-500
    const borderColor = theme === 'dark' ? '#374151' : '#e5e7eb'; // gray-200

    return (
        <View style={[styles.container, { borderTopColor: borderColor, paddingBottom: insets.bottom }]}>
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
                const active = currentRoute === key;
                const color = active ? activeColor : inactiveColor;
                return (
                    <TouchableOpacity
                        key={key}
                        style={styles.item}
                        activeOpacity={0.8}
                        onPress={() => onNavigate(key)}
                    >
                        <View style={[styles.iconWrap, active && styles.iconActive]}>
                            <Icon color={color} size={24} />
                        </View>

                        <Text style={[styles.label, { color }]}>{label}</Text>

                        {active && <View style={[styles.activeBar, { backgroundColor: activeColor }]} />}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: 64, // ~ h-16
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#ffffff',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#e5e7eb',
        zIndex: 50,
    },
    item: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        paddingTop: 10,
    },
    iconWrap: {
        marginBottom: 2,
        transform: [{ scale: 1 }],
    },
    iconActive: {
        transform: [{ scale: 1.1 }], // matches your web "scale-110"
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    activeBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
    },
});

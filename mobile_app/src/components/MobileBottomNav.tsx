import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type RouteKey = 'myteam' | 'leaderboard' | 'leagues';

type NavItem = {
    key: RouteKey;
    label: string;
    emoji: string;
};

const NAV_ITEMS: NavItem[] = [
    { key: 'myteam', label: 'My Team', emoji: '🏢' },
    { key: 'leaderboard', label: 'Leaderboard', emoji: '📊' },
    { key: 'leagues', label: 'Leagues', emoji: '🏆' },
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
            {NAV_ITEMS.map(({ key, label, emoji }) => {
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
                            <Text
                                style={[
                                    styles.emoji,
                                    { opacity: active ? 1 : 0.6 },
                                    Platform.OS === 'ios' ? { fontFamily: 'System' } : null, // avoid custom fonts breaking emojis
                                ]}
                            >
                                {emoji}
                            </Text>
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
    },
    iconWrap: {
        marginBottom: 4,
        transform: [{ scale: 1 }],
    },
    iconActive: {
        transform: [{ scale: 1.1 }], // matches your web "scale-110"
    },
    emoji: {
        fontSize: 22, // roughly a 24x24 icon box
        lineHeight: 24,
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

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useData } from '../contexts/DataContext';

type AppHeaderProps = {
    onProfilePress: () => void;
};

export default function AppHeader({ onProfilePress }: AppHeaderProps) {
    const { profile } = useData();

    const getInitials = (username?: string, email?: string): string => {
        const name = username || email || 'U';
        const parts = name.split(/[\s@.]/).filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                {/* Red line/graphic element - stylized track/graph */}
                <View style={styles.logoGraphic}>
                    <Svg width="60" height="5" viewBox="0 0 60 5" fill="none">
                        <Path
                            d="M0 3 C10 1, 20 1, 30 3 C40 5, 50 5, 60 3"
                            stroke="#dc2626"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            fill="none"
                        />
                    </Svg>
                </View>
                {/* Logo text */}
                <View style={styles.logoTextContainer}>
                    <Text style={styles.logoApex}>APEX</Text>
                    <Text style={styles.logoPredictions}>PREDICTIONS</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.profileButton}
                onPress={onProfilePress}
                activeOpacity={0.7}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {getInitials(profile?.username, profile?.email)}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e5e7eb',
    },
    logoContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    logoGraphic: {
        marginBottom: 4,
        height: 5,
        width: 60,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    logoTextContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    logoApex: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
        lineHeight: 24,
    },
    logoPredictions: {
        fontSize: 10,
        fontWeight: '600',
        color: '#dc2626',
        letterSpacing: 0.5,
        marginTop: -2,
    },
    profileButton: {
        padding: 4,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
});


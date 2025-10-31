import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface RulesScoringButtonProps {
    onPress: () => void;
    variant?: 'full' | 'icon';
}

export default function RulesScoringButton({ onPress, variant = 'full' }: RulesScoringButtonProps) {
    if (variant === 'icon') {
        return (
            <TouchableOpacity style={styles.iconButton} onPress={onPress} activeOpacity={0.7}>
                <View style={styles.iconContainerSmall}>
                    <Text style={styles.iconTextSmall}>?</Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.iconContainer}>
                <Text style={styles.iconText}>?</Text>
            </View>
            <Text style={styles.buttonText}>Rules & Scoring</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    iconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    iconText: {
        color: '#dc2626',
        fontSize: 16,
        fontWeight: '700',
    },
    buttonText: {
        color: '#dc2626',
        fontSize: 16,
        fontWeight: '700',
    },
    // Icon-only variant (Johnny Ive style - minimal and elegant)
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    iconContainerSmall: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconTextSmall: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '700',
    },
});


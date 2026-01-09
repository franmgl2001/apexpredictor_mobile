import React from 'react';
import { Text } from 'react-native';

const COUNTRY_FLAGS: Record<string, string> = {
    Bahrain: '🇧🇭',
    'Saudi Arabia': '🇸🇦',
    Australia: '🇦🇺',
    Japan: '🇯🇵',
    China: '🇨🇳',
    Miami: '🇺🇸',
    'Emilia-Romagna': '🇮🇹',
    Monaco: '🇲🇨',
    Canada: '🇨🇦',
    Spain: '🇪🇸',
    Austria: '🇦🇹',
    'Great Britain': '🇬🇧',
    'United Kingdom': '🇬🇧',
    UK: '🇬🇧',
    Hungary: '🇭🇺',
    Belgium: '🇧🇪',
    Netherlands: '🇳🇱',
    Italy: '🇮🇹',
    Singapore: '🇸🇬',
    'United States': '🇺🇸',
    Mexico: '🇲🇽',
    Brazil: '🇧🇷',
    'Las Vegas': '🇺🇸',
    Qatar: '🇶🇦',
    'Abu Dhabi': '🇦🇪',
    'United Arab Emirates': '🇦🇪',
    UAE: '🇦🇪',
    Azerbaijan: '🇦🇿',
};

function resolveFlag(country: string): string {
    if (COUNTRY_FLAGS[country]) return COUNTRY_FLAGS[country];
    const key = Object.keys(COUNTRY_FLAGS).find((k) => k.toLowerCase().trim() === country.toLowerCase().trim());
    return key ? COUNTRY_FLAGS[key] : '🏁';
}

export default function CountryFlag({ country, size = 18 }: { country: string; size?: number }) {
    return <Text style={{ fontSize: size, lineHeight: size + 2 }}>{resolveFlag(country)}</Text>;
}



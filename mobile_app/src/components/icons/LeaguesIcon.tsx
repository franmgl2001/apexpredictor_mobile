import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export const LeaguesIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Primary person */}
        <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <Circle cx="9" cy="7" r="4" />
        
        {/* Secondary person behind */}
        <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
);


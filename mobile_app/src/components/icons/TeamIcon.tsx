import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

export const TeamIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <Path d="M10 22v-3h4v3" />
        <Circle cx="8.5" cy="6" r="1" fill={color} stroke="none" />
        <Circle cx="15.5" cy="6" r="1" fill={color} stroke="none" />
        <Circle cx="8.5" cy="10" r="1" fill={color} stroke="none" />
        <Circle cx="15.5" cy="10" r="1" fill={color} stroke="none" />
        <Circle cx="8.5" cy="14" r="1" fill={color} stroke="none" />
        <Circle cx="15.5" cy="14" r="1" fill={color} stroke="none" />
        <Circle cx="8.5" cy="18" r="1" fill={color} stroke="none" />
        <Circle cx="15.5" cy="18" r="1" fill={color} stroke="none" />
    </Svg>
);


import React from 'react';
import Svg, { Rect } from 'react-native-svg';

export const LeaderboardIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect 
            x="3" 
            y="12" 
            width="4" 
            height="9" 
            rx="2" 
            fill={color} 
        />
        <Rect 
            x="10" 
            y="7" 
            width="4" 
            height="14" 
            rx="2" 
            fill={color} 
        />
        <Rect 
            x="17" 
            y="3" 
            width="4" 
            height="18" 
            rx="2" 
            fill={color} 
        />
    </Svg>
);


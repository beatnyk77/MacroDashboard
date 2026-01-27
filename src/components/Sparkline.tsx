import React from 'react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import { useTheme } from '@mui/material';

interface SparklineProps {
    data: { date: string; value: number }[];
    color?: string;
    height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, color, height = 40 }) => {
    const theme = useTheme();
    const strokeColor = color || theme.palette.primary.main;

    if (!data || data.length === 0) return null;

    return (
        <div style={{ height, width: '100%', minWidth: 60 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`gradient-${strokeColor}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        fill={`url(#gradient-${strokeColor})`}
                        strokeWidth={1.5}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

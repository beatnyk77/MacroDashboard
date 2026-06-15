import React from 'react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';

interface SparklineImplProps {
    data: { date: string; value: number }[];
    color?: string;
    height?: number;
}

export const SparklineImpl: React.FC<SparklineImplProps> = ({ data, color, height = 40 }) => {
    const strokeColor = color || '#94a3b8';

    if (!data || data.length === 0) return null;

    return (
        <div style={{ height, width: '100%', minWidth: 60 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`gradient-${strokeColor}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        fill={`url(#gradient-${strokeColor})`}
                        strokeWidth={1.2}
                        isAnimationActive={false}
                        dot={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
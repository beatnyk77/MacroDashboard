import React from 'react';
import { Box, Typography } from '@mui/material';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const edrData = [
    { country: 'India', edr: 88, oilCADImpact: 15 },
    { country: 'Japan', edr: 92, oilCADImpact: 22 },
    { country: 'Germany', edr: 65, oilCADImpact: 9 },
    { country: 'China', edr: 18, oilCADImpact: 4 },
    { country: 'USA', edr: -3, oilCADImpact: -1 },
    { country: 'Russia', edr: -180, oilCADImpact: -40 },
    { country: 'Saudi', edr: -210, oilCADImpact: -55 },
];

function EdrTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
    if (active && payload && payload.length) {
        return (
            <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{label}</Typography>
                {payload.map(p => (
                    <Typography key={p.name} variant="caption" display="block" sx={{ color: p.value < 0 ? '#22c55e' : '#f87171' }}>
                        EDR: {p.value}%
                    </Typography>
                ))}
            </Box>
        );
    }
    return null;
}

export const EnergyDependencyRatioChart: React.FC = () => (
    <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={edrData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} domain={[-250, 100]} unit="%" />
            <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: '#94a3b8' }} width={55} />
            <Tooltip content={<EdrTooltip />} />
            <Bar dataKey="edr" fill="#10b981" radius={[0, 3, 3, 0]}
                label={{ position: 'right', fontSize: 10, fill: '#94a3b8', formatter: (v: number) => `${v}%` }} />
        </ComposedChart>
    </ResponsiveContainer>
);
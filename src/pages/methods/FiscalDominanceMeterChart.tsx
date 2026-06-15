import React from 'react';
import { Box, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

const fdmData = [
    { year: '2000', us: 12.1, japan: 21.3, india: 30.2 },
    { year: '2003', us: 10.8, japan: 23.1, india: 28.5 },
    { year: '2006', us: 11.4, japan: 25.0, india: 23.1 },
    { year: '2009', us: 12.3, japan: 28.4, india: 20.1 },
    { year: '2012', us: 11.2, japan: 31.2, india: 22.0 },
    { year: '2015', us: 8.3, japan: 30.8, india: 19.5 },
    { year: '2018', us: 9.0, japan: 29.1, india: 18.2 },
    { year: '2020', us: 10.1, japan: 26.5, india: 17.8 },
    { year: '2022', us: 12.5, japan: 25.2, india: 19.8 },
    { year: '2023', us: 17.8, japan: 26.0, india: 20.4 },
    { year: '2024', us: 21.3, japan: 25.8, india: 19.1 },
];

function FdmTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
    if (active && payload && payload.length) {
        return (
            <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>{label}</Typography>
                {payload.map(p => (
                    <Typography key={p.name} variant="caption" display="block" sx={{ color: p.color }}>
                        {p.name}: {p.value.toFixed(1)}%
                        {p.value > 20 ? ' ⚠️' : ''}
                    </Typography>
                ))}
            </Box>
        );
    }
    return null;
}

export const FiscalDominanceMeterChart: React.FC = () => (
    <ResponsiveContainer width="100%" height={280}>
        <LineChart data={fdmData} margin={{ top: 5, right: 20, left: -5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[5, 40]} unit="%" />
            <Tooltip content={<FdmTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />
            <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: 'Fiscal Dominance Zone', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
            <Line type="monotone" dataKey="us" name="United States" stroke="#ef4444" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="japan" name="Japan" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="6 3" />
            <Line type="monotone" dataKey="india" name="India" stroke="#818cf8" strokeWidth={2} dot={false} strokeDasharray="3 3" />
        </LineChart>
    </ResponsiveContainer>
);
import React from 'react';
import { Box, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const debtGoldData = [
    { year: '2000', zscore: -0.8 },
    { year: '2002', zscore: -0.5 },
    { year: '2004', zscore: 0.1 },
    { year: '2006', zscore: 0.6 },
    { year: '2008', zscore: 1.1 },
    { year: '2010', zscore: 0.4 },
    { year: '2012', zscore: 0.9 },
    { year: '2014', zscore: 1.3 },
    { year: '2016', zscore: 1.4 },
    { year: '2018', zscore: 1.7 },
    { year: '2020', zscore: 2.0 },
    { year: '2022', zscore: 1.5 },
    { year: '2024', zscore: 2.3 },
];

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
    if (active && payload && payload.length) {
        const z = payload[0].value;
        return (
            <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={700} color={z > 2.0 ? '#f59e0b' : z > 1.0 ? '#fb923c' : '#94a3b8'}>
                    Z = {z > 0 ? '+' : ''}{z.toFixed(1)}σ
                </Typography>
            </Box>
        );
    }
    return null;
}

export const DebtGoldZScoreChart: React.FC = () => (
    <>
        <ResponsiveContainer width="100%" height={240}>
            <BarChart data={debtGoldData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[-1.5, 2.8]} />
                <Tooltip content={<BarTooltip />} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                <ReferenceLine y={2.0} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.6} />
                <Bar dataKey="zscore" radius={[3, 3, 0, 0]}>
                    {debtGoldData.map((entry) => (
                        <Cell key={entry.year} fill={entry.zscore > 2.0 ? '#f59e0b' : entry.zscore > 1.0 ? '#fb923c' : '#3b82f6'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
        <Box display="flex" gap={3} mt={2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 12, height: 12, bgcolor: '#f59e0b', borderRadius: '2px' }} /><Typography variant="caption" color="text.secondary">Z &gt; +2.0σ (Extreme gold undervaluation signal)</Typography></Box>
            <Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 12, height: 12, bgcolor: '#fb923c', borderRadius: '2px' }} /><Typography variant="caption" color="text.secondary">Z +1.0σ to +2.0σ (Elevated)</Typography></Box>
        </Box>
    </>
);
import React from 'react';
import { Box, Typography } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const netLiqData = [
    { date: 'Jan 2020', value: 0.3, zscore: 0.4 },
    { date: 'Apr 2020', value: -1.8, zscore: -2.1 },
    { date: 'Jul 2020', value: 1.2, zscore: 1.5 },
    { date: 'Jan 2021', value: 2.1, zscore: 2.4 },
    { date: 'Jul 2021', value: 1.8, zscore: 2.0 },
    { date: 'Jan 2022', value: 0.6, zscore: 0.8 },
    { date: 'Jul 2022', value: -1.4, zscore: -1.7 },
    { date: 'Jan 2023', value: -0.9, zscore: -1.1 },
    { date: 'Jul 2023', value: 0.2, zscore: 0.3 },
    { date: 'Jan 2024', value: 0.8, zscore: 1.0 },
    { date: 'Jul 2024', value: 1.1, zscore: 1.3 },
    { date: 'Jan 2025', value: 0.5, zscore: 0.6 },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
    if (active && payload && payload.length) {
        const z = payload[0].value;
        return (
            <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={700} color={z > 0 ? '#22c55e' : '#ef4444'}>
                    Z = {z > 0 ? '+' : ''}{z.toFixed(2)}σ
                </Typography>
            </Box>
        );
    }
    return null;
}

export const NetLiquidityZScoreChart: React.FC = () => (
    <>
        <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={netLiqData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                    <linearGradient id="nlGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[-2.5, 3]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                <ReferenceLine y={1.5} stroke="#22c55e" strokeDasharray="5 5" strokeOpacity={0.5} />
                <ReferenceLine y={-1.5} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="zscore" stroke="#3b82f6" fill="url(#nlGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
        </ResponsiveContainer>
        <Box display="flex" gap={3} mt={2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 20, height: 2, bgcolor: '#22c55e', opacity: 0.5 }}/><Typography variant="caption" color="text.secondary">+1.5σ Bull threshold</Typography></Box>
            <Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 20, height: 2, bgcolor: '#ef4444', opacity: 0.5 }}/><Typography variant="caption" color="text.secondary">−1.5σ Bear threshold</Typography></Box>
        </Box>
    </>
);
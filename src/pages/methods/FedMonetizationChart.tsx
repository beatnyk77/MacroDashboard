import React from 'react';
import { Box, Typography } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const monetizationData = [
    { year: '2000', ratio: 5.2 },
    { year: '2002', ratio: 6.1 },
    { year: '2004', ratio: 6.8 },
    { year: '2006', ratio: 6.3 },
    { year: '2008', ratio: 7.4 },
    { year: '2010', ratio: 12.6 },
    { year: '2012', ratio: 16.1 },
    { year: '2014', ratio: 18.7 },
    { year: '2016', ratio: 17.2 },
    { year: '2018', ratio: 15.8 },
    { year: '2020', ratio: 22.4 },
    { year: '2022', ratio: 19.3 },
    { year: '2024', ratio: 17.1 },
    { year: '2026', ratio: 16.4 },
];

function AreaTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
    if (active && payload && payload.length) {
        const v = payload[0].value;
        return (
            <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={700} color={v > 20 ? '#f59e0b' : v > 15 ? '#fb923c' : '#94a3b8'}>
                    {v.toFixed(1)}%
                </Typography>
            </Box>
        );
    }
    return null;
}

export const FedMonetizationChart: React.FC = () => (
    <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={monetizationData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
                <linearGradient id="monetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 28]} unit="%" />
            <Tooltip content={<AreaTooltip />} />
            <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.7} label={{ value: 'YCC threshold', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
            <Area type="monotone" dataKey="ratio" stroke="#6366f1" strokeWidth={2} fill="url(#monetGrad)" dot={false} />
        </AreaChart>
    </ResponsiveContainer>
);
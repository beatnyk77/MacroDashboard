import React from 'react';
import { Box, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ljeData = [
    { quarter: 'Q1 22', creditGrowth: 8.2, epfo: 1450, ratio: 5.7 },
    { quarter: 'Q2 22', creditGrowth: 12.0, epfo: 1520, ratio: 7.9 },
    { quarter: 'Q3 22', creditGrowth: 17.1, epfo: 1640, ratio: 10.4 },
    { quarter: 'Q4 22', creditGrowth: 16.4, epfo: 1700, ratio: 9.6 },
    { quarter: 'Q1 23', creditGrowth: 15.8, epfo: 1580, ratio: 10.0 },
    { quarter: 'Q2 23', creditGrowth: 16.2, epfo: 1490, ratio: 10.9 },
    { quarter: 'Q3 23', creditGrowth: 14.9, epfo: 1620, ratio: 9.2 },
    { quarter: 'Q4 23', creditGrowth: 16.1, epfo: 1550, ratio: 10.4 },
    { quarter: 'Q1 24', creditGrowth: 15.5, epfo: 1430, ratio: 10.8 },
    { quarter: 'Q2 24', creditGrowth: 14.8, epfo: 1510, ratio: 9.8 },
    { quarter: 'Q3 24', creditGrowth: 13.2, epfo: 1460, ratio: 9.0 },
    { quarter: 'Q4 24', creditGrowth: 11.8, epfo: 1540, ratio: 7.7 },
];

function LjTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
    if (active && payload && payload.length) {
        return (
            <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>{label}</Typography>
                {payload.map(p => (
                    <Typography key={p.name} variant="caption" display="block" sx={{ color: p.color }}>
                        {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                        {p.name === 'Credit Growth' ? '%' : p.name === 'EPFO Additions' ? 'k' : 'x'}
                    </Typography>
                ))}
            </Box>
        );
    }
    return null;
}

export const LoanToJobEfficiencyChart: React.FC = () => (
    <ResponsiveContainer width="100%" height={260}>
        <LineChart data={ljeData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} domain={[5, 20]} label={{ value: 'Credit %', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} domain={[1200, 1800]} label={{ value: 'EPFO (k)', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 10 }} />
            <Tooltip content={<LjTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />
            <Line yAxisId="left" type="monotone" dataKey="creditGrowth" name="Credit Growth" stroke="#818cf8" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="epfo" name="EPFO Additions" stroke="#34d399" strokeWidth={2} dot={false} strokeDasharray="5 5" />
        </LineChart>
    </ResponsiveContainer>
);
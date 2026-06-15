import React from 'react';
import { Box, Typography } from '@mui/material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';

const ratioData = [
    { year: '2000', ratio: 100, label: 'Gold $279' },
    { year: '2001', ratio: 93,  label: 'Bull begins' },
    { year: '2003', ratio: 84 },
    { year: '2005', ratio: 78 },
    { year: '2007', ratio: 82 },
    { year: '2008', ratio: 98,  label: 'GFC QE' },
    { year: '2009', ratio: 88 },
    { year: '2011', ratio: 72,  label: 'Gold $1,900' },
    { year: '2013', ratio: 88 },
    { year: '2015', ratio: 102, label: 'Gold $1,050' },
    { year: '2017', ratio: 108 },
    { year: '2019', ratio: 112 },
    { year: '2020', ratio: 148, label: 'COVID surge' },
    { year: '2021', ratio: 138 },
    { year: '2022', ratio: 128, label: 'Fed QT' },
    { year: '2023', ratio: 124 },
    { year: '2024', ratio: 118, label: 'Gold $2,400+' },
    { year: '2025', ratio: 108, label: 'Gold $3,000+' },
];

function RatioTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
    if (active && payload && payload.length) {
        const val = payload[0].value;
        const entry = ratioData.find(d => d.year === label);
        return (
            <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 1, minWidth: 160 }}>
                <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                <Typography variant="body2" fontWeight={700} color={val > 130 ? '#ef4444' : val < 85 ? '#22c55e' : '#f59e0b'}>
                    Index: {val}
                </Typography>
                {entry?.label && (
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>{entry.label}</Typography>
                )}
            </Box>
        );
    }
    return null;
}

export const M2GoldRatioChart: React.FC = () => (
    <>
        <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ratioData} margin={{ top: 5, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[60, 160]} />
                <Tooltip content={<RatioTooltip />} />
                <ReferenceArea y1={130} y2={160} fill="rgba(245,158,11,0.06)" />
                <ReferenceLine y={130} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.5}
                    label={{ value: 'Extreme zone', position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }} />
                <ReferenceLine y={100} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
                <Line
                    type="monotone"
                    dataKey="ratio"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#f59e0b' }}
                />
            </LineChart>
        </ResponsiveContainer>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}>
            Note: Illustrative reconstruction using publicly available M2 and gold price data. Live readings available on the GraphiQuestor M2/Gold Ratio glossary page.
        </Typography>
    </>
);
import React from 'react';
import { Box, Typography } from '@mui/material';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const quadrantData = [
    { creditGrowth: 14.2, cdRatio: 76, year: '2007', quadrant: 'Expansion' },
    { creditGrowth: 22.3, cdRatio: 74, year: '2008', quadrant: 'Expansion' },
    { creditGrowth: 17.1, cdRatio: 72, year: '2009', quadrant: 'Expansion' },
    { creditGrowth: 21.3, cdRatio: 73, year: '2010', quadrant: 'Expansion' },
    { creditGrowth: 19.9, cdRatio: 75, year: '2011', quadrant: 'Expansion' },
    { creditGrowth: 16.8, cdRatio: 77, year: '2012', quadrant: 'Expansion' },
    { creditGrowth: 15.2, cdRatio: 78, year: '2013', quadrant: 'Downturn' },
    { creditGrowth: 9.4, cdRatio: 76, year: '2014', quadrant: 'Downturn' },
    { creditGrowth: 8.7, cdRatio: 74, year: '2015', quadrant: 'Downturn' },
    { creditGrowth: 5.1, cdRatio: 72, year: '2016', quadrant: 'Repair' },
    { creditGrowth: 6.2, cdRatio: 71, year: '2017', quadrant: 'Repair' },
    { creditGrowth: 12.4, cdRatio: 73, year: '2018', quadrant: 'Recovery' },
    { creditGrowth: 6.7, cdRatio: 71, year: '2019', quadrant: 'Repair' },
    { creditGrowth: 5.5, cdRatio: 68, year: '2020', quadrant: 'Repair' },
    { creditGrowth: 9.3, cdRatio: 70, year: '2021', quadrant: 'Recovery' },
    { creditGrowth: 14.9, cdRatio: 73, year: '2022', quadrant: 'Expansion' },
    { creditGrowth: 15.4, cdRatio: 76, year: '2023', quadrant: 'Expansion' },
    { creditGrowth: 13.1, cdRatio: 77, year: '2024', quadrant: 'Expansion' },
    { creditGrowth: 11.2, cdRatio: 78, year: '2025', quadrant: 'Downturn' },
];

const quadrantColors: Record<string, string> = {
    Expansion: '#22c55e',
    Recovery: '#3b82f6',
    Downturn: '#f59e0b',
    Repair: '#ef4444',
};

function ScatterTooltipContent({ active, payload }: { active?: boolean; payload?: { payload: typeof quadrantData[0] }[] }) {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">{d.year}</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: quadrantColors[d.quadrant] }}>{d.quadrant}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">Credit Growth: {d.creditGrowth}% YoY</Typography>
                <Typography variant="caption" color="text.secondary" display="block">CD Ratio: {d.cdRatio}%</Typography>
            </Box>
        );
    }
    return null;
}

export const IndiaCreditCycleChart: React.FC = () => (
    <>
        <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="creditGrowth" name="Credit Growth YoY %" type="number" domain={[0, 26]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <YAxis dataKey="cdRatio" name="CD Ratio" type="number" domain={[62, 84]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip content={<ScatterTooltipContent />} />
                <ReferenceLine x={12} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                <ReferenceLine y={74} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                <Scatter
                    data={quadrantData}
                    fill="#6366f1"
                    shape={(props: { cx?: number; cy?: number; payload?: typeof quadrantData[0] }) => {
                        const { cx = 0, cy = 0, payload } = props;
                        const color = payload ? quadrantColors[payload.quadrant] : '#6366f1';
                        return <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.8} />;
                    }}
                />
            </ScatterChart>
        </ResponsiveContainer>
        <Box display="flex" gap={3} mt={2} flexWrap="wrap">
            {Object.entries(quadrantColors).map(([name, color]) => (
                <Box key={name} display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                    <Typography variant="caption" color="text.secondary">{name}</Typography>
                </Box>
            ))}
        </Box>
    </>
);
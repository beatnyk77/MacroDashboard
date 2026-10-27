import React from 'react';
import { Typography } from '@mui/material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ReferenceLine, ReferenceArea
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';
import { TerminalTooltipShell, TerminalTooltipLabel, TerminalTooltipRow } from '@/components/charts/TerminalChartTooltip';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

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
            <TerminalTooltipShell className="min-w-[160px]">
                <TerminalTooltipLabel>{label}</TerminalTooltipLabel>
                <TerminalTooltipRow label="Index" valueClassName={val > 130 ? 'text-red-400' : val < 85 ? 'text-emerald-400' : 'text-amber-400'}>
                    {val}
                </TerminalTooltipRow>
                {entry?.label && (
                    <div className="mt-1 text-xs text-slate-400">{entry.label}</div>
                )}
            </TerminalTooltipShell>
        );
    }
    return null;
}

export const M2GoldRatioChart: React.FC = () => (
    <>
        {/* SEO & Accessibility Fallback Data */}
        <table className="sr-only">
            <caption>Historical M2 to Gold Ratio Data</caption>
            <thead>
                <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Ratio Index</th>
                    <th scope="col">Historical Event</th>
                </tr>
            </thead>
            <tbody>
                {ratioData.map((row) => (
                    <tr key={row.year}>
                        <td>{row.year}</td>
                        <td>{row.ratio}</td>
                        <td>{row.label || ''}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <MacroChartContainer height={CHART_HEIGHTS.standard}>
            <LineChart data={ratioData} margin={{ top: 5, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="year" />
                <YAxis {...DEFAULT_YAXIS_PROPS} width={60} domain={[60, 160]} />
                <Tooltip content={<RatioTooltip />} />
                <ReferenceArea y1={130} y2={160} fill={alpha(CHART_COLORS.gold, 0.06)} />
                <ReferenceLine y={130} stroke={CHART_COLORS.gold} strokeDasharray="5 5" strokeOpacity={0.5}
                    label={{ value: 'Extreme zone', position: 'insideTopRight', fontSize: 11, fill: CHART_COLORS.gold }} />
                <ReferenceLine y={100} stroke={WHITE_ALPHA.soft} strokeDasharray="3 3" />
                <Line
                    type="monotone"
                    dataKey="ratio"
                    stroke={CHART_COLORS.gold}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: CHART_COLORS.gold }}
                />
            </LineChart>
        </MacroChartContainer>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}>
            Note: Illustrative reconstruction using publicly available M2 and gold price data. Live readings available on the GraphiQuestor M2/Gold Ratio glossary page.
        </Typography>
    </>
);
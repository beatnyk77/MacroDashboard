import React, { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';
import type { DossierUnit } from '../dossierRegistry';
import { downsample, findGaps, shiftDate, type SeriesPoint } from '../dossierStats';
import { formatDate, formatValue } from '../dossierNarrative';

export interface ChartEpisode {
    n: number;
    date: string;
    label: string;
}

interface DossierChartProps {
    points: SeriesPoint[];
    unit: DossierUnit;
    decimals: number;
    logScaleDefault?: boolean;
    episodes: ChartEpisode[];
    monthly: boolean;
}

const RANGES = [
    { key: 'max', label: 'Max', years: Infinity },
    { key: '20y', label: '20Y', years: 20 },
    { key: '10y', label: '10Y', years: 10 },
    { key: '5y', label: '5Y', years: 5 },
    { key: '1y', label: '1Y', years: 1 },
] as const;

type RangeKey = (typeof RANGES)[number]['key'];

const MAX_CHART_POINTS = 1200;
const toTime = (d: string) => Date.parse(`${d}T00:00:00Z`);

export const DossierChart: React.FC<DossierChartProps> = ({ points, unit, decimals, logScaleDefault, episodes, monthly }) => {
    const allPositive = useMemo(() => points.every((p) => p.value > 0), [points]);
    const [range, setRange] = useState<RangeKey>('max');
    const [log, setLog] = useState(Boolean(logScaleDefault) && allPositive);

    const coverageYears = points.length > 1
        ? (toTime(points[points.length - 1].date) - toTime(points[0].date)) / (365.25 * 86_400_000)
        : 0;
    const availableRanges = RANGES.filter((r) => r.key === 'max' || r.years < coverageYears);

    const data = useMemo(() => {
        const years = RANGES.find((r) => r.key === range)?.years ?? Infinity;
        const latest = points[points.length - 1]?.date;
        const from = Number.isFinite(years) && latest ? shiftDate(latest, { years: -years }) : '';
        const visible = from ? points.filter((p) => p.date >= from) : points;
        const rows: { t: number; value: number | null }[] = downsample(visible, MAX_CHART_POINTS).map((p) => ({
            t: toTime(p.date),
            value: p.value,
        }));
        // Break the line across missing stretches instead of drawing through them.
        for (const g of findGaps(visible)) rows.push({ t: (toTime(g.from) + toTime(g.to)) / 2, value: null });
        return rows.sort((a, b) => a.t - b.t);
    }, [points, range]);

    const domainStart = data[0]?.t ?? 0;
    const domainEnd = data[data.length - 1]?.t ?? 0;
    const spanYears = (domainEnd - domainStart) / (365.25 * 86_400_000);
    const tickDate = (t: number) => {
        const iso = new Date(t).toISOString().slice(0, 10);
        return spanYears > 3 ? iso.slice(0, 4) : formatDate(iso, true);
    };
    const visibleEpisodes = episodes.filter((e) => {
        const t = toTime(e.date);
        return t >= domainStart && t <= domainEnd;
    });

    return (
        <div>
            <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Chart range">
                {availableRanges.map((r) => (
                    <button
                        key={r.key}
                        type="button"
                        onClick={() => setRange(r.key)}
                        aria-pressed={range === r.key}
                        className={cn(
                            'min-h-[32px] rounded px-3 font-mono text-xs font-medium transition-colors',
                            range === r.key
                                ? 'border border-border bg-muted text-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {r.label}
                    </button>
                ))}
                {allPositive && (
                    <button
                        type="button"
                        onClick={() => setLog((v) => !v)}
                        aria-pressed={log}
                        className={cn(
                            'ml-auto min-h-[32px] rounded px-3 text-xs font-semibold transition-colors',
                            log ? 'border border-border bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        Log scale
                    </button>
                )}
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
                        <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.6} vertical={false} />
                        <XAxis
                            dataKey="t"
                            type="number"
                            scale="time"
                            domain={[domainStart, domainEnd]}
                            tickFormatter={tickDate}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontFamily: 'Fira Code' }}
                            minTickGap={40}
                            stroke="hsl(var(--border))"
                        />
                        <YAxis
                            scale={log ? 'log' : 'linear'}
                            domain={['auto', 'auto']}
                            allowDataOverflow={log}
                            width={72}
                            tickFormatter={(v: number) => formatValue(v, unit, Math.min(decimals, 2))}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontFamily: 'Fira Code' }}
                            stroke="hsl(var(--border))"
                        />
                        <Tooltip
                            labelFormatter={(t: number) => formatDate(new Date(t).toISOString().slice(0, 10), monthly)}
                            formatter={(v: number) => [formatValue(v, unit, decimals), 'Value']}
                            contentStyle={{
                                background: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 4,
                                fontSize: 12,
                                fontFamily: 'Fira Code',
                            }}
                            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                        />
                        {visibleEpisodes.map((e) => (
                            <ReferenceLine
                                key={e.n}
                                x={toTime(e.date)}
                                stroke="hsl(var(--muted-foreground))"
                                strokeDasharray="3 3"
                                strokeOpacity={0.7}
                                label={{ value: String(e.n), position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            />
                        ))}
                        <Line type="linear" dataKey="value" stroke="hsl(var(--chart-2))" strokeWidth={1.75} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

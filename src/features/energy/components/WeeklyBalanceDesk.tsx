import React, { useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts';
import { DataStatePanel } from '@/components/DataStatePanel';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { FreshnessChip } from '@/components/FreshnessChip';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';
import { ChartAccessibleTranscript } from '@/components/charts/ChartAccessibleTranscript';
import {
    CHART_COLORS,
    CHART_HEIGHTS,
    DEFAULT_CARTESIAN_GRID_PROPS,
    DEFAULT_TOOLTIP_ITEM_STYLE,
    DEFAULT_TOOLTIP_LABEL_STYLE,
    DEFAULT_TOOLTIP_STYLE,
    DEFAULT_XAXIS_PROPS,
    DEFAULT_YAXIS_PROPS,
} from '@/constants/chartDefaults';
import { cn } from '@/lib/utils';
import { useWeeklyBalance, type WeeklyBalanceData, type WeeklyBalanceKey } from '@/features/energy/hooks/useWeeklyBalance';
import {
    chartRows,
    daysOfCover,
    fourWeekAverage,
    fourWeekAverageYearAgo,
    latestVsBand,
    pctChange,
    releaseStatus,
    sortAsc,
    type LatestVsBand,
} from '@/features/energy/lib/weeklyBalance';

type StockKey = Extract<WeeklyBalanceKey, 'crude' | 'cushing' | 'gasoline' | 'distillate' | 'jet' | 'spr'>;

const STOCK_ROWS: Array<{ key: StockKey; label: string }> = [
    { key: 'crude', label: 'Commercial crude (ex-SPR)' },
    { key: 'cushing', label: 'Cushing crude' },
    { key: 'gasoline', label: 'Total gasoline' },
    { key: 'distillate', label: 'Distillate fuel oil' },
    { key: 'jet', label: 'Jet fuel' },
    { key: 'spr', label: 'Strategic Petroleum Reserve' },
];

const CHART_CHOICES: StockKey[] = ['crude', 'cushing', 'gasoline', 'distillate'];

const fmt = (v: number | null, digits = 1) =>
    v === null ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });

const signed = (v: number | null, digits = 1) =>
    v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

/** Below the 5-year average reads tighter (amber); above reads looser (blue). Zero or unknown is neutral. */
const deviationTone = (v: number | null) =>
    v === null || v === 0 ? 'text-muted-foreground' : v < 0 ? 'text-amber-400' : 'text-sky-400';

function RangeBar({ position }: { position: number | null }) {
    if (position === null) return <span className="text-muted-foreground">—</span>;
    const clamped = Math.min(1, Math.max(0, position));
    return (
        <div
            className="relative h-2 w-28 rounded-full bg-white/10"
            role="img"
            aria-label={`${Math.round(position * 100)}% of the way from the 5-year low to the 5-year high`}
        >
            <div
                className={cn('absolute top-1/2 h-3.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm', position < 0 || position > 1 ? 'bg-rose-400' : 'bg-amber-400')}
                style={{ left: `${clamped * 100}%` }}
            />
        </div>
    );
}

function StatTile({ label, value, context }: { label: string; value: React.ReactNode; context: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-2 text-2xl font-bold tabular-nums tracking-heading text-foreground">{value}</div>
            <div className="mt-1.5 text-[11px] font-semibold uppercase leading-relaxed tracking-wider text-muted-foreground">{context}</div>
        </div>
    );
}

function StocksTable({ rows }: { rows: Array<{ label: string; r: LatestVsBand | null }> }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
                <caption className="sr-only">US petroleum stocks against the 5-year range, million barrels</caption>
                <thead>
                    <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <th scope="col" className="py-2 pr-3">Stock</th>
                        <th scope="col" className="py-2 pr-3 text-right">Mb</th>
                        <th scope="col" className="py-2 pr-3 text-right">Wk chg</th>
                        <th scope="col" className="py-2 pr-3 text-right">vs 5-yr avg</th>
                        <th scope="col" className="py-2 pr-3 text-right">%</th>
                        <th scope="col" className="py-2 pr-3 text-right">5-yr range</th>
                        <th scope="col" className="py-2">Position</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(({ label, r }) => (
                        <tr key={label} className="border-b border-border/60 tabular-nums">
                            <th scope="row" className="py-2.5 pr-3 font-semibold text-foreground">{label}</th>
                            {r ? (
                                <>
                                    <td className="py-2.5 pr-3 text-right font-bold text-foreground">{fmt(r.value)}</td>
                                    <td className={cn('py-2.5 pr-3 text-right', r.weeklyChange === null || r.weeklyChange === 0 ? 'text-muted-foreground' : r.weeklyChange < 0 ? 'text-amber-400' : 'text-sky-400')}>
                                        {signed(r.weeklyChange)}
                                    </td>
                                    <td className={cn('py-2.5 pr-3 text-right', deviationTone(r.deviation))}>{signed(r.deviation)}</td>
                                    <td className={cn('py-2.5 pr-3 text-right', deviationTone(r.deviationPct))}>{signed(r.deviationPct)}%</td>
                                    <td className="py-2.5 pr-3 text-right text-muted-foreground">
                                        {r.band ? `${fmt(r.band.min, 0)}–${fmt(r.band.max, 0)}` : '—'}
                                    </td>
                                    <td className="py-2.5"><RangeBar position={r.rangePosition} /></td>
                                </>
                            ) : (
                                <td colSpan={6} className="py-2.5 text-muted-foreground">Unavailable — no weekly data stored yet</td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function BandChart({ data, selected, onSelect }: { data: WeeklyBalanceData; selected: StockKey; onSelect: (k: StockKey) => void }) {
    const label = STOCK_ROWS.find(r => r.key === selected)?.label ?? selected;
    const rows = useMemo(
        () => chartRows(data[selected], 52).map(r => ({
            date: r.date,
            value: r.value,
            avg: r.avg,
            range: r.min !== null && r.max !== null ? [r.min, r.max] as [number, number] : null,
        })),
        [data, selected],
    );
    const last = rows[rows.length - 1];

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {label} vs 5-year range, last 52 weeks
                </h3>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Choose stock series">
                    {CHART_CHOICES.map(k => (
                        <button
                            key={k}
                            type="button"
                            aria-pressed={selected === k}
                            onClick={() => onSelect(k)}
                            className={cn(
                                'min-h-[32px] rounded-md border px-3 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer',
                                selected === k
                                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                                    : 'border-border text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {STOCK_ROWS.find(r => r.key === k)?.label.split(' (')[0]}
                        </button>
                    ))}
                </div>
            </div>
            {rows.length === 0 ? (
                <DataStatePanel variant="empty" title={`No ${label.toLowerCase()} history stored`} height={CHART_HEIGHTS.standard} />
            ) : (
                <MacroChartContainer
                    height={CHART_HEIGHTS.tall}
                    ariaLabel={`${label} against its 5-year range`}
                    transcript={
                        <ChartAccessibleTranscript
                            takeaway={last
                                ? `${label} stand at ${fmt(last.value)} million barrels for the week ending ${last.date}${last.avg !== null ? `, against a 5-year average of ${fmt(last.avg)} for the same week` : ', with too little history for a 5-year average'}.`
                                : 'No data.'}
                            readingGuide="The shaded band spans the lowest to highest print for the same week in each of the five prior years; the dashed line is their average. A line below the band means stocks are lower than in any of those five years."
                            searchKeywords={['EIA weekly petroleum status report', 'crude inventories vs 5 year average', 'US crude stocks']}
                            tableData={{
                                caption: `${label}, last 8 weeks, million barrels`,
                                headers: ['Week ending', 'Stocks (Mb)', '5-yr avg (Mb)'],
                                rows: rows.slice(-8).map(r => [r.date, fmt(r.value), fmt(r.avg)]),
                            }}
                        />
                    }
                >
                    <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                        <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                        <XAxis
                            {...DEFAULT_XAXIS_PROPS}
                            dataKey="date"
                            minTickGap={48}
                            tickFormatter={(d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' })}
                        />
                        <YAxis {...DEFAULT_YAXIS_PROPS} domain={['auto', 'auto']} tickFormatter={(v: number) => v.toFixed(0)} />
                        <Tooltip
                            contentStyle={DEFAULT_TOOLTIP_STYLE}
                            labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                            itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                            formatter={(v: number | [number, number], name: string) =>
                                Array.isArray(v) ? [`${v[0].toFixed(1)} – ${v[1].toFixed(1)} Mb`, name] : [`${Number(v).toFixed(1)} Mb`, name]}
                        />
                        <Area type="monotone" dataKey="range" name="5-yr range" stroke="none" fill={CHART_COLORS.west} fillOpacity={0.15} isAnimationActive={false} connectNulls={false} />
                        <Line type="monotone" dataKey="avg" name="5-yr average" stroke={CHART_COLORS.label} strokeDasharray="4 3" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls={false} />
                        <Line type="monotone" dataKey="value" name="This year" stroke={CHART_COLORS.gold} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </ComposedChart>
                </MacroChartContainer>
            )}
        </div>
    );
}

export const WeeklyBalanceDesk: React.FC = () => {
    const { data, isLoading, isError, refetch } = useWeeklyBalance();
    const [selected, setSelected] = useState<StockKey>('crude');

    const view = useMemo(() => {
        if (!data) return null;
        const stocks = STOCK_ROWS.map(({ key, label }) => ({ label, r: latestVsBand(data[key]) }));
        const crude = stocks[0].r;
        const demandNow = fourWeekAverage(data.productSupplied);
        const demandPrev = crude ? fourWeekAverageYearAgo(data.productSupplied, crude.date) : null;
        const util = latestVsBand(data.utilization);
        return {
            stocks,
            crude,
            util,
            demandNow,
            demandYoY: pctChange(demandNow, demandPrev),
            cover: crude ? daysOfCover(crude.value * 1000, demandNow) : null,
            production: fourWeekAverage(data.production),
            netImports: fourWeekAverage(data.netImports),
            newest: sortAsc(data.crude).slice(-1)[0]?.date ?? null,
        };
    }, [data]);

    if (isLoading) return <DataStatePanel variant="pending" title="Loading EIA weekly balance" height={300} />;

    if (isError) {
        return <DataStatePanel variant="error" title="Weekly balance unavailable" description="Unable to load EIA weekly petroleum data." onRetry={() => refetch()} height={300} />;
    }

    if (!data || !view || !view.newest) {
        return (
            <DataStatePanel
                variant="empty"
                title="No EIA weekly data stored yet"
                description="The weekly petroleum series are pending their first ingest. Nothing is estimated in the meantime."
                height={300}
            />
        );
    }

    const status = releaseStatus(view.newest, new Date());

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Week ending {view.newest} · EIA Weekly Petroleum Status Report · released Wednesdays
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <DataProvenanceBadge source="US EIA" methodology="WPSR via API v2" lastVerified={view.newest} size="sm" />
                    <FreshnessChip
                        status={status === 'overdue' ? 'stale' : 'fresh'}
                        lastUpdated={view.newest}
                        label={status === 'awaiting_release' ? 'AWAITING RELEASE' : status === 'overdue' ? 'OVERDUE' : 'ON SCHEDULE'}
                    />
                </div>
            </div>

            <StocksTable rows={view.stocks} />
            <p className="text-[11px] font-semibold uppercase leading-relaxed tracking-wider text-muted-foreground">
                5-year range: the same week in each of the five prior calendar years, current year excluded, at least three years required.
                Below the average reads tighter (amber), above reads looser (blue).
            </p>

            <BandChart data={data} selected={selected} onSelect={setSelected} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                    label="Implied demand"
                    value={view.demandNow === null ? '—' : <>{fmt(view.demandNow / 1000, 2)} <span className="text-xs text-muted-foreground">mb/d</span></>}
                    context={view.demandYoY === null ? '4-wk avg product supplied' : `4-wk avg · ${signed(view.demandYoY)}% y/y`}
                />
                <StatTile
                    label="Crude cover"
                    value={view.cover === null ? '—' : <>{fmt(view.cover)} <span className="text-xs text-muted-foreground">days</span></>}
                    context="Commercial crude ÷ 4-wk product supplied"
                />
                <StatTile
                    label="Crude production"
                    value={view.production === null ? '—' : <>{fmt(view.production / 1000, 2)} <span className="text-xs text-muted-foreground">mb/d</span></>}
                    context={view.production === null ? 'Series not yet stored' : '4-wk average'}
                />
                <StatTile
                    label="Crude net imports"
                    value={view.netImports === null ? '—' : <>{fmt(view.netImports / 1000, 2)} <span className="text-xs text-muted-foreground">mb/d</span></>}
                    context={view.netImports === null ? 'Series not yet stored' : '4-wk average'}
                />
            </div>

            <StatTile
                label="Refinery utilization"
                value={view.util ? <>{fmt(view.util.value)}<span className="text-xs text-muted-foreground">%</span></> : '—'}
                context={view.util?.band
                    ? `5-yr range ${fmt(view.util.band.min)}–${fmt(view.util.band.max)}% · avg ${fmt(view.util.band.avg)}% · ${signed(view.util.deviation)} pts`
                    : 'Too little history for a 5-year range'}
            />
        </div>
    );
};

export default WeeklyBalanceDesk;

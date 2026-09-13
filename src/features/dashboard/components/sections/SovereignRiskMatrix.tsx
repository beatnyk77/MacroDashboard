import React, { useMemo } from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    ResponsiveContainer,
    Cell,
    LabelList,
    Tooltip as RechartsTooltip,
    ReferenceLine
} from 'recharts';
import { useG20SovereignMatrix, G20Region } from '@/hooks/useG20SovereignMatrix';
import {
    DEFAULT_CARTESIAN_GRID_PROPS,
    DEFAULT_XAXIS_PROPS,
    DEFAULT_YAXIS_PROPS,
} from '@/constants/chartDefaults';
import { cn } from '@/lib/utils';
import { ArrowDown, ShieldAlert, TrendingUp, Anchor, Activity, Info } from 'lucide-react';
import { ChartAccessibleTranscript } from '@/components/charts/ChartAccessibleTranscript';

const REGION_COLORS: Record<G20Region, string> = {
    'G7': '#3b82f6',     // Blue
    'BRICS': '#ef4444',  // Red
    'Other': '#94a3b8',  // Slate
};

const REGION_LABELS: Record<G20Region, string> = {
    'G7': 'G7 + EU',
    'BRICS': 'BRICS',
    'Other': 'Emerging / Other',
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const regionColor = REGION_COLORS[data.region as G20Region] || '#94a3b8';
        return (
            <div className="bg-slate-950 border border-white/12 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[220px]">
                <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                    <span className="text-2xl">{data.flag}</span>
                    <div>
                        <span className="font-black text-white text-base uppercase tracking-heading block">{data.name}</span>
                        <span className="text-xs font-bold uppercase tracking-uppercase" style={{ color: regionColor }}>{data.region}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">Debt/GDP</span>
                        <span className={cn("text-sm font-black font-mono", data.debtGdpPct > 100 ? "text-rose-400" : "text-white")}>{data.debtGdpPct.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">GDP Growth</span>
                        <span className={cn("text-sm font-black font-mono", data.gdpGrowthPct >= 2 ? "text-emerald-400" : data.gdpGrowthPct < 0 ? "text-rose-400" : "text-amber-400")}>
                            {data.gdpGrowthPct.toFixed(1)}%
                        </span>
                    </div>
                    {data.debtGoldRatio > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">Debt/Gold</span>
                            <span className="text-sm font-black text-white font-mono">{data.debtGoldRatio.toFixed(1)}x</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">Gold Reserves</span>
                        <span className="text-sm font-black text-amber-400 font-mono">{data.goldTonnes.toFixed(0)}t</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">Z-Score (Debt)</span>
                            <span className={cn("text-xs font-black font-mono", data.zDebt > 1 ? "text-rose-400" : data.zDebt < -1 ? "text-emerald-400" : "text-white/70")}>{data.zDebt > 0 ? '+' : ''}{data.zDebt.toFixed(2)}σ</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">Z-Score (Growth)</span>
                            <span className={cn("text-xs font-black font-mono", data.zGrowth > 1 ? "text-emerald-400" : data.zGrowth < -1 ? "text-rose-400" : "text-white/70")}>{data.zGrowth > 0 ? '+' : ''}{data.zGrowth.toFixed(2)}σ</span>
                        </div>
                    </div>
                    {!data.dataAvailable && (
                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5">
                            <Info className="w-3 h-3 text-amber-400" />
                            <span className="text-xs font-bold text-amber-400/80 uppercase tracking-uppercase">Partial data</span>
                        </div>
                    )}
                    {data.isStale && (
                        <div className="mt-1 flex items-center gap-1.5">
                            <ShieldAlert className="w-3 h-3 text-rose-400 animate-pulse" />
                            <span className="text-xs font-black text-rose-400 uppercase tracking-uppercase">Data Delayed</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export const SovereignRiskMatrix = React.memo(() => {
    const { data, isLoading } = useG20SovereignMatrix();
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [selectedCode, setSelectedCode] = React.useState<string | null>(null);

    const { chartData, xMedian, yMedian, availableCount, totalCount } = useMemo(() => {
        if (!data) return { chartData: [], xMedian: 0, yMedian: 0, availableCount: 0, totalCount: 0 };

        const filtered = data
            .filter(d => d.dataAvailable && d.debtGdpPct > 0)
            .map(d => ({
                ...d,
                x: d.debtGdpPct,
                y: d.gdpGrowthPct,
                z: Math.max(d.nominalGdpUsd / 1e9, 50), // Scale for bubble size (billions)
            }));

        const xValues = filtered.map(d => d.x).sort((a, b) => a - b);
        const yValues = filtered.map(d => d.y).sort((a, b) => a - b);
        const mid = Math.floor(filtered.length / 2);

        return {
            chartData: filtered,
            xMedian: xValues[mid] || 60,
            yMedian: yValues[mid] || 2,
            availableCount: filtered.length,
            totalCount: data.length,
        };
    }, [data]);

    if (isLoading || !data) return <div className="h-[360px] w-full animate-pulse bg-white/5 rounded-xl" aria-label="Loading sovereign data" />;

    const ranked = [...data].sort((a, b) => {
        if (a.dataAvailable !== b.dataAvailable) return a.dataAvailable ? -1 : 1;
        return (b.zDebt - b.zGrowth) - (a.zDebt - a.zGrowth);
    });
    const availableDebt = data.filter(point => point.debtUpdatedAt).length;
    const freshRows = data.filter(point => point.dataAvailable && !point.isStale).length;
    const selected = data.find(point => point.code === selectedCode) ?? ranked[0];
    const formatDate = (date: string | null) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No observation';
    const statusLabel = (status: string) => status === 'fresh' ? 'Fresh' : status === 'no_data' ? 'No data' : 'Review';

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Sovereign data coverage">
                {[
                    { label: 'Debt coverage', value: `${availableDebt}/${totalCount}`, detail: 'countries with observations', color: 'text-foreground' },
                    { label: 'Usable rows', value: `${freshRows}/${totalCount}`, detail: 'debt and growth current', color: 'text-emerald-500' },
                    { label: 'Highest screen', value: selected?.code ?? '—', detail: 'selected by debt-growth screen', color: 'text-amber-500' },
                    { label: 'Method', value: 'Observed', detail: 'no fallback values', color: 'text-cyan-500' },
                ].map(item => (
                    <div key={item.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</div>
                        <div className={`mt-2 text-xl font-black tabular-nums ${item.color}`}>{item.value}</div>
                        <div className="mt-1 text-[10px] text-muted-foreground/70">{item.detail}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-4">
                <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                    <table className="w-full min-w-[720px] text-left">
                        <caption className="sr-only">Country triage based on observed debt to GDP and GDP growth</caption>
                        <thead className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-bold">Country</th>
                                <th className="px-4 py-3 font-bold">Debt / GDP</th>
                                <th className="px-4 py-3 font-bold">Growth</th>
                                <th className="px-4 py-3 font-bold">Debt screen</th>
                                <th className="px-4 py-3 font-bold">Data state</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {ranked.map(point => {
                                const active = selected?.code === point.code;
                                return (
                                    <tr key={point.code} className={cn('cursor-pointer transition-colors hover:bg-muted/50', active && 'bg-primary/10')} onClick={() => setSelectedCode(point.code)}>
                                        <td className="px-4 py-3">
                                            <button type="button" className="flex items-center gap-2 text-sm font-semibold text-foreground" onClick={() => setSelectedCode(point.code)}>
                                                <span aria-hidden="true">{point.flag}</span>{point.name}
                                            </button>
                                            <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground/60">{point.region} · {point.code}</div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-sm tabular-nums text-foreground">{point.debtUpdatedAt ? `${point.debtGdpPct.toFixed(1)}%` : '—'}</td>
                                        <td className="px-4 py-3 font-mono text-sm tabular-nums text-foreground">{point.growthUpdatedAt ? `${point.gdpGrowthPct.toFixed(1)}%` : '—'}</td>
                                        <td className="px-4 py-3 font-mono text-sm tabular-nums text-amber-500 font-bold">{point.dataAvailable ? `${point.zDebt > 0 ? '+' : ''}${point.zDebt.toFixed(2)}σ` : '—'}</td>
                                        <td className="px-4 py-3"><span className={cn('rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest', point.dataAvailable && !point.isStale ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'border-amber-500/20 bg-amber-500/10 text-amber-500')}>{point.dataAvailable ? statusLabel(point.debtStatus) : 'Partial'}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <aside className="rounded-xl border border-border bg-card p-4 shadow-sm" aria-label="Selected country details">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Selected country</div>
                    {selected ? <>
                        <div className="mt-3 flex items-center gap-2 text-lg font-bold text-foreground"><span aria-hidden="true">{selected.flag}</span>{selected.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{selected.region} · {selected.code}</div>
                        <dl className="mt-5 space-y-3 text-xs">
                            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Debt / GDP</dt><dd className="font-mono text-foreground font-semibold">{selected.debtUpdatedAt ? `${selected.debtGdpPct.toFixed(1)}%` : 'No data'}</dd></div>
                            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Growth</dt><dd className="font-mono text-foreground font-semibold">{selected.growthUpdatedAt ? `${selected.gdpGrowthPct.toFixed(1)}%` : 'No data'}</dd></div>
                            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Debt observation</dt><dd className="text-right text-foreground/80">{formatDate(selected.debtUpdatedAt)}</dd></div>
                            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Growth observation</dt><dd className="text-right text-foreground/80">{formatDate(selected.growthUpdatedAt)}</dd></div>
                        </dl>
                        <div className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">This screen ranks observed debt and growth readings. CDS, refinancing, and interest-to-revenue signals require separate country-level feeds.</div>
                    </> : <div className="mt-4 text-sm text-muted-foreground">No country data available.</div>}
                </aside>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-foreground uppercase tracking-heading flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-primary" />
                        Sovereign Risk Matrix
                    </h3>
                    <p className="text-xs font-black tracking-uppercase text-muted-foreground uppercase mt-1">
                        G20 Fiscal Vulnerability (Debt/GDP) vs Vitality (Growth) — {availableCount}/{totalCount} countries
                    </p>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="group flex items-center gap-2 px-4 py-2 bg-card hover:bg-muted/60 border border-border rounded-xl transition-all shadow-sm"
                >
                    <span className="text-xs font-black uppercase tracking-uppercase text-muted-foreground group-hover:text-foreground">
                        {isExpanded ? 'Collapse View' : 'Deep Analysis'}
                    </span>
                    <Activity className="w-3 h-3 text-primary group-hover:animate-pulse" />
                </button>
            </div>

            <div className={cn(
                "spa-card bg-card dark:bg-[#0a0a0a] border border-border overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] relative shadow-sm dark:shadow-2xl",
                isExpanded ? "h-[650px] opacity-100 ring-1 ring-primary/20" : "h-[240px] opacity-90 hover:opacity-100"
            )}>
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-grid-slate-800/[0.04] bg-[size:20px_20px] pointer-events-none" />

                {!isExpanded && (
                    <div role="button" tabIndex={0} aria-label="Expand global risk landscape" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(true); } }} className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-b from-transparent to-background/90 cursor-pointer group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none" onClick={() => setIsExpanded(true)}>
                        <div className="text-center transform transition-all duration-500 group-hover:-translate-y-2">
                            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors">
                                <ArrowDown className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-xs font-black text-primary uppercase tracking-uppercase bg-card px-3 py-1 rounded-full border border-border shadow-sm">
                                Expand Global Risk Landscape
                            </span>
                        </div>
                    </div>
                )}

                <div className="h-full w-full p-4 relative z-10">
                    {/* Quadrant Labels (Only visible when expanded for clarity) */}
                    {isExpanded && (
                        <>
                            <div className="absolute top-4 left-16 z-0 pointer-events-none">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Anchor className="w-3 h-3 text-emerald-500" />
                                    <span className="text-xs font-black text-emerald-500 uppercase tracking-uppercase">Dynamic Anchors</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-600/70 dark:text-emerald-500/60 uppercase tracking-uppercase block">Low Debt, High Growth</span>
                            </div>

                            <div className="absolute top-4 right-8 z-0 pointer-events-none text-right">
                                <div className="flex items-center gap-1.5 mb-0.5 justify-end">
                                    <span className="text-xs font-black text-amber-500 uppercase tracking-uppercase">Growth at Risk</span>
                                    <TrendingUp className="w-3 h-3 text-amber-500" />
                                </div>
                                <span className="text-xs font-bold text-amber-600/70 dark:text-amber-500/60 uppercase tracking-uppercase block">High Debt, High Growth</span>
                            </div>

                            <div className="absolute bottom-16 right-8 z-0 pointer-events-none text-right">
                                <div className="flex items-center gap-1.5 mb-0.5 justify-end">
                                    <span className="text-xs font-black text-rose-500 uppercase tracking-uppercase">Fiscal Trap</span>
                                    <ShieldAlert className="w-3 h-3 text-rose-500" />
                                </div>
                                <span className="text-xs font-bold text-rose-600/70 dark:text-rose-500/60 uppercase tracking-uppercase block">High Debt, Low Growth</span>
                            </div>

                            <div className="absolute bottom-16 left-16 z-0 pointer-events-none">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Activity className="w-3 h-3 text-primary" />
                                    <span className="text-xs font-black text-primary uppercase tracking-uppercase">Stagnant Stability</span>
                                </div>
                                <span className="text-xs font-bold text-primary/70 uppercase tracking-uppercase block">Low Debt, Low Growth</span>
                            </div>
                        </>
                    )}

                    {/* Region Legend - Always Visible */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-5">
                        {Object.entries(REGION_LABELS).map(([key, label]) => (
                            <div key={key} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REGION_COLORS[key as G20Region] }} />
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-uppercase">{label}</span>
                            </div>
                        ))}
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 30, right: 30, bottom: isExpanded ? 40 : 30, left: 30 }}>
                            <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} horizontal={false} />

                            <ReferenceLine x={xMedian} stroke="hsl(var(--border))" strokeDasharray="4 4" />
                            <ReferenceLine y={yMedian} stroke="hsl(var(--border))" strokeDasharray="4 4" />

                            <XAxis
                                type="number"
                                dataKey="x"
                                name="Debt/GDP"
                                unit="%"
                                domain={[0, 'auto']}
                                stroke="hsl(var(--border))"
                                fontSize={10}
                                tick={DEFAULT_XAXIS_PROPS.tick}
                                tickLine={DEFAULT_XAXIS_PROPS.tickLine}
                                axisLine={DEFAULT_XAXIS_PROPS.axisLine}
                                label={{
                                    value: 'Government Debt / GDP (%)',
                                    position: 'insideBottom',
                                    offset: -20,
                                    fill: 'hsl(var(--muted-foreground))',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: '0.1em'
                                }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name="Growth"
                                unit="%"
                                domain={['auto', 'auto']}
                                stroke="hsl(var(--border))"
                                fontSize={10}
                                tick={DEFAULT_YAXIS_PROPS.tick}
                                tickLine={DEFAULT_YAXIS_PROPS.tickLine}
                                axisLine={DEFAULT_YAXIS_PROPS.axisLine}
                                label={{
                                    value: 'Real GDP Growth %',
                                    angle: -90,
                                    position: 'insideLeft',
                                    fill: 'hsl(var(--muted-foreground))',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: '0.1em'
                                }}
                            />
                            <ZAxis type="number" dataKey="z" range={[80, 2000]} />

                            <RechartsTooltip
                                content={CustomTooltip}
                                cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--border))' }}
                                animationDuration={200}
                            />

                            <Scatter data={chartData} animationBegin={0} animationDuration={1000}>
                                {chartData.map((entry, index) => {
                                    const color = REGION_COLORS[entry.region as G20Region] || '#94a3b8';
                                    return (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={color}
                                            fillOpacity={entry.dataAvailable ? 0.6 : 0.2}
                                            stroke={color}
                                            strokeWidth={2}
                                        />
                                    );
                                })}
                                <LabelList
                                    dataKey="code"
                                    position="top"
                                    offset={10}
                                    style={{ fill: 'hsl(var(--foreground))', fontSize: '11px', fontWeight: '900' }}
                                />
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <ChartAccessibleTranscript
                takeaway={`The G20 Sovereign Risk Matrix cross-evaluates fiscal leverage (Debt-to-GDP %) against economic vitality (GDP Growth %). Sovereigns clustered in the Fiscal Trap quadrant (high debt, low growth) face rising interest coverage vulnerabilities, while Dynamic Anchors (low debt, resilient growth) maintain balance sheet capacity to absorb external financial shocks.`}
                readingGuide="Quad I (Top-Left): Dynamic Anchors (Low Debt, High Growth). Quad II (Top-Right): Growth at Risk (High Debt, High Growth). Quad III (Bottom-Right): Fiscal Trap (High Debt, Low Growth). Quad IV (Bottom-Left): Stagnant Stability (Low Debt, Low Growth). Bubble size indicates nominal GDP in USD billions."
                searchKeywords={[
                    'Sovereign Risk Matrix',
                    'G20 Debt to GDP',
                    'Sovereign Debt Spiral',
                    'GDP Growth vs Debt Burden',
                    'Fiscal Fragility Quad',
                    'G7 vs BRICS Sovereign Vulnerability',
                    'Sovereign CDS Risk'
                ]}
                dataRows={[
                    { label: 'Observed Debt Coverage', value: `${availableDebt}/${totalCount} Nations` },
                    { label: 'Usable Current Rows', value: `${freshRows}/${totalCount} Fresh` },
                    { label: 'Highest Risk Screen', value: selected?.code ?? '—', note: selected?.name },
                    { label: 'Selected Debt/GDP', value: selected?.debtUpdatedAt ? `${selected.debtGdpPct.toFixed(1)}%` : 'No data' },
                ]}
            />
        </div>
    );
});

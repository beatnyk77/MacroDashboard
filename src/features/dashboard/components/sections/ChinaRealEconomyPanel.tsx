import React from 'react';
import { cn } from '@/lib/utils';
import { useChinaMacroPulse, useLatestChinaMetric } from '@/hooks/useChinaMacro';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, LineChart, Line, Legend
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS } from '@/constants/chartDefaults';
import { Factory } from 'lucide-react';
import { DataStatePanel } from '@/components/DataStatePanel';
import { TOOLTIP_SHELL_CLASS } from '@/components/charts/chartTooltipFormat';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

const GaugeNeedle: React.FC<{ value: number }> = ({ value }) => {
    // value is PMI index. 50 = neutral. Range 44–56.
    const angle = ((value - 44) / 12) * 180 - 90; // maps 44->-90, 56->90
    return (
        <div className="relative flex items-center justify-center">
            <svg viewBox="0 0 120 70" className="w-32 h-20">
                <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={CHART_COLORS.stress} />
                        <stop offset="50%" stopColor={CHART_COLORS.gold} />
                        <stop offset="100%" stopColor={CHART_COLORS.expansion} />
                    </linearGradient>
                </defs>
                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="url(#gaugeGrad)" strokeWidth="6" strokeLinecap="round" />
                <line
                    x1="60" y1="60"
                    x2={60 + 40 * Math.cos((angle * Math.PI) / 180)}
                    y2={60 + 40 * Math.sin((angle * Math.PI) / 180)}
                    stroke="currentColor" className="text-foreground" strokeWidth="2" strokeLinecap="round"
                />
                <circle cx="60" cy="60" r="3" fill="currentColor" className="text-foreground" />
                <text x="10" y="68" fill="currentColor" className="text-muted-foreground" fontSize="11">44</text>
                <text x="53" y="15" fill="currentColor" className="text-muted-foreground" fontSize="11">50</text>
                <text x="103" y="68" fill="currentColor" className="text-muted-foreground" fontSize="11">56</text>
            </svg>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className={TOOLTIP_SHELL_CLASS}>
            <p className="text-slate-400 mb-2 font-semibold uppercase tracking-wider">{label}</p>
            {payload.map((p: any) => (
                <div key={p.name} className="flex justify-between gap-4">
                    <span style={{ color: p.color }}>{p.name}</span>
                    <span className="text-slate-100 font-semibold">{p.value?.toFixed(1)}</span>
                </div>
            ))}
            <div className="mt-1 pt-1 border-t border-border">
                <span className="text-slate-400">{(payload[0]?.value ?? 0) >= 50 ? '▲ Expansion' : '▼ Contraction'}</span>
            </div>
        </div>
    );
};

export const ChinaRealEconomyPanel: React.FC = () => {
    const { data: allPulse, isLoading } = useChinaMacroPulse(
        ['CN_PMI_NBS', 'CN_PMI_CAIXIN'],
        24
    );
    const { data: latestIP } = useLatestChinaMetric('CN_IP_YOY');
    const { data: latestRetail } = useLatestChinaMetric('CN_RETAIL_SALES_YOY');
    const { data: latestFAI } = useLatestChinaMetric('CN_FAI_YOY');
    const { data: latestDistress } = useLatestChinaMetric('CN_CORP_DISTRESS');

    // Build PMI monthly chart
    const pmiByDate: Record<string, any> = {};
    for (const row of allPulse ?? []) {
        if (!pmiByDate[row.date]) pmiByDate[row.date] = { date: row.date.slice(0, 7) };
        if (row.metric_id === 'CN_PMI_NBS') pmiByDate[row.date].NBS = row.value;
        if (row.metric_id === 'CN_PMI_CAIXIN') pmiByDate[row.date].Caixin = row.value;
    }
    const pmiData = Object.values(pmiByDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-12);

    const latestNBS = pmiData[pmiData.length - 1]?.NBS as number | undefined;
    const latestCaixin = pmiData[pmiData.length - 1]?.Caixin as number | undefined;

    const pmiStatus = (v: number) => v >= 50 ? { label: 'Expanding', cls: 'text-emerald-400' } : { label: 'Contracting', cls: 'text-rose-400' };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border pb-6">
                <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <Factory className="text-orange-500 w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-bold tracking-heading text-foreground uppercase">
                        Real Economy <span className="text-orange-500">Activity</span>
                    </h3>
                    <p className="text-muted-foreground text-xs mt-0.5">PMI · Industrial Production · Retail · Deflation Pressure</p>
                </div>
            </div>

            {isLoading ? (
                <div className="h-48 rounded-xl bg-card border border-border animate-pulse" />
            ) : (
                <>
                    {/* PMI Dual Gauge — per-series empty state (never fabricate 50.x) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'NBS PMI', value: latestNBS, sub: 'Official Manufacturing PMI', color: 'text-red-400' },
                            { label: 'Caixin PMI', value: latestCaixin, sub: 'Private sector / SME focus', color: 'text-amber-400' },
                        ].map(({ label, value, sub, color }) => {
                            if (value == null) {
                                return (
                                    <DataStatePanel
                                        key={label}
                                        variant="empty"
                                        title="PMI data unavailable"
                                        description={`${label} has not reported for the requested window.`}
                                        accentColor="amber"
                                        height={220}
                                    />
                                );
                            }
                            const s = pmiStatus(value);
                            return (
                                <div key={label} className="p-5 rounded-xl bg-card border border-border shadow-sm flex flex-col items-center text-center gap-2">
                                    <GaugeNeedle value={value} />
                                    <p className={cn('text-3xl font-bold tabular-nums tracking-heading', color)}>{value.toFixed(1)}</p>
                                    <p className={cn('text-xs font-semibold uppercase tracking-wider', s.cls)}>{s.label}</p>
                                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">{label}</p>
                                    <p className="text-xs text-muted-foreground">{sub}</p>
                                    <div className={cn('w-full h-0.5 rounded-full mt-1', value >= 50 ? 'bg-emerald-500/30' : 'bg-rose-500/30')} />
                                    <p className="text-xs text-muted-foreground/80">50.0 expansion threshold</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* NBS vs Caixin 12-month trend */}
                    <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">PMI — NBS vs Caixin (12 Months)</p>
                        <MacroChartContainer height={CHART_HEIGHTS.compact}>
                            <LineChart data={pmiData}>
                                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} className="text-border/40" />
                                <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="date" axisLine={false} className="text-muted-foreground" />
                                <YAxis {...DEFAULT_YAXIS_PROPS} width={60} domain={[46, 54]} axisLine={false} className="text-muted-foreground" />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={50} stroke="currentColor" className="text-border" strokeDasharray="4 4" label={{ value: '50', fill: 'currentColor', fontSize: 11, className: 'text-muted-foreground' }} />
                                <Line type="monotone" dataKey="NBS" stroke={CHART_COLORS.stress} strokeWidth={2} dot={false} name="NBS" />
                                <Line type="monotone" dataKey="Caixin" stroke={CHART_COLORS.gold} strokeWidth={2} dot={false} name="Caixin" strokeDasharray="5 2" />
                                <Legend iconType="line" wrapperStyle={{ fontSize: 11 }} className="text-muted-foreground" />
                            </LineChart>
                        </MacroChartContainer>
                    </div>

                    {/* Activity Metrics + Deflation */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Industrial Prod.', data: latestIP, unit: '%', color: 'text-orange-400' },
                            { label: 'Retail Sales', data: latestRetail, unit: '%', color: 'text-amber-400' },
                            { label: 'Fixed Asset Inv.', data: latestFAI, unit: '%', color: 'text-yellow-400' },
                            { label: 'Corp. Distress', data: latestDistress, unit: 'pts', color: (latestDistress?.value ?? 0) < -1.5 ? 'text-rose-400' : 'text-amber-400', desc: 'CPI-PPI spread: negative = margin compression' },
                        ].map(({ label, data, unit, color }) => (
                            <div key={label} className="p-4 rounded-xl bg-card border border-border shadow-sm hover:border-border/80 transition-all">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={cn('text-2xl font-bold tabular-nums tracking-heading', color)}>
                                        {data?.value != null ? (data.value >= 0 ? '+' : '') + data.value.toFixed(1) : '--'}
                                    </span>
                                    <span className="text-xs text-muted-foreground uppercase">{unit}</span>
                                </div>
                                <p className="text-xs text-muted-foreground/80 mt-1">{data?.date?.slice(0, 7) ?? 'Latest'}</p>
                            </div>
                        ))}
                    </div>

                    {/* Institutional Insight */}
                    <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
                        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Analyst Insight</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">PMI Divergence:</strong> When Caixin PMI significantly outperforms NBS PMI, it suggests private-sector SMEs are recovering faster than state-owned enterprises — a positive signal for urban employment and consumption. Watch for convergence as a regime confirmation trigger.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

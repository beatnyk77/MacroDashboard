import React from 'react';
import { Banknote, AlertTriangle } from 'lucide-react';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';
import { usePBOCOps } from '@/hooks/useChinaMacro';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useLatestChinaDebtComposites } from '@/hooks/useChinaDebt';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { cn } from '@/lib/utils';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

export const ChinaMonetizationWatch: React.FC = () => {
    const { data: pbocRows, isLoading } = usePBOCOps();
    const { data: m2Growth } = useLatestMetric(MID.CN_M2_GROWTH);
    const { data: gdpGrowth } = useLatestMetric(MID.CN_GDP_GROWTH_YOY);
    const { data: composites } = useLatestChinaDebtComposites();

    const latest = pbocRows?.[0];
    const monetization = composites?.CN_MONETIZATION_PRESSURE;

    const chartData = [...(pbocRows ?? [])].reverse().map(r => ({
        date: r.date?.slice(0, 7) ?? '',
        m2: r.m2_growth_yoy,
        mlf: r.mlf_rate,
        gap: r.pboc_vs_fed_gap,
    }));

    const m2GdpGap = m2Growth?.value != null && gdpGrowth?.value != null
        ? m2Growth.value - gdpGrowth.value
        : null;

    const isFiscalDominance = (monetization?.value ?? 0) >= 60;

    if (isLoading) {
        return <div className="h-[300px] rounded-xl bg-white/[0.02] animate-pulse" />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <Banknote size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider italic">
                            Monetization Watch
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Is the PBOC quietly financing the fiscal deficit?
                        </p>
                    </div>
                </div>
                {isFiscalDominance && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                        <AlertTriangle size={14} />
                        Fiscal Dominance Zone
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'M2 Growth YoY', value: latest?.m2_growth_yoy ?? m2Growth?.value, unit: '%' },
                    { label: 'M2 − GDP Gap', value: m2GdpGap, unit: 'pp', warn: m2GdpGap != null && m2GdpGap > 3 },
                    { label: 'PBOC Regime', value: latest?.regime_label, unit: '', text: true },
                    { label: 'Monetization Index', value: monetization?.value, unit: '/100', warn: isFiscalDominance },
                ].map(({ label, value, unit, warn, text }) => (
                    <div key={label} className={cn(
                        'p-5 rounded-xl border',
                        warn ? 'bg-amber-500/[0.04] border-amber-500/15' : 'bg-white/[0.02] border-border'
                    )}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-2">{label}</p>
                        <p className={cn('font-bold font-mono', text ? 'text-lg text-white' : 'text-2xl text-white')}>
                            {value != null ? (text ? String(value) : typeof value === 'number' ? value.toFixed(1) : value) : '—'}
                            {unit && !text && <span className="text-xs text-terminal-dim ml-1">{unit}</span>}
                        </p>
                    </div>
                ))}
            </div>

            <div className="p-6 rounded-xl bg-white/[0.02] border border-border">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-4">
                    M2 Growth vs PBOC Policy Rate
                </h4>
                {chartData.length > 0 ? (
                    <MacroChartContainer height={CHART_HEIGHTS.standard}>
                        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                            <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                            <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="date" tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} />
                            <YAxis {...DEFAULT_YAXIS_PROPS} width={60} yAxisId="left" tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} unit="%" />
                            <YAxis {...DEFAULT_YAXIS_PROPS} width={60} yAxisId="right" orientation="right" tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} unit="%" />
                            <Tooltip contentStyle={DEFAULT_TOOLTIP_STYLE} labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE} itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE} />
                            <ReferenceLine yAxisId="left" y={8} stroke={alpha(CHART_COLORS.gold, 0.3)} strokeDasharray="4 4" label={{ value: 'M2 8%', fill: alpha(CHART_COLORS.gold, 0.5), fontSize: 11 }} />
                            <Bar yAxisId="left" dataKey="m2" fill={alpha(CHART_COLORS.violet, 0.4)} name="M2 Growth" radius={[2, 2, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="mlf" stroke={CHART_COLORS.stress} strokeWidth={2} dot={false} name="MLF Rate" />
                        </ComposedChart>
                    </MacroChartContainer>
                ) : (
                    <p className="text-sm text-terminal-dim">PBOC operations data unavailable</p>
                )}
                <DataProvenanceBadge source="PBOC via FRED" methodology="MYAGM2CNM189N + PBoC policy rates" size="sm" className="mt-3" />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed p-5 rounded-xl bg-purple-500/[0.03] border border-purple-500/10">
                <span className="font-semibold uppercase text-xs text-purple-400 mr-2 tracking-wider">PSL Signal:</span>
                Pledged Supplemental Lending (PSL) is China&apos;s quasi-fiscal channel via policy banks.
                Persistent M2 growth above nominal GDP signals sterilization limits — the fiscal dominance threshold
                approaches when interest payments exceed ~10% of fiscal revenue (including LGFV servicing).
            </p>
        </div>
    );
};
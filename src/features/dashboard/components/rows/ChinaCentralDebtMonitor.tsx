import React from 'react';
import { Landmark, TrendingDown, TrendingUp } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useChinaDebtLayers } from '@/hooks/useChinaDebt';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { cn } from '@/lib/utils';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

export const ChinaCentralDebtMonitor: React.FC = () => {
    const { data: debtGdp } = useLatestMetric(MID.CN_DEBT_GDP_PCT);
    const { data: centralDebt } = useLatestMetric(MID.CN_DEBT_CENTRAL_GDP_PCT);
    const { data: fiscalBalance } = useLatestMetric(MID.CN_FISCAL_BALANCE_GDP_PCT);
    const { data: yield2y } = useLatestMetric(MID.CN_CGB_YIELD_2Y);
    const { data: yield10y } = useLatestMetric(MID.CN_CGB_YIELD_10Y);
    const { data: realYield } = useLatestMetric(MID.CN_REAL_YIELD_10Y);
    const { data: layers } = useChinaDebtLayers();

    const yieldCurve = [
        { tenor: '2Y', yield: yield2y?.value },
        { tenor: '10Y', yield: yield10y?.value },
    ].filter(d => d.yield != null);

    const debtHistory = layers
        ?.filter(l => l.layer_code === 'consolidated')
        .map(l => ({
            year: l.as_of_date.slice(0, 4),
            consolidated: l.value_pct_gdp,
            low: l.value_low_pct_gdp,
            high: l.value_high_pct_gdp,
        })) ?? [];

    const metrics = [
        {
            label: 'General Govt Debt',
            value: debtGdp?.value,
            unit: '% GDP',
            source: 'IMF WEO',
            trend: debtGdp?.value && debtGdp.value > 90 ? 'up' as const : 'neutral' as const,
        },
        {
            label: 'Central Govt Debt',
            value: centralDebt?.value,
            unit: '% GDP',
            source: 'World Bank',
            trend: 'neutral' as const,
        },
        {
            label: 'Fiscal Balance',
            value: fiscalBalance?.value,
            unit: '% GDP',
            source: 'IMF WEO',
            trend: fiscalBalance?.value && fiscalBalance.value < -5 ? 'down' as const : 'neutral' as const,
        },
        {
            label: 'CGB 10Y Real Yield',
            value: realYield?.value,
            unit: '%',
            source: 'Derived',
            trend: realYield?.value && realYield.value < 0 ? 'down' as const : 'up' as const,
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Landmark size={20} className="text-blue-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider italic">
                        Central Government Debt Monitor
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Auditable sovereign layer — IMF general government vs MoF central debt
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map(({ label, value, unit, source, trend }) => (
                    <div key={label} className="p-5 rounded-xl bg-white/[0.02] border border-border">
                        <p className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-2">{label}</p>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold text-white font-mono">
                                {value != null ? value.toFixed(1) : '—'}
                            </p>
                            <span className="text-xs text-terminal-dim mb-1">{unit}</span>
                            {trend === 'up' && <TrendingUp size={14} className="text-amber-400 mb-1" />}
                            {trend === 'down' && <TrendingDown size={14} className="text-rose-400 mb-1" />}
                        </div>
                        <p className="text-xs text-terminal-dim mt-1">{source}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Yield curve */}
                <div className="p-6 rounded-xl bg-white/[0.02] border border-border">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-4">
                        CGB Yield Curve
                    </h4>
                    {yieldCurve.length > 0 ? (
                        <MacroChartContainer height={CHART_HEIGHTS.compact}>
                            <LineChart data={yieldCurve} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                                <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="tenor" tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} />
                                <YAxis {...DEFAULT_YAXIS_PROPS} width={60} tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} unit="%" />
                                <Tooltip contentStyle={DEFAULT_TOOLTIP_STYLE} labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE} itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE} />
                                <Line type="monotone" dataKey="yield" stroke={CHART_COLORS.west} strokeWidth={2} dot={{ fill: CHART_COLORS.west, r: 4 }} name="Yield" />
                            </LineChart>
                        </MacroChartContainer>
                    ) : (
                        <p className="text-sm text-terminal-dim">Yield data unavailable</p>
                    )}
                    <DataProvenanceBadge source="FRED" methodology="INTDSRCNM024N / INTDSRCNM193N" size="sm" className="mt-3" />
                </div>

                {/* Debt progression */}
                <div className="p-6 rounded-xl bg-white/[0.02] border border-border">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-4">
                        Consolidated Debt Trajectory
                    </h4>
                    {debtHistory.length > 0 ? (
                        <MacroChartContainer height={CHART_HEIGHTS.compact}>
                            <LineChart data={debtHistory} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                                <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="year" tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} />
                                <YAxis {...DEFAULT_YAXIS_PROPS} width={60} tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} unit="%" />
                                <Tooltip contentStyle={DEFAULT_TOOLTIP_STYLE} labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE} itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line type="monotone" dataKey="consolidated" stroke={CHART_COLORS.gold} strokeWidth={2} dot={false} name="IMF Base" />
                                <Line type="monotone" dataKey="high" stroke={CHART_COLORS.stress} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="IMF High" />
                            </LineChart>
                        </MacroChartContainer>
                    ) : (
                        <p className="text-sm text-terminal-dim">History unavailable</p>
                    )}
                </div>
            </div>

            <div className={cn(
                'p-5 rounded-xl border text-sm leading-relaxed',
                fiscalBalance?.value && fiscalBalance.value < -6
                    ? 'bg-rose-500/[0.04] border-rose-500/15 text-rose-200/70'
                    : 'bg-blue-500/[0.04] border-blue-500/15 text-blue-200/70'
            )}>
                <span className="font-semibold uppercase text-xs mr-2 tracking-wider">Stress Signal:</span>
                Foreign holdings of CGBs are not tracked in this module. Monitor fiscal balance deterioration
                {fiscalBalance?.value != null && ` (currently ${fiscalBalance.value.toFixed(1)}% GDP)`} and
                real yield compression as proxies for domestic absorption capacity.
            </div>
        </div>
    );
};
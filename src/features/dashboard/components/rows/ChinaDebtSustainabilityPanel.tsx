import React, { useMemo } from 'react';
import { Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useLatestChinaDebtComposites, useChinaDebtLayers } from '@/hooks/useChinaDebt';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { cn } from '@/lib/utils';

const SCENARIOS = [
    { label: 'Base',       growth: 4.5, rate: 2.5, debt2030: 115 },
    { label: 'Low Growth', growth: 3.0, rate: 2.5, debt2030: 138 },
    { label: 'Rate Shock', growth: 4.5, rate: 4.0, debt2030: 127 },
    { label: 'Stress',     growth: 2.5, rate: 4.0, debt2030: 165 },
];

export const ChinaDebtSustainabilityPanel: React.FC = () => {
    const { data: yield10y } = useLatestMetric(MID.CN_CGB_YIELD_10Y);
    const { data: gdpGrowth } = useLatestMetric(MID.CN_GDP_GROWTH_YOY);
    const { data: debtGdp } = useLatestMetric(MID.CN_DEBT_GDP_PCT);
    const { data: fiscalBalance } = useLatestMetric(MID.CN_FISCAL_BALANCE_GDP_PCT);
    const { data: composites } = useLatestChinaDebtComposites();
    const { data: layers } = useChinaDebtLayers();

    const rgDiff = composites?.CN_RG_DIFFERENTIAL?.value
        ?? (yield10y?.value != null && gdpGrowth?.value != null
            ? yield10y.value - gdpGrowth.value
            : null);

    const consolidatedLayers = layers?.filter(l => l.layer_code === 'consolidated') ?? [];
    const currentDebt = debtGdp?.value
        ?? consolidatedLayers[consolidatedLayers.length - 1]?.value_pct_gdp
        ?? null;

    const rgStatus = useMemo(() => {
        if (rgDiff == null) return { label: 'Unknown', color: 'text-white/40', icon: null };
        if (rgDiff < 0) return { label: 'Sustainable (r < g)', color: 'text-emerald-400', icon: TrendingDown };
        if (rgDiff < 1) return { label: 'Marginal', color: 'text-amber-400', icon: TrendingUp };
        return { label: 'Unsustainable (r > g)', color: 'text-rose-400', icon: TrendingUp };
    }, [rgDiff]);

    const primaryBalanceGap = fiscalBalance?.value != null
        ? Math.max(0, -fiscalBalance.value - (rgDiff != null && rgDiff < 0 ? 0 : 1.5))
        : null;

    const StatusIcon = rgStatus.icon;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <Scale size={20} className="text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-uppercase italic">
                        Debt Sustainability Dashboard
                    </h3>
                    <p className="text-xs text-muted-foreground/60">
                        r-g differential and scenario sensitivity — sovereign credit analyst view
                    </p>
                </div>
            </div>

            {/* r-g hero */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className={cn(
                    'lg:col-span-1 p-6 rounded-2xl border',
                    rgDiff != null && rgDiff >= 0
                        ? 'bg-rose-500/[0.04] border-rose-500/15'
                        : 'bg-emerald-500/[0.04] border-emerald-500/15'
                )}>
                    <p className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-2">
                        r − g Differential
                    </p>
                    <div className="flex items-end gap-3">
                        <p className={cn('text-4xl font-black font-mono', rgStatus.color)}>
                            {rgDiff != null ? `${rgDiff >= 0 ? '+' : ''}${rgDiff.toFixed(2)}` : '—'}
                            <span className="text-lg ml-1">pp</span>
                        </p>
                        {StatusIcon && <StatusIcon size={20} className={rgStatus.color} />}
                    </div>
                    <p className={cn('text-xs mt-2 font-black uppercase tracking-uppercase', rgStatus.color)}>
                        {rgStatus.label}
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-3">
                        10Y CGB ({yield10y?.value?.toFixed(2) ?? '—'}%) − GDP growth ({gdpGrowth?.value?.toFixed(1) ?? '—'}%)
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-2">
                        Current Debt / GDP
                    </p>
                    <p className="text-3xl font-black text-white font-mono">
                        {currentDebt != null ? `${currentDebt.toFixed(0)}%` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-2">IMF general government gross debt</p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-2">
                        Primary Balance Gap
                    </p>
                    <p className="text-3xl font-black text-amber-400 font-mono">
                        {primaryBalanceGap != null ? `${primaryBalanceGap.toFixed(1)}` : '—'}
                        <span className="text-sm text-muted-foreground/50 ml-1">% GDP adj. needed</span>
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-2">
                        Fiscal adjustment to stabilize debt at current trajectory
                    </p>
                </div>
            </div>

            {/* Scenario matrix */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <h4 className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-4">
                    Debt / GDP 2030 — Scenario Sensitivity
                </h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-4 py-2 text-xs font-black uppercase tracking-uppercase text-white/30">Scenario</th>
                                <th className="px-4 py-2 text-xs font-black uppercase tracking-uppercase text-white/30">Growth</th>
                                <th className="px-4 py-2 text-xs font-black uppercase tracking-uppercase text-white/30">Rate</th>
                                <th className="px-4 py-2 text-xs font-black uppercase tracking-uppercase text-white/30">Debt/GDP 2030</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SCENARIOS.map(s => (
                                <tr key={s.label} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                                    <td className="px-4 py-3 text-sm font-bold text-white">{s.label}</td>
                                    <td className="px-4 py-3 text-sm font-mono text-white/70">{s.growth}%</td>
                                    <td className="px-4 py-3 text-sm font-mono text-white/70">{s.rate}%</td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            'text-sm font-black font-mono px-2 py-0.5 rounded-lg',
                                            s.debt2030 >= 150 ? 'bg-rose-500/15 text-rose-400'
                                                : s.debt2030 >= 120 ? 'bg-amber-500/15 text-amber-400'
                                                    : 'bg-emerald-500/15 text-emerald-400'
                                        )}>
                                            {s.debt2030}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-muted-foreground/40 mt-4">
                    Scenarios derived from IMF DSA framework. Low growth + rate shock (2.5% growth, 4% rate) is the binding constraint
                    if property sector deleveraging persists.
                </p>
            </div>

            <div className="p-5 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10 text-sm text-muted-foreground/70 leading-relaxed">
                <span className="font-black uppercase text-xs text-blue-400 mr-2 tracking-uppercase">DSA Thesis:</span>
                China has operated in r &lt; g territory for most of the post-2008 period, allowing debt ratios to rise without
                immediate spiral dynamics. If growth decelerates toward 3% while implicit rates on shadow debt rise, the r-g flip
                becomes the binding constraint on fiscal independence.
            </div>

            <DataProvenanceBadge source="IMF WEO + FRED" methodology="IMF DSA scenario matrix; r-g from live yields" size="sm" />
        </div>
    );
};
import React from 'react';
import { Landmark, TrendingDown, TrendingUp } from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useChinaDebtLayers } from '@/hooks/useChinaDebt';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { cn } from '@/lib/utils';

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
                <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <Landmark size={20} className="text-blue-400" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-uppercase italic">
                        Central Government Debt Monitor
                    </h3>
                    <p className="text-xs text-muted-foreground/60">
                        Auditable sovereign layer — IMF general government vs MoF central debt
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map(({ label, value, unit, source, trend }) => (
                    <div key={label} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-2">{label}</p>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-black text-white font-mono">
                                {value != null ? value.toFixed(1) : '—'}
                            </p>
                            <span className="text-xs text-muted-foreground/50 mb-1">{unit}</span>
                            {trend === 'up' && <TrendingUp size={14} className="text-amber-400 mb-1" />}
                            {trend === 'down' && <TrendingDown size={14} className="text-rose-400 mb-1" />}
                        </div>
                        <p className="text-xs text-muted-foreground/40 mt-1">{source}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Yield curve */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h4 className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-4">
                        CGB Yield Curve
                    </h4>
                    {yieldCurve.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={yieldCurve} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="tenor" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                                <Tooltip contentStyle={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }} />
                                <Line type="monotone" dataKey="yield" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 4 }} name="Yield" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground/50">Yield data unavailable</p>
                    )}
                    <DataProvenanceBadge source="FRED" methodology="INTDSRCNM024N / INTDSRCNM193N" size="sm" className="mt-3" />
                </div>

                {/* Debt progression */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h4 className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-4">
                        Consolidated Debt Trajectory
                    </h4>
                    {debtHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={debtHistory} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                                <Tooltip contentStyle={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Line type="monotone" dataKey="consolidated" stroke="#f59e0b" strokeWidth={2} dot={false} name="IMF Base" />
                                <Line type="monotone" dataKey="high" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="IMF High" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground/50">History unavailable</p>
                    )}
                </div>
            </div>

            <div className={cn(
                'p-5 rounded-2xl border text-sm leading-relaxed',
                fiscalBalance?.value && fiscalBalance.value < -6
                    ? 'bg-rose-500/[0.04] border-rose-500/15 text-rose-200/70'
                    : 'bg-blue-500/[0.04] border-blue-500/15 text-blue-200/70'
            )}>
                <span className="font-black uppercase text-xs mr-2 tracking-uppercase">Stress Signal:</span>
                Foreign holdings of CGBs are not tracked in this module. Monitor fiscal balance deterioration
                {fiscalBalance?.value != null && ` (currently ${fiscalBalance.value.toFixed(1)}% GDP)`} and
                real yield compression as proxies for domestic absorption capacity.
            </div>
        </div>
    );
};
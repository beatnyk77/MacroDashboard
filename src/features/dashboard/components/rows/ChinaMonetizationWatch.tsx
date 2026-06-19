import React from 'react';
import { Banknote, AlertTriangle } from 'lucide-react';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
} from 'recharts';
import { usePBOCOps } from '@/hooks/useChinaMacro';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useLatestChinaDebtComposites } from '@/hooks/useChinaDebt';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { cn } from '@/lib/utils';

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
        return <div className="h-[300px] rounded-2xl bg-white/[0.02] animate-pulse" />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                        <Banknote size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-uppercase italic">
                            Monetization Watch
                        </h3>
                        <p className="text-xs text-muted-foreground/60">
                            Is the PBOC quietly financing the fiscal deficit?
                        </p>
                    </div>
                </div>
                {isFiscalDominance && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-uppercase">
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
                        'p-5 rounded-2xl border',
                        warn ? 'bg-amber-500/[0.04] border-amber-500/15' : 'bg-white/[0.02] border-white/5'
                    )}>
                        <p className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-2">{label}</p>
                        <p className={cn('font-black font-mono', text ? 'text-lg text-white' : 'text-2xl text-white')}>
                            {value != null ? (text ? String(value) : typeof value === 'number' ? value.toFixed(1) : value) : '—'}
                            {unit && !text && <span className="text-xs text-muted-foreground/50 ml-1">{unit}</span>}
                        </p>
                    </div>
                ))}
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <h4 className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-4">
                    M2 Growth vs PBOC Policy Rate
                </h4>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip contentStyle={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }} />
                            <ReferenceLine yAxisId="left" y={8} stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" label={{ value: 'M2 8%', fill: 'rgba(245,158,11,0.5)', fontSize: 10 }} />
                            <Bar yAxisId="left" dataKey="m2" fill="rgba(168,85,247,0.4)" name="M2 Growth" radius={[2, 2, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="mlf" stroke="#f87171" strokeWidth={2} dot={false} name="MLF Rate" />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-sm text-muted-foreground/50">PBOC operations data unavailable</p>
                )}
                <DataProvenanceBadge source="PBOC via FRED" methodology="MYAGM2CNM189N + PBoC policy rates" size="sm" className="mt-3" />
            </div>

            <p className="text-sm text-muted-foreground/70 leading-relaxed p-5 rounded-2xl bg-purple-500/[0.03] border border-purple-500/10">
                <span className="font-black uppercase text-xs text-purple-400 mr-2 tracking-uppercase">PSL Signal:</span>
                Pledged Supplemental Lending (PSL) is China&apos;s quasi-fiscal channel via policy banks.
                Persistent M2 growth above nominal GDP signals sterilization limits — the fiscal dominance threshold
                approaches when interest payments exceed ~10% of fiscal revenue (including LGFV servicing).
            </p>
        </div>
    );
};
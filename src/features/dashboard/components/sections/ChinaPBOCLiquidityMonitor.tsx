import React from 'react';
import { cn } from '@/lib/utils';
import { usePBOCOps } from '@/hooks/useChinaMacro';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const REGIME_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    Easing:    { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    Neutral:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   glow: 'shadow-amber-500/20' },
    Tightening:{ bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'text-rose-400',    glow: 'shadow-rose-500/20' },
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-950 border border-white/12 rounded-xl p-3 text-xs shadow-xl">
            <p className="text-muted-foreground mb-2 font-black uppercase tracking-widest">{label}</p>
            {payload.map((p: any) => (
                <div key={p.name} className="flex justify-between gap-4">
                    <span style={{ color: p.color }}>{p.name}</span>
                    <span className="text-white font-black">{p.value?.toFixed(2)}%</span>
                </div>
            ))}
        </div>
    );
};

export const ChinaPBOCLiquidityMonitor: React.FC = () => {
    const { data: pbocOps, isLoading } = usePBOCOps(24);

    const latest = pbocOps?.[0];
    const regimeStyle = REGIME_STYLES[latest?.regime_label ?? 'Neutral'];

    const RegimeIcon = !latest ? Minus
        : latest.regime_label === 'Easing' ? TrendingDown
        : latest.regime_label === 'Tightening' ? TrendingUp
        : Minus;

    // Build 12-month chart series (reversed for chronological order)
    const chartData = (pbocOps ?? []).slice(0, 12).reverse().map(r => ({
        date: r.date.slice(0, 7),
        'MLF Rate': r.mlf_rate,
        '7d Repo': r.reverse_repo_7d,
        'M2 Growth': r.m2_growth_yoy,
    }));

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                        <Activity className="text-red-500 w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-white uppercase">
                            PBOC Liquidity <span className="text-red-500">Operations</span>
                        </h3>
                        <p className="text-muted-foreground text-xs mt-0.5">Monetary regime · MLF · 7d Repo · M2</p>
                    </div>
                </div>

                {/* Regime Badge */}
                {latest && (
                    <div className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-2xl border shadow-lg',
                        regimeStyle.bg, regimeStyle.border, `shadow-${regimeStyle.glow}`
                    )}>
                        <RegimeIcon size={14} className={regimeStyle.text} />
                        <span className={cn('text-sm font-black uppercase tracking-widest', regimeStyle.text)}>
                            {latest.regime_label}
                        </span>
                        <span className="text-muted-foreground text-xs uppercase tracking-widest ml-2">PBOC Stance</span>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="h-48 rounded-2xl bg-white/[0.02] animate-pulse" />
            ) : (
                <>
                    {/* KPI Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: '1Y MLF Rate', value: latest?.mlf_rate, unit: '%', color: 'text-red-400', desc: 'Medium-term Lending Facility' },
                            { label: '7d Reverse Repo', value: latest?.reverse_repo_7d, unit: '%', color: 'text-orange-400', desc: 'Short-term policy anchor' },
                            { label: 'M2 Growth YoY', value: latest?.m2_growth_yoy, unit: '%', color: 'text-amber-400', desc: 'Broad money supply growth' },
                            { label: 'PBOC vs Fed Gap', value: latest?.pboc_vs_fed_gap, unit: '%', color: latest?.pboc_vs_fed_gap && latest.pboc_vs_fed_gap < 0 ? 'text-rose-400' : 'text-emerald-400', desc: 'MLF minus Fed Funds Rate' },
                        ].map(({ label, value, unit, color, desc }) => (
                            <div key={label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-widest mb-1">{label}</p>
                                <p className="text-xs text-muted-foreground/40 mb-2">{desc}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={cn('text-2xl font-black tabular-nums tracking-tighter', color)}>
                                        {value != null ? value.toFixed(2) : '--'}
                                    </span>
                                    <span className="text-xs text-white/20 uppercase">{unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Rate Corridor Chart */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-4">
                            Rate Corridor & M2 Growth — 12 Months
                        </p>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={chartData} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                                <Line type="monotone" dataKey="MLF Rate" stroke="#f87171" strokeWidth={2} dot={false} name="MLF Rate" />
                                <Line type="monotone" dataKey="7d Repo" stroke="#fb923c" strokeWidth={2} dot={false} name="7d Repo" strokeDasharray="5 2" />
                                <Line type="monotone" dataKey="M2 Growth" stroke="#fbbf24" strokeWidth={1.5} dot={false} name="M2 Growth" />
                                <Legend iconType="line" wrapperStyle={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Net Liquidity Signal Bar */}
                    {latest && (
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-black text-white/50 uppercase tracking-widest">Net Liquidity Signal (M2 - Nominal GDP proxy)</span>
                                <span className={cn('text-sm font-black tabular-nums', latest.net_liquidity_signal >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                    {latest.net_liquidity_signal >= 0 ? '+' : ''}{latest.net_liquidity_signal?.toFixed(2)}%
                                </span>
                            </div>
                            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={cn('h-full rounded-full transition-all duration-700', latest.net_liquidity_signal >= 0 ? 'bg-emerald-500' : 'bg-rose-500')}
                                    style={{ width: `${Math.min(Math.abs(latest.net_liquidity_signal) / 5 * 100, 100)}%`, marginLeft: latest.net_liquidity_signal < 0 ? 'auto' : '0' }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground/40 mt-1">
                                {latest.net_liquidity_signal >= 0
                                    ? 'Positive: Excess liquidity supports credit expansion'
                                    : 'Negative: Liquidity tighter than nominal growth — watch for credit stress'}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

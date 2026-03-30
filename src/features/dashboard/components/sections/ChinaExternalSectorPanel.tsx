import React from 'react';
import { cn } from '@/lib/utils';
import { useChinaMacroPulse, useLatestChinaMetric } from '@/hooks/useChinaMacro';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { Package2, Anchor } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-950 border border-white/12 rounded-xl p-3 text-xs shadow-xl">
            <p className="text-muted-foreground mb-2 font-black uppercase tracking-uppercase">{label}</p>
            {payload.map((p: any) => (
                <div key={p.name} className="flex justify-between gap-4">
                    <span style={{ color: p.color ?? '#fff' }}>{p.name}</span>
                    <span className="text-white font-black">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
                </div>
            ))}
        </div>
    );
};

export const ChinaExternalSectorPanel: React.FC = () => {
    const { data: tradePulse } = useChinaMacroPulse(
        ['CN_TRADE_BALANCE', 'CN_EXPORT_GROWTH', 'CN_FX_RESERVES_TN'],
        24
    );
    const { data: latestFX } = useLatestChinaMetric('CN_FX_RESERVES_TN');
    const { data: latestTrade } = useLatestChinaMetric('CN_TRADE_BALANCE');
    const { data: latestExports } = useLatestChinaMetric('CN_EXPORT_GROWTH');

    // Build chart data by date
    const tradeByDate: Record<string, any> = {};
    for (const row of tradePulse ?? []) {
        if (!tradeByDate[row.date]) tradeByDate[row.date] = { date: row.date.slice(0, 7) };
        if (row.metric_id === 'CN_TRADE_BALANCE') tradeByDate[row.date].tradeBalance = row.value;
        if (row.metric_id === 'CN_EXPORT_GROWTH') tradeByDate[row.date].exportGrowth = row.value;
        if (row.metric_id === 'CN_FX_RESERVES_TN') tradeByDate[row.date].fxReserves = row.value;
    }
    const tradeData = Object.values(tradeByDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-12);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Package2 className="text-blue-400 w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black tracking-heading text-white uppercase">
                        External Sector <span className="text-blue-400">&amp; Trade</span>
                    </h3>
                    <p className="text-muted-foreground text-xs mt-0.5">Trade Balance · Export Growth · FX Reserves</p>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    {
                        label: 'Trade Balance',
                        value: latestTrade?.value != null ? `$${latestTrade.value.toFixed(1)}Bn` : '--',
                        sub: 'Monthly surplus/deficit',
                        color: 'text-blue-400',
                        status: (latestTrade?.value ?? 0) > 70 ? 'safe' : 'warning',
                    },
                    {
                        label: 'Export Growth',
                        value: latestExports?.value != null ? `${latestExports.value >= 0 ? '+' : ''}${latestExports.value.toFixed(1)}%` : '--',
                        sub: 'YoY nominal exports',
                        color: (latestExports?.value ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400',
                        status: (latestExports?.value ?? 0) >= 0 ? 'safe' : 'warning',
                    },
                    {
                        label: 'PBOC FX Reserves',
                        value: latestFX?.value != null ? `$${latestFX.value.toFixed(2)}Tn` : '--',
                        sub: 'Total foreign exchange holdings',
                        color: 'text-cyan-400',
                        status: (latestFX?.value ?? 0) > 3.0 ? 'safe' : 'warning',
                    },
                ].map(({ label, value, sub, color, status }) => (
                    <div key={label} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase">{label}</p>
                            <div className={cn('w-1.5 h-1.5 rounded-full', status === 'safe' ? 'bg-emerald-500' : 'bg-amber-500')} />
                        </div>
                        <p className={cn('text-3xl font-black tabular-nums tracking-heading mb-1', color)}>{value}</p>
                        <p className="text-xs text-muted-foreground/40">{sub}</p>
                    </div>
                ))}
            </div>

            {/* Trade Balance Waterfall Chart */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-xs font-black text-white/60 uppercase tracking-uppercase mb-4">
                    Monthly Trade Balance — 12 Months (USD Bn)
                </p>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={tradeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="tradeBalance" radius={[4, 4, 0, 0]} name="Trade Balance (USD Bn)">
                            {tradeData.map((entry, index) => (
                                <Cell key={index} fill={(entry.tradeBalance ?? 0) > 90 ? '#3b82f6' : '#6366f1'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Export Growth Trend + FX Reserves */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-xs font-black text-white/60 uppercase tracking-uppercase mb-4">Export Growth YoY (%)</p>
                    <ResponsiveContainer width="100%" height={130}>
                        <BarChart data={tradeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                            <Bar dataKey="exportGrowth" radius={[3, 3, 0, 0]} name="Export Growth (%)">
                                {tradeData.map((entry, idx) => (
                                    <Cell key={idx} fill={(entry.exportGrowth ?? 0) >= 0 ? '#34d399' : '#f87171'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-xs font-black text-white/60 uppercase tracking-uppercase mb-4">FX Reserves Trend (USD Tn)</p>
                    <ResponsiveContainer width="100%" height={130}>
                        <AreaChart data={tradeData}>
                            <defs>
                                <linearGradient id="fxGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                            <YAxis domain={[3.0, 3.5]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="fxReserves" stroke="#22d3ee" strokeWidth={2} fill="url(#fxGrad)" name="FX Reserves (USD Tn)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* RMB signal note */}
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-start gap-3">
                    <Anchor size={14} className="text-blue-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-xs font-black text-blue-400 uppercase tracking-uppercase mb-1">RMB Intervention Signal</p>
                        <p className="text-xs text-muted-foreground/60 leading-relaxed">
                            PBOC FX reserves declining alongside strong trade surplus indicates stealth intervention via state bank proxies — a classic signal of capital outflow management. Rising reserves alongside surplus = passive accumulation (no intervention).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

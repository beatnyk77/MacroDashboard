import React from 'react';
import { cn } from '@/lib/utils';
import { useChinaMacroPulse, useLatestChinaMetric } from '@/hooks/useChinaMacro';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line, Legend
} from 'recharts';
import { Factory } from 'lucide-react';

const GaugeNeedle: React.FC<{ value: number }> = ({ value }) => {
    // value is PMI index. 50 = neutral. Range 44–56.
    const angle = ((value - 44) / 12) * 180 - 90; // maps 44->-90, 56->90
    return (
        <div className="relative flex items-center justify-center">
            <svg viewBox="0 0 120 70" className="w-32 h-20">
                <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="50%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                </defs>
                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="url(#gaugeGrad)" strokeWidth="6" strokeLinecap="round" />
                <line
                    x1="60" y1="60"
                    x2={60 + 40 * Math.cos((angle * Math.PI) / 180)}
                    y2={60 + 40 * Math.sin((angle * Math.PI) / 180)}
                    stroke="white" strokeWidth="2" strokeLinecap="round"
                />
                <circle cx="60" cy="60" r="3" fill="white" />
                <text x="10" y="68" fill="rgba(255,255,255,0.4)" fontSize="7">44</text>
                <text x="53" y="15" fill="rgba(255,255,255,0.4)" fontSize="7">50</text>
                <text x="103" y="68" fill="rgba(255,255,255,0.4)" fontSize="7">56</text>
            </svg>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-950 border border-white/12 rounded-xl p-3 text-xs shadow-xl">
            <p className="text-muted-foreground mb-2 font-black uppercase tracking-uppercase">{label}</p>
            {payload.map((p: any) => (
                <div key={p.name} className="flex justify-between gap-4">
                    <span style={{ color: p.color }}>{p.name}</span>
                    <span className="text-white font-black">{p.value?.toFixed(1)}</span>
                </div>
            ))}
            <div className="mt-1 pt-1 border-t border-white/12">
                <span className="text-muted-foreground/50">{(payload[0]?.value ?? 0) >= 50 ? '▲ Expansion' : '▼ Contraction'}</span>
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

    const latestNBS = pmiData[pmiData.length - 1]?.NBS ?? 50.1;
    const latestCaixin = pmiData[pmiData.length - 1]?.Caixin ?? 50.5;

    const pmiStatus = (v: number) => v >= 50 ? { label: 'Expanding', cls: 'text-emerald-400' } : { label: 'Contracting', cls: 'text-rose-400' };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <Factory className="text-orange-500 w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black tracking-heading text-white uppercase">
                        Real Economy <span className="text-orange-500">Activity</span>
                    </h3>
                    <p className="text-muted-foreground text-xs mt-0.5">PMI · Industrial Production · Retail · Deflation Pressure</p>
                </div>
            </div>

            {isLoading ? (
                <div className="h-48 rounded-2xl bg-white/[0.02] animate-pulse" />
            ) : (
                <>
                    {/* PMI Dual Gauge */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'NBS PMI', value: latestNBS, sub: 'Official Manufacturing PMI', color: 'text-red-400' },
                            { label: 'Caixin PMI', value: latestCaixin, sub: 'Private sector / SME focus', color: 'text-amber-400' },
                        ].map(({ label, value, sub, color }) => {
                            const s = pmiStatus(value);
                            return (
                                <div key={label} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center gap-2">
                                    <GaugeNeedle value={value} />
                                    <p className={cn('text-3xl font-black tabular-nums tracking-heading', color)}>{value.toFixed(1)}</p>
                                    <p className={cn('text-xs font-black uppercase tracking-uppercase', s.cls)}>{s.label}</p>
                                    <p className="text-xs font-black text-white/50 uppercase tracking-uppercase">{label}</p>
                                    <p className="text-xs text-muted-foreground/40">{sub}</p>
                                    <div className={cn('w-full h-0.5 rounded-full mt-1', value >= 50 ? 'bg-emerald-500/30' : 'bg-rose-500/30')} />
                                    <p className="text-xs text-muted-foreground/30">50.0 expansion threshold</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* NBS vs Caixin 12-month trend */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-xs font-black text-white/60 uppercase tracking-uppercase mb-4">PMI — NBS vs Caixin (12 Months)</p>
                        <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={pmiData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                                <YAxis domain={[46, 54]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={50} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" label={{ value: '50', fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                                <Line type="monotone" dataKey="NBS" stroke="#f87171" strokeWidth={2} dot={false} name="NBS" />
                                <Line type="monotone" dataKey="Caixin" stroke="#fbbf24" strokeWidth={2} dot={false} name="Caixin" strokeDasharray="5 2" />
                                <Legend iconType="line" wrapperStyle={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Activity Metrics + Deflation */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Industrial Prod.', data: latestIP, unit: '%', color: 'text-orange-400' },
                            { label: 'Retail Sales', data: latestRetail, unit: '%', color: 'text-amber-400' },
                            { label: 'Fixed Asset Inv.', data: latestFAI, unit: '%', color: 'text-yellow-400' },
                            { label: 'Corp. Distress', data: latestDistress, unit: 'pts', color: (latestDistress?.value ?? 0) < -1.5 ? 'text-rose-400' : 'text-amber-400', desc: 'CPI-PPI spread: negative = margin compression' },
                        ].map(({ label, data, unit, color }) => (
                            <div key={label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase mb-2">{label}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={cn('text-2xl font-black tabular-nums tracking-heading', color)}>
                                        {data?.value != null ? (data.value >= 0 ? '+' : '') + data.value.toFixed(1) : '--'}
                                    </span>
                                    <span className="text-xs text-white/20 uppercase">{unit}</span>
                                </div>
                                <p className="text-xs text-muted-foreground/30 mt-1">{data?.date?.slice(0, 7) ?? 'Latest'}</p>
                            </div>
                        ))}
                    </div>

                    {/* Institutional Insight */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-500/5 via-transparent to-amber-500/5 border border-white/5">
                        <p className="text-xs font-black text-amber-400 uppercase tracking-uppercase mb-2">📡 Analyst Insight</p>
                        <p className="text-xs text-muted-foreground/70 leading-relaxed">
                            <strong className="text-white/80">PMI Divergence:</strong> When Caixin PMI significantly outperforms NBS PMI, it suggests private-sector SMEs are recovering faster than state-owned enterprises — a positive signal for urban employment and consumption. Watch for convergence as a regime confirmation trigger.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

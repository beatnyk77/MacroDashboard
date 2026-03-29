import React from 'react';
import { cn } from '@/lib/utils';
import { useChinaMacroPulse } from '@/hooks/useChinaMacro';
import { usePBOCOps } from '@/hooks/useChinaMacro';
import {
    RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine
} from 'recharts';
import { Cpu, TrendingUp, TrendingDown } from 'lucide-react';

const SignalCard: React.FC<{
    label: string;
    sublabel: string;
    value: string;
    delta?: string;
    trend?: 'up' | 'down' | 'neutral';
    color: string;
    borderColor: string;
    desc: string;
    interpretation: string;
}> = ({ label, sublabel, value, delta, trend, color, borderColor, desc, interpretation }) => (
    <div className={cn('p-5 rounded-2xl bg-white/[0.02] border transition-all hover:bg-white/[0.04]', borderColor)}>
        <p className={cn('text-[0.55rem] font-black uppercase tracking-widest mb-1', color)}>{label}</p>
        <p className="text-xs text-muted-foreground/40 mb-3">{sublabel}</p>
        <div className="flex items-baseline justify-between mb-2">
            <p className={cn('text-3xl font-black tabular-nums tracking-tighter', color)}>{value}</p>
            {delta && (
                <div className={cn('flex items-center gap-0.5 text-[0.65rem] font-black',
                    trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-muted-foreground/40'
                )}>
                    {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : null}
                    {delta}
                </div>
            )}
        </div>
        <p className="text-xs text-muted-foreground/30 mb-2">{desc}</p>
        <div className={cn('p-2 rounded-xl text-xs text-muted-foreground/60 leading-relaxed border', borderColor, 'bg-white/[0.01]')}>
            {interpretation}
        </div>
    </div>
);

export const ChinaProprietarySignals: React.FC = () => {
    const { data: pbocOps } = usePBOCOps(12);
    const { data: creditImpulse } = useChinaMacroPulse(['CN_CREDIT_IMPULSE_ADV'], 12);
    const { data: dedollar } = useChinaMacroPulse(['CN_DEDOLLAR_VELOCITY'], 8);
    const { data: corpDistress } = useChinaMacroPulse(['CN_CORP_DISTRESS'], 12);

    const latestPBOC = pbocOps?.[0];
    const latestCI = creditImpulse?.[0];
    const latestDD = dedollar?.[0];
    const latestCD = corpDistress?.[0];

    // Build Credit Impulse trend
    const ciTrend = [...(creditImpulse ?? [])].reverse().map(r => ({
        date: r.date.slice(0, 7),
        value: r.value,
    }));

    // Build Radar data for summary
    const radarData = [
        { subject: 'Liquidity', value: Math.min(100, Math.max(0, 50 + (latestPBOC?.net_liquidity_signal ?? 0) * 10)) },
        { subject: 'Credit', value: Math.min(100, Math.max(0, 50 + (latestCI?.value ?? 0) * 15)) },
        { subject: 'External', value: 70 },  // Strong surplus — proxy
        { subject: 'USD Decoupling', value: Math.min(100, 60 + Math.abs(latestDD?.value ?? 0) * 20) },
        { subject: 'Margins', value: Math.min(100, Math.max(0, 50 + (latestCD?.value ?? 0) * 5)) },
    ];

    const pbocFedGap = latestPBOC?.pboc_vs_fed_gap ?? -3.33;
    const pbocDivergenceLabel = pbocFedGap < -2 ? 'Wide — Capital Outflow Pressure' : pbocFedGap > -1 ? 'Compressing — Supportive' : 'Neutral';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <Cpu className="text-purple-400 w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black tracking-tight text-white uppercase">
                        Proprietary <span className="text-purple-400">Alpha Signals</span>
                    </h3>
                    <p className="text-muted-foreground text-xs mt-0.5">Credit Impulse · De-Dollarization · Distress · PBOC/Fed Divergence</p>
                </div>
            </div>

            {/* 2x2 Signal Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SignalCard
                    label="China Credit Impulse"
                    sublabel="New credit as % of GDP — 9-12M leading indicator"
                    value={latestCI?.value != null ? `${latestCI.value >= 0 ? '+' : ''}${latestCI.value.toFixed(1)}%GDP` : '--'}
                    delta={latestCI?.value != null && creditImpulse?.[1]?.value != null
                        ? `${(latestCI.value - creditImpulse[1].value) >= 0 ? '+' : ''}${(latestCI.value - creditImpulse[1].value).toFixed(1)}`
                        : undefined}
                    trend={latestCI?.value != null && creditImpulse?.[1]?.value != null
                        ? latestCI.value > creditImpulse[1].value ? 'up' : 'down'
                        : 'neutral'}
                    color="text-amber-400"
                    borderColor="border-amber-500/20"
                    desc="Source: PBoC Total Social Financing / Nominal GDP"
                    interpretation={
                        (latestCI?.value ?? 0) > 1.5
                            ? '🟢 Rising impulse → bullish for commodities & EM equities in 9-12M'
                            : (latestCI?.value ?? 0) > 0
                            ? '🟡 Positive but decelerating → mixed signal'
                            : '🔴 Negative impulse → demand contraction signal'
                    }
                />

                <SignalCard
                    label="De-Dollarization Velocity"
                    sublabel="USD share of COFER reserves YoY Δ"
                    value={latestDD?.value != null ? `${latestDD.value.toFixed(1)}%` : '--'}
                    delta={latestDD?.value != null ? `${latestDD.value.toFixed(1)}% YoY` : undefined}
                    trend={latestDD?.value != null ? (latestDD.value < 0 ? 'down' : 'up') : 'neutral'}
                    color="text-red-400"
                    borderColor="border-red-500/20"
                    desc="Source: IMF COFER database (quarterly)"
                    interpretation={
                        (latestDD?.value ?? 0) < -1.0
                            ? '🔴 Accelerating USD decoupling — CIPS + CNY trade routes expanding'
                            : (latestDD?.value ?? 0) < 0
                            ? '🟡 Slow de-dollarization — structural but gradual'
                            : '⬜ USD dominance stable'
                    }
                />

                <SignalCard
                    label="Corporate Distress Score"
                    sublabel="CPI-PPI spread — proxy for margin compression"
                    value={latestCD?.value != null ? `${latestCD.value.toFixed(1)} pts` : '--'}
                    delta={latestCD?.value != null && corpDistress?.[1]?.value != null
                        ? `${(latestCD.value - corpDistress[1].value) >= 0 ? '+' : ''}${(latestCD.value - corpDistress[1].value).toFixed(1)}`
                        : undefined}
                    trend={latestCD?.value != null && corpDistress?.[1]?.value != null
                        ? latestCD.value < corpDistress[1].value ? 'down' : 'up'
                        : 'neutral'}
                    color={(latestCD?.value ?? 0) < -1.5 ? 'text-rose-400' : 'text-amber-400'}
                    borderColor={(latestCD?.value ?? 0) < -1.5 ? 'border-rose-500/20' : 'border-amber-500/20'}
                    desc="Negative = PPI deflation faster than CPI → industrial margin squeeze"
                    interpretation={
                        (latestCD?.value ?? 0) < -2.0
                            ? '🔴 Severe margin compression → watch for credit defaults & SOE support'
                            : (latestCD?.value ?? 0) < -1.0
                            ? '🟡 Moderate pressure → property + industrial sector stress'
                            : '🟢 Spreads recovering → earnings stabilization signal'
                    }
                />

                <SignalCard
                    label="PBOC vs Fed Divergence"
                    sublabel="MLF Rate minus Fed Funds Rate"
                    value={pbocFedGap !== null ? `${pbocFedGap.toFixed(2)}%` : '--'}
                    color={pbocFedGap < -2 ? 'text-rose-400' : 'text-emerald-400'}
                    borderColor={pbocFedGap < -2 ? 'border-rose-500/20' : 'border-emerald-500/20'}
                    desc="Source: PBOC (MLF 1Y) vs Fed Funds Effective Rate"
                    interpretation={pbocFedGap < -2
                        ? `🔴 ${pbocDivergenceLabel} — negative carry on CNY-denominated assets vs USD`
                        : `🟢 ${pbocDivergenceLabel} — narrowing differential reduces outflow pressure`
                    }
                />
            </div>

            {/* Credit Impulse Trend */}
            {ciTrend.length > 0 && (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-[0.65rem] font-black text-white/60 uppercase tracking-widest">Credit Impulse Trend — Lead Indicator for Global Demand</p>
                        <span className="text-[0.55rem] text-muted-foreground/30">9-12M forward lead</span>
                    </div>
                    <ResponsiveContainer width="100%" height={150}>
                        <AreaChart data={ciTrend}>
                            <defs>
                                <linearGradient id="ciGradPos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#030712', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
                                labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                                itemStyle={{ color: '#fbbf24' }}
                            />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                            <Area type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2.5} fill="url(#ciGradPos)" name="Credit Impulse (%GDP)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Macro Radar */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[0.65rem] font-black text-white/60 uppercase tracking-widest mb-4">China Macro Composite — Radar View</p>
                <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 800 }} />
                        <Radar
                            name="China Signal"
                            dataKey="value"
                            stroke="#f87171"
                            fill="#f87171"
                            fillOpacity={0.12}
                            strokeWidth={2}
                        />
                        <Tooltip
                            contentStyle={{ background: '#030712', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
                            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                            itemStyle={{ color: '#f87171' }}
                            formatter={(val: number) => [`${val.toFixed(0)}/100`, 'Score']}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

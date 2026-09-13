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
    <div className={cn('p-5 rounded-2xl bg-card border shadow-sm transition-all hover:border-border/80', borderColor)}>
        <p className={cn('text-xs font-black uppercase tracking-uppercase mb-1', color)}>{label}</p>
        <p className="text-xs text-muted-foreground mb-3">{sublabel}</p>
        <div className="flex items-baseline justify-between mb-2">
            <p className={cn('text-3xl font-black tabular-nums tracking-heading', color)}>{value}</p>
            {delta && (
                <div className={cn('flex items-center gap-0.5 text-xs font-black',
                    trend === 'up' ? 'text-emerald-700 dark:text-emerald-400' : trend === 'down' ? 'text-rose-700 dark:text-rose-400' : 'text-muted-foreground'
                )}>
                    {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : null}
                    {delta}
                </div>
            )}
        </div>
        <p className="text-xs text-muted-foreground/80 mb-2">{desc}</p>
        <div className={cn('p-2 rounded-xl text-xs text-muted-foreground leading-relaxed border bg-muted/30', borderColor)}>
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

    // Build Radar data for summary — omit axes with no observed metric (never plot midpoints)
    const radarData = [
        latestPBOC?.net_liquidity_signal != null && {
            subject: 'Liquidity',
            value: Math.min(100, Math.max(0, 50 + latestPBOC.net_liquidity_signal * 10)),
        },
        latestCI?.value != null && {
            subject: 'Credit',
            value: Math.min(100, Math.max(0, 50 + latestCI.value * 15)),
        },
        latestDD?.value != null && {
            subject: 'USD Decoupling',
            value: Math.min(100, 60 + Math.abs(latestDD.value) * 20),
        },
        latestCD?.value != null && {
            subject: 'Margins',
            value: Math.min(100, Math.max(0, 50 + latestCD.value * 5)),
        },
    ].filter(Boolean) as { subject: string; value: number }[];

    const pbocFedGap = latestPBOC?.pboc_vs_fed_gap ?? null;
    const pbocDivergenceLabel = pbocFedGap == null
        ? 'No data available for this window.'
        : pbocFedGap < -2
            ? 'Wide — Capital Outflow Pressure'
            : pbocFedGap > -1
                ? 'Compressing — Supportive'
                : 'Neutral';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border pb-6">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <Cpu className="text-purple-600 dark:text-purple-400 w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black tracking-heading text-foreground uppercase">
                        Proprietary <span className="text-purple-600 dark:text-purple-400">Alpha Signals</span>
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
                    color="text-amber-600 dark:text-amber-400"
                    borderColor="border-border"
                    desc="Source: PBoC Total Social Financing / Nominal GDP"
                    interpretation={
                        latestCI?.value == null
                            ? 'No data available for this window.'
                            : latestCI.value > 1.5
                            ? '🟢 Rising impulse → bullish for commodities & EM equities in 9-12M'
                            : latestCI.value > 0
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
                    color="text-red-600 dark:text-red-400"
                    borderColor="border-border"
                    desc="Source: IMF COFER database (quarterly)"
                    interpretation={
                        latestDD?.value == null
                            ? 'No data available for this window.'
                            : latestDD.value < -1.0
                            ? '🔴 Accelerating USD decoupling — CIPS + CNY trade routes expanding'
                            : latestDD.value < 0
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
                    color={latestCD?.value == null ? 'text-muted-foreground' : latestCD.value < -1.5 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}
                    borderColor="border-border"
                    desc="Negative = PPI deflation faster than CPI → industrial margin squeeze"
                    interpretation={
                        latestCD?.value == null
                            ? 'No data available for this window.'
                            : latestCD.value < -2.0
                            ? '🔴 Severe margin compression → watch for credit defaults & SOE support'
                            : latestCD.value < -1.0
                            ? '🟡 Moderate pressure → property + industrial sector stress'
                            : '🟢 Spreads recovering → earnings stabilization signal'
                    }
                />

                <SignalCard
                    label="PBOC vs Fed Divergence"
                    sublabel="MLF Rate minus Fed Funds Rate"
                    value={pbocFedGap != null ? `${pbocFedGap.toFixed(2)}%` : '--'}
                    color={pbocFedGap == null ? 'text-muted-foreground' : pbocFedGap < -2 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}
                    borderColor="border-border"
                    desc="Source: PBOC (MLF 1Y) vs Fed Funds Effective Rate"
                    interpretation={
                        pbocFedGap == null
                            ? 'No data available for this window.'
                            : pbocFedGap < -2
                                ? `🔴 ${pbocDivergenceLabel} — negative carry on CNY-denominated assets vs USD`
                                : `🟢 ${pbocDivergenceLabel} — narrowing differential reduces outflow pressure`
                    }
                />
            </div>

            {/* Credit Impulse Trend */}
            {ciTrend.length > 0 && (
                <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-xs font-black text-foreground uppercase tracking-uppercase">Credit Impulse Trend — Lead Indicator for Global Demand</p>
                        <span className="text-xs text-muted-foreground">9-12M forward lead</span>
                    </div>
                    <ResponsiveContainer width="100%" height={150}>
                        <AreaChart data={ciTrend}>
                            <defs>
                                <linearGradient id="ciGradPos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" />
                            <XAxis dataKey="date" tick={{ fill: 'currentColor', fontSize: 9 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
                            <YAxis tick={{ fill: 'currentColor', fontSize: 9 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 8, fontSize: 10, color: 'hsl(var(--popover-foreground))' }}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                                itemStyle={{ color: '#fbbf24' }}
                            />
                            <ReferenceLine y={0} stroke="currentColor" className="text-border" strokeDasharray="4 4" />
                            <Area type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2.5} fill="url(#ciGradPos)" name="Credit Impulse (%GDP)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Macro Radar */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
                <p className="text-xs font-black text-foreground uppercase tracking-uppercase mb-4">China Macro Composite — Radar View</p>
                <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                        <PolarGrid stroke="currentColor" className="text-border/40" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 800 }} className="text-muted-foreground" />
                        <Radar
                            name="China Signal"
                            dataKey="value"
                            stroke="#f87171"
                            fill="#f87171"
                            fillOpacity={0.12}
                            strokeWidth={2}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 8, fontSize: 10, color: 'hsl(var(--popover-foreground))' }}
                            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                            itemStyle={{ color: '#f87171' }}
                            formatter={(val: number) => [`${val.toFixed(0)}/100`, 'Score']}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

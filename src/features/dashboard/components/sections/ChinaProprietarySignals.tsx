import React from 'react';
import { cn } from '@/lib/utils';
import { StatusDot, type StatusTone } from '@/components/StatusDot';
import { useChinaMacroPulse } from '@/hooks/useChinaMacro';
import { usePBOCOps } from '@/hooks/useChinaMacro';
import {
    RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS } from '@/constants/chartDefaults';
import { Cpu, TrendingUp, TrendingDown } from 'lucide-react';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

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
    tone?: StatusTone;
}> = ({ label, sublabel, value, delta, trend, color, borderColor, desc, interpretation, tone }) => (
    <div className={cn('p-5 rounded-xl bg-card border shadow-sm transition-all hover:border-border/80', borderColor)}>
        <p className={cn('text-xs font-semibold uppercase tracking-wider mb-1', color)}>{label}</p>
        <p className="text-xs text-muted-foreground mb-3">{sublabel}</p>
        <div className="flex items-baseline justify-between mb-2">
            <p className={cn('text-3xl font-bold tabular-nums tracking-heading', color)}>{value}</p>
            {delta && (
                <div className={cn('flex items-center gap-0.5 text-xs font-bold',
                    trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-muted-foreground'
                )}>
                    {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : null}
                    {delta}
                </div>
            )}
        </div>
        <p className="text-xs text-muted-foreground/80 mb-2">{desc}</p>
        <div className={cn('p-2 rounded-xl text-xs text-muted-foreground leading-relaxed border bg-muted/30', borderColor)}>
            {tone && <StatusDot tone={tone} className="mr-2" />}
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
                    <Cpu className="text-purple-400 w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-bold tracking-heading text-foreground uppercase">
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
                    borderColor="border-border"
                    desc="Source: PBoC Total Social Financing / Nominal GDP"
                    interpretation={
                        latestCI?.value == null
                            ? 'No data available for this window.'
                            : latestCI.value > 1.5
                            ? 'Rising impulse → bullish for commodities & EM equities in 9-12M'
                            : latestCI.value > 0
                            ? 'Positive but decelerating → mixed signal'
                            : 'Negative impulse → demand contraction signal'
                    }
                    tone={latestCI?.value == null ? undefined : latestCI.value > 1.5 ? 'ok' : latestCI.value > 0 ? 'caution' : 'stress'}
                />

                <SignalCard
                    label="De-Dollarization Velocity"
                    sublabel="USD share of COFER reserves YoY Δ"
                    value={latestDD?.value != null ? `${latestDD.value.toFixed(1)}%` : '--'}
                    delta={latestDD?.value != null ? `${latestDD.value.toFixed(1)}% YoY` : undefined}
                    trend={latestDD?.value != null ? (latestDD.value < 0 ? 'down' : 'up') : 'neutral'}
                    color="text-red-400"
                    borderColor="border-border"
                    desc="Source: IMF COFER database (quarterly)"
                    interpretation={
                        latestDD?.value == null
                            ? 'No data available for this window.'
                            : latestDD.value < -1.0
                            ? 'Accelerating USD decoupling — CIPS + CNY trade routes expanding'
                            : latestDD.value < 0
                            ? 'Slow de-dollarization — structural but gradual'
                            : 'USD dominance stable'
                    }
                    tone={latestDD?.value == null ? undefined : latestDD.value < -1.0 ? 'stress' : latestDD.value < 0 ? 'caution' : 'neutral'}
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
                    color={latestCD?.value == null ? 'text-muted-foreground' : latestCD.value < -1.5 ? 'text-rose-400' : 'text-amber-400'}
                    borderColor="border-border"
                    desc="Negative = PPI deflation faster than CPI → industrial margin squeeze"
                    interpretation={
                        latestCD?.value == null
                            ? 'No data available for this window.'
                            : latestCD.value < -2.0
                            ? 'Severe margin compression → watch for credit defaults & SOE support'
                            : latestCD.value < -1.0
                            ? 'Moderate pressure → property + industrial sector stress'
                            : 'Spreads recovering → earnings stabilization signal'
                    }
                    tone={latestCD?.value == null ? undefined : latestCD.value < -2.0 ? 'stress' : latestCD.value < -1.0 ? 'caution' : 'ok'}
                />

                <SignalCard
                    label="PBOC vs Fed Divergence"
                    sublabel="MLF Rate minus Fed Funds Rate"
                    value={pbocFedGap != null ? `${pbocFedGap.toFixed(2)}%` : '--'}
                    color={pbocFedGap == null ? 'text-muted-foreground' : pbocFedGap < -2 ? 'text-rose-400' : 'text-emerald-400'}
                    borderColor="border-border"
                    desc="Source: PBOC (MLF 1Y) vs Fed Funds Effective Rate"
                    interpretation={
                        pbocFedGap == null
                            ? 'No data available for this window.'
                            : pbocFedGap < -2
                                ? `${pbocDivergenceLabel} — negative carry on CNY-denominated assets vs USD`
                                : `${pbocDivergenceLabel} — narrowing differential reduces outflow pressure`
                    }
                    tone={pbocFedGap == null ? undefined : pbocFedGap < -2 ? 'stress' : 'ok'}
                />
            </div>

            {/* Credit Impulse Trend */}
            {ciTrend.length > 0 && (
                <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Credit Impulse Trend — Lead Indicator for Global Demand</p>
                        <span className="text-xs text-muted-foreground">9-12M forward lead</span>
                    </div>
                    <MacroChartContainer height={CHART_HEIGHTS.compact}>
                        <AreaChart data={ciTrend}>
                            <defs>
                                <linearGradient id="ciGradPos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.gold} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={CHART_COLORS.gold} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} className="text-border/40" />
                            <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="date" axisLine={false} className="text-muted-foreground" />
                            <YAxis {...DEFAULT_YAXIS_PROPS} width={60} axisLine={false} className="text-muted-foreground" />
                            <Tooltip
                                contentStyle={DEFAULT_TOOLTIP_STYLE}
                                labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                                itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                            />
                            <ReferenceLine y={0} stroke="currentColor" className="text-border" strokeDasharray="4 4" />
                            <Area type="monotone" dataKey="value" stroke={CHART_COLORS.gold} strokeWidth={2.5} fill="url(#ciGradPos)" name="Credit Impulse (%GDP)" />
                        </AreaChart>
                    </MacroChartContainer>
                </div>
            )}

            {/* Macro Radar */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">China Macro Composite — Radar View</p>
                <MacroChartContainer height={CHART_HEIGHTS.standard}>
                    <RadarChart data={radarData}>
                        <PolarGrid stroke="currentColor" className="text-border/40" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 700 }} className="text-muted-foreground" />
                        <Radar
                            name="China Signal"
                            dataKey="value"
                            stroke={CHART_COLORS.stress}
                            fill={CHART_COLORS.stress}
                            fillOpacity={0.12}
                            strokeWidth={2}
                        />
                        <Tooltip
                            contentStyle={DEFAULT_TOOLTIP_STYLE}
                            labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                            itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                            formatter={(val: number) => [`${val.toFixed(0)}/100`, 'Score']}
                        />
                    </RadarChart>
                </MacroChartContainer>
            </div>
        </div>
    );
};

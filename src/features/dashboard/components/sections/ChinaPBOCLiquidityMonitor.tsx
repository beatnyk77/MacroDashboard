import React from 'react';
import { cn } from '@/lib/utils';
import { usePBOCOps } from '@/hooks/useChinaMacro';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS } from '@/constants/chartDefaults';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TerminalChartTooltip, type TerminalChartTooltipProps } from '@/components/charts/TerminalChartTooltip';
import { fixed } from '@/components/charts/chartTooltipFormat';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

const REGIME_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    Easing:    { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    Neutral:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   glow: 'shadow-amber-500/20' },
    Tightening:{ bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'text-rose-400',    glow: 'shadow-rose-500/20' },
};

const CustomTooltip = (props: TerminalChartTooltipProps) => (
    <TerminalChartTooltip {...props} valueFormatter={fixed(2, '%')} />
);

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                        <Activity className="text-red-500 w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-heading text-foreground uppercase">
                            PBOC Liquidity <span className="text-red-500">Operations</span>
                        </h3>
                        <p className="text-muted-foreground text-xs mt-0.5">Monetary regime · MLF · 7d Repo · M2</p>
                    </div>
                </div>

                {/* Regime Badge */}
                {latest && (
                    <div className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-xl border shadow-lg',
                        regimeStyle.bg, regimeStyle.border, `shadow-${regimeStyle.glow}`
                    )}>
                        <RegimeIcon size={14} className={regimeStyle.text} />
                        <span className={cn('text-sm font-semibold uppercase tracking-wider', regimeStyle.text)}>
                            {latest.regime_label}
                        </span>
                        <span className="text-muted-foreground text-xs uppercase tracking-wider ml-2">PBOC Stance</span>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="h-48 rounded-xl bg-card border border-border animate-pulse" />
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
                            <div key={label} className="p-4 rounded-xl bg-card border border-border shadow-sm hover:border-border/80 transition-all">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                                <p className="text-xs text-muted-foreground/80 mb-2">{desc}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={cn('text-2xl font-bold tabular-nums tracking-heading', color)}>
                                        {value != null ? value.toFixed(2) : '--'}
                                    </span>
                                    <span className="text-xs text-muted-foreground uppercase">{unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Rate Corridor Chart */}
                    <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
                            Rate Corridor & M2 Growth — 12 Months
                        </p>
                        <MacroChartContainer height={CHART_HEIGHTS.standard}>
                            <LineChart data={chartData} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
                                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} className="text-border/40" />
                                <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="date" axisLine={false} className="text-muted-foreground" />
                                <YAxis {...DEFAULT_YAXIS_PROPS} width={60} axisLine={false} className="text-muted-foreground" />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={0} stroke="currentColor" className="text-border" strokeDasharray="4 4" />
                                <Line type="monotone" dataKey="MLF Rate" stroke={CHART_COLORS.stress} strokeWidth={2} dot={false} name="MLF Rate" />
                                <Line type="monotone" dataKey="7d Repo" stroke={CHART_COLORS.orange} strokeWidth={2} dot={false} name="7d Repo" strokeDasharray="5 2" />
                                <Line type="monotone" dataKey="M2 Growth" stroke={CHART_COLORS.gold} strokeWidth={1.5} dot={false} name="M2 Growth" />
                                <Legend iconType="line" wrapperStyle={{ fontSize: 11 }} className="text-muted-foreground" />
                            </LineChart>
                        </MacroChartContainer>
                    </div>

                    {/* Net Liquidity Signal Bar */}
                    {latest && (
                        <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Net Liquidity Signal (M2 - Nominal GDP proxy)</span>
                                <span className={cn('text-sm font-bold tabular-nums', latest.net_liquidity_signal >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                    {latest.net_liquidity_signal >= 0 ? '+' : ''}{latest.net_liquidity_signal?.toFixed(2)}%
                                </span>
                            </div>
                            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn('h-full rounded-full transition-all duration-700', latest.net_liquidity_signal >= 0 ? 'bg-emerald-500' : 'bg-rose-500')}
                                    style={{ width: `${Math.min(Math.abs(latest.net_liquidity_signal) / 5 * 100, 100)}%`, marginLeft: latest.net_liquidity_signal < 0 ? 'auto' : '0' }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
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

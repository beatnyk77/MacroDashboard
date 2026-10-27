import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceArea } from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';
import { useGoldRatios } from '@/hooks/useGoldRatios';
import { cn } from '@/lib/utils';
import { AlertTriangle, ShieldCheck, Zap, Clock } from 'lucide-react';
import { TOOLTIP_SHELL_CLASS } from '@/components/charts/chartTooltipFormat';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className={TOOLTIP_SHELL_CLASS}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
            <div className="space-y-2.5">
                {payload.map((entry: any) => (
                    <div key={entry.name} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs font-bold text-slate-400 tracking-heading">{entry.name}</span>
                        </div>
                        <div className="text-right">
                            <div className={cn(
                                "text-xs font-semibold",
                                entry.value != null ? (Math.abs(entry.value) > 2 ? "text-rose-400" : Math.abs(entry.value) > 1.2 ? "text-amber-400" : "text-emerald-400") : "text-slate-400"
                            )}>
                                {entry.value != null ? (entry.value > 0 ? '+' : '') + entry.value.toFixed(2) + 'σ' : 'N/A'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const GoldRatioRibbon: React.FC = () => {
    const { data: ratios, isLoading } = useGoldRatios();

    // Calculate staleness
    const stalenessInfo = useMemo(() => {
        if (!ratios || ratios.length === 0) return { isStale: false, daysOld: 0, severity: 'fresh' };

        const now = new Date();
        const maxDaysOld = Math.max(...ratios.map(r => {
            const lastUpdate = new Date(r.last_updated);
            return Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        }));

        let severity: 'fresh' | 'lagged' | 'very_lagged' = 'fresh';
        if (maxDaysOld > 30) severity = 'very_lagged';
        else if (maxDaysOld > 7) severity = 'lagged';

        return {
            isStale: maxDaysOld > 3,
            daysOld: maxDaysOld,
            severity
        };
    }, [ratios]);

    const chartData = useMemo(() => {
        if (!ratios || ratios.length === 0) return [];

        // Filter valid ratios with history
        const validRatios = ratios.filter(r => r.history && r.history.length > 5);
        if (validRatios.length === 0) return []; // Fallback empty

        const stats = validRatios.reduce((acc, r) => {
            const values = r.history!.map(h => h.value);
            // Calculate robust mean/stdDev based on available history
            const sum = values.reduce((a, b) => a + b, 0);
            const mean = sum / values.length;
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length > 1 ? values.length - 1 : 1);
            const stdDev = Math.sqrt(variance);
            acc[r.ratio_name] = { mean, stdDev: stdDev || 1 }; // Avoid div by zero
            return acc;
        }, {} as Record<string, { mean: number; stdDev: number }>);

        const dateSet = new Set<string>();
        validRatios.forEach(r => r.history!.forEach(h => dateSet.add(h.date)));

        const sortedDates = Array.from(dateSet).sort();
        // Ensure we always have a reasonable window, defaulting to 2 years if < 750 points
        const recentDates = sortedDates.slice(-750);

        return recentDates.map(date => {
            const point: any = { date };
            validRatios.forEach(r => {
                const historyPoint = r.history!.find(h => h.date === date);
                if (historyPoint) {
                    const s = stats[r.ratio_name];
                    const z = (historyPoint.value - s.mean) / s.stdDev;
                    // Cap extreme outliers for chart readability
                    point[r.ratio_name] = Math.max(Math.min(z, 4), -4);
                }
            });
            return point;
        });
    }, [ratios]);

    if (isLoading) {
        return <Skeleton className="h-[500px] w-full rounded-xl bg-white/5" />;
    }

    const series = [
        { key: 'M2/Gold', color: CHART_COLORS.west, label: 'Fiat Liquidity (M2)' },
        { key: 'SPX/Gold', color: CHART_COLORS.expansion, label: 'Equity Valuation (S&P)' },
        { key: 'DEBT/Gold', color: CHART_COLORS.stress, label: 'Public Debt Load' },
        { key: 'Gold/Silver', color: CHART_COLORS.gold, label: 'Hard Money Ratio (GSR)' }
    ];

    // Determine current regime based on average Z-score
    const activeSeries = ratios?.filter(r => series.some(s => s.key === r.ratio_name)) || [];
    const avgZ = activeSeries.length > 0 ? activeSeries.reduce((acc, r) => acc + r.z_score, 0) / activeSeries.length : 0;

    let regimeTitle = 'Neutral Balanced';
    let regimeDesc = 'Ratios are within historical normalization bands. No extreme undervaluation or bubble dynamics detected.';
    let regimeIcon = ShieldCheck;
    let regimeColor = 'text-emerald-400';

    if (avgZ > 1.5) {
        regimeTitle = 'Fiat Overextension';
        regimeDesc = 'Asset prices and debt levels are severely decoupled from hard money benchmarks. High risk of regime shift.';
        regimeIcon = AlertTriangle;
        regimeColor = 'text-amber-500';
    } else if (avgZ < -1.5) {
        regimeTitle = 'Hard Asset Undervaluation';
        regimeDesc = 'Gold is significantly overvalued relative to assets, or asset prices are extremely depressed. Capitulation signal.';
        regimeIcon = Zap;
        regimeColor = 'text-blue-400';
    }

    return (
        <Card className="p-8 bg-background/40 backdrop-blur-3xl border-border shadow-2xl overflow-hidden rounded-xl relative group">
            {/* Ambient Background Radial */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:bg-blue-500/10 transition-colors duration-1000" />

            <div className="relative z-10 space-y-8">
                {/* Staleness Warning Banner */}
                {stalenessInfo.isStale && (
                    <div className={cn(
                        "p-4 rounded-xl border flex items-start gap-3 backdrop-blur-sm",
                        stalenessInfo.severity === 'very_lagged'
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-amber-500/10 border-amber-500/30"
                    )}>
                        <div className={cn(
                            "p-2 rounded-lg flex-shrink-0",
                            stalenessInfo.severity === 'very_lagged' ? "bg-red-500/20" : "bg-amber-500/20"
                        )}>
                            <Clock className={cn(
                                "w-5 h-5",
                                stalenessInfo.severity === 'very_lagged' ? "text-red-400" : "text-amber-400"
                            )} />
                        </div>
                        <div className="space-y-1 flex-1">
                            <div className={cn(
                                "text-xs font-semibold uppercase tracking-wider",
                                stalenessInfo.severity === 'very_lagged' ? "text-red-400" : "text-amber-400"
                            )}>
                                {stalenessInfo.severity === 'very_lagged' ? 'Critical Data Staleness' : 'Data Staleness Warning'}
                            </div>
                            <p className="text-xs leading-tight text-muted-foreground font-medium">
                                Gold ratio data is {stalenessInfo.daysOld} days old. {
                                    stalenessInfo.severity === 'very_lagged'
                                        ? 'Automated refresh in progress. Caution: Use for reference only.'
                                        : 'Latest update may be delayed. Refresh scheduled.'
                                }
                            </p>
                        </div>
                    </div>
                )}

                {/* Header Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-inner">
                                <Zap className="text-amber-500 w-5 h-5 fill-amber-500/20" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-heading text-white uppercase italic">
                                Unified <span className="text-amber-500">Gold</span> Ratio Ribbon
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                            Standardized deviation (Z-Score) of key macro assets priced in Gold.
                            The "Ribbon" visualizes the convergence or divergence of fiat reality from historical hard-money anchors.
                        </p>
                    </div>

                    {/* Regime Status Box */}
                    <div className={cn(
                        "p-5 rounded-xl border flex items-start gap-4 transition-all duration-500",
                        avgZ > 1.5 ? "bg-amber-500/5 border-amber-500/20" : avgZ < -1.5 ? "bg-blue-500/5 border-blue-500/20" : "bg-emerald-500/5 border-emerald-500/20"
                    )}>
                        <div className={cn("p-2 rounded-xl bg-white/5", regimeColor)}>
                            {React.createElement(regimeIcon, { className: "w-5 h-5" })}
                        </div>
                        <div className="space-y-1">
                            <div className={cn("text-xs font-semibold uppercase tracking-wider", regimeColor)}>
                                {regimeTitle}
                            </div>
                            <p className="text-xs leading-tight text-muted-foreground font-medium italic">
                                {regimeDesc}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Chart Area */}
                <div className="h-[480px] w-full relative">
                    <div className="absolute inset-0 bg-white/[0.01] rounded-xl -m-4 border border-white/[0.02]" />

                    {!chartData || chartData.length === 0 ? (
                        <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 rounded-full bg-white/5 border border-border">
                                <AlertTriangle className="w-8 h-8 text-amber-500/20" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-terminal-dim uppercase tracking-wider">Ribbon visualization temporarily unavailable</p>
                                <p className="text-xs text-terminal-dim italic mt-1">Fetching historical correlation matrix...</p>
                            </div>
                        </div>
                    ) : (
                        <MacroChartContainer height="fill">
                            <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    {series.map(s => (
                                        <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} vertical={false} />

                                {/* Regime Shading - Institutional Zones */}
                                <ReferenceArea y1={2} y2={4} fill={alpha(CHART_COLORS.east, 0.05)} /> {/* Extreme High */}
                                <ReferenceArea y1={1.2} y2={2} fill={alpha(CHART_COLORS.gold, 0.03)} /> {/* Warning High */}
                                <ReferenceArea y1={-1.2} y2={1.2} fill={alpha(CHART_COLORS.expansion, 0.02)} /> {/* Equilibrium */}
                                <ReferenceArea y1={-2} y2={-1.2} fill={alpha(CHART_COLORS.gold, 0.03)} /> {/* Warning Low */}
                                <ReferenceArea y1={-4} y2={-2} fill={alpha(CHART_COLORS.east, 0.05)} /> {/* Extreme Low */}

                                {/* Center Pivot */}
                                <ReferenceArea y1={-0.05} y2={0.05} fill="#fff" fillOpacity={0.1} />

                                <XAxis
                                    {...DEFAULT_XAXIS_PROPS}
                                    dataKey="date"
                                    stroke={WHITE_ALPHA.line}
                                    fontSize={11}
                                    tickFormatter={(v) => {
                                        try {
                                            return new Date(v).toLocaleDateString(undefined, { year: '2-digit', month: 'short' });
                                        } catch {
                                            return v;
                                        }
                                    }}
                                    tick={{ fill: WHITE_ALPHA.soft, fontWeight: 700 }}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    {...DEFAULT_YAXIS_PROPS}
                                    width={60}
                                    stroke={WHITE_ALPHA.line}
                                    fontSize={11}
                                    domain={[-3.5, 3.5]}
                                    tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}σ`}
                                    tick={{ fill: WHITE_ALPHA.soft, fontWeight: 700 }}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="top"
                                    align="left"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{
                                        paddingBottom: '40px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.2em',
                                        opacity: 0.6
                                    }}
                                />

                                {series.map(s => (
                                    <Area
                                        key={s.key}
                                        type="monotone"
                                        dataKey={s.key}
                                        name={s.label}
                                        stroke={s.color}
                                        fill={`url(#grad-${s.key})`}
                                        strokeWidth={s.key === 'M2/Gold' ? 4 : 2}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
                                        animationDuration={2000}
                                        connectNulls={true}
                                    />
                                ))}
                            </AreaChart>
                        </MacroChartContainer>
                    )}
                </div>

                {/* Individual Metric Cards Grid - Simplified */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-border">
                    {ratios?.filter(r => series.some(s => s.key === r.ratio_name)).map(ratio => {
                        const sConfig = series.find(s => s.key === ratio.ratio_name);
                        const isExtreme = Math.abs(ratio.z_score) > 2.0;
                        const lastUpdate = new Date(ratio.last_updated);
                        const daysStale = Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
                        const isRatioStale = daysStale > 3;

                        return (
                            <div key={ratio.ratio_name} className="group/metric relative p-4 rounded-xl bg-white/[0.01] border border-border hover:bg-white/[0.03] transition-all duration-300">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sConfig?.color }} />
                                        <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">
                                            {ratio.ratio_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isRatioStale && (
                                            <div className={cn(
                                                "text-[11px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                                                daysStale > 30
                                                    ? "bg-red-500/20 text-red-400"
                                                    : "bg-amber-500/20 text-amber-400"
                                            )}>
                                                {daysStale}d old
                                            </div>
                                        )}
                                        {isExtreme && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                                    </div>
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <div className="text-xl font-bold text-white/90 tabular-nums tracking-heading">
                                        {ratio.current_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                    <div className={cn(
                                        "text-xs font-bold tabular-nums tracking-heading",
                                        isExtreme ? "text-rose-500" : Math.abs(ratio.z_score) > 1.2 ? "text-amber-500" : "text-emerald-500"
                                    )}>
                                        {ratio.z_score != null ? (ratio.z_score > 0 ? '+' : '') + ratio.z_score.toFixed(2) + 'σ' : '--'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
};

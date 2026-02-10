import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Coins, Activity, Landmark, Globe } from 'lucide-react';
import { useBricsTracker, BricsMetric } from '@/hooks/useBricsTracker';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { SectionHeader } from '@/components/SectionHeader';
import { cn } from '@/lib/utils';

export const BRICSTrackerSection: React.FC = () => {
    const { data, isLoading } = useBricsTracker();

    const metrics = data?.metrics || [];
    const countryReserves = data?.countryReserves || [];
    const history = data?.history || {};

    const findMetric = (id: string) => metrics.find(m => m.metric_id === id);

    const usdShare = findMetric('BRICS_USD_RESERVE_SHARE_PCT');
    const goldHoldings = findMetric('BRICS_GOLD_HOLDINGS_TONNES');
    const debtGdp = findMetric('BRICS_DEBT_GDP_PCT');
    const inflation = findMetric('BRICS_INFLATION_YOY');

    if (isLoading) {
        return (
            <div className="mb-6">
                <SectionHeader title="BRICS+ Tracker" subtitle="Multipolar economic shift monitoring" />
                <Card className="p-6 h-[400px] flex flex-col gap-4 bg-card/40 backdrop-blur-md border border-white/10">
                    <div className="grid grid-cols-4 gap-4 h-32">
                        <Skeleton className="h-full rounded-xl" />
                        <Skeleton className="h-full rounded-xl" />
                        <Skeleton className="h-full rounded-xl" />
                        <Skeleton className="h-full rounded-xl" />
                    </div>
                    <Skeleton className="h-full rounded-xl mt-4" />
                </Card>
            </div>
        );
    }

    const StatCard = ({
        title,
        metric,
        metricId,
        icon: Icon,
        color,
        suffix = '',
        revertTrend = false
    }: {
        title: string,
        metric?: BricsMetric,
        metricId: string,
        icon: any,
        color: string,
        suffix?: string,
        revertTrend?: boolean
    }) => {
        const histData = history[metricId] || [];
        const delta = metric?.delta_qoq || metric?.delta_yoy_pct || 0;
        const isPositive = delta > 0;
        const isGood = revertTrend ? !isPositive : isPositive; // e.g. Debt/Inflation up is bad

        return (
            <div className="relative overflow-hidden bg-black/20 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all group">
                <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-md bg-white/5", `text-${color}-400`)}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
                    </div>
                    <span className={cn("text-[0.65rem] font-bold px-1.5 py-0.5 rounded bg-white/5", isGood ? "text-emerald-400" : "text-rose-400")}>
                        {isPositive ? '+' : ''}{delta.toFixed(1)}% {metric?.delta_qoq ? 'QoQ' : 'YoY'}
                    </span>
                </div>

                <div className="relative z-10">
                    <div className="text-xl font-black text-white tracking-tight">
                        {metric?.value?.toLocaleString(undefined, { maximumFractionDigits: 1 })}{suffix}
                    </div>
                </div>

                {/* Mini Sparkline */}
                <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 group-hover:opacity-50 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={histData}>
                            <defs>
                                <linearGradient id={`grad-${metricId}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isGood ? '#10b981' : '#f43f5e'} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={isGood ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isGood ? '#10b981' : '#f43f5e'}
                                fill={`url(#grad-${metricId})`}
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    // Prepare chart data for Gold Horizontal Bar
    const chartData = countryReserves
        .filter(c => c.gold_tonnes > 0)
        .slice(0, 5) // Top 5
        .map(c => ({
            name: c.country_name,
            code: c.country_code,
            value: c.gold_tonnes,
            change: c.gold_yoy_pct_change,
            flag: {
                CN: '🇨🇳', IN: '🇮🇳', RU: '🇷🇺', BR: '🇧🇷', ZA: '🇿🇦',
                SA: '🇸🇦', AE: '🇦🇪', IR: '🇮🇷', EG: '🇪🇬', ET: '🇪🇹'
            }[c.country_code] || '🏳️'
        }));

    return (
        <div className="mb-8">
            <SectionHeader
                title="BRICS+ Tracker"
                subtitle="Multipolar economic shift monitoring: Reserves, Gold, Debt, and Inflation aggregates"
            />

            <Card className="p-6 bg-[#0a1929]/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl space-y-6">
                {/* 1. KPIs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="USD Share"
                        metric={usdShare}
                        metricId="BRICS_USD_RESERVE_SHARE_PCT"
                        icon={DollarSign}
                        color="blue"
                        suffix="%"
                        revertTrend={true} // Lower USD share is "good" for BRICS goals
                    />
                    <StatCard
                        title="Gold Holdings"
                        metric={goldHoldings}
                        metricId="BRICS_GOLD_HOLDINGS_TONNES"
                        icon={Coins}
                        color="amber"
                        suffix="t"
                    />
                    <StatCard
                        title="Debt/GDP"
                        metric={debtGdp}
                        metricId="BRICS_DEBT_GDP_PCT"
                        icon={Landmark}
                        color="rose"
                        suffix="%"
                        revertTrend={true}
                    />
                    <StatCard
                        title="Inflation"
                        metric={inflation}
                        metricId="BRICS_INFLATION_YOY"
                        icon={Activity}
                        color="purple"
                        suffix="%"
                        revertTrend={true}
                    />
                </div>

                {/* 2. Gold Accumulation Leaderboard */}
                <div className="bg-black/20 rounded-xl p-6 border border-white/5">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h3 className="font-serif text-lg text-white flex items-center gap-2">
                                <Globe className="w-4 h-4 text-amber-500" />
                                Strategic Gold Accumulation
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Top BRICS+ nations by official gold reserves (Tonnes)
                            </p>
                        </div>
                    </div>

                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={({ x, y, payload }) => {
                                        const country = chartData.find(c => c.name === payload.value);
                                        return (
                                            <g transform={`translate(${x},${y})`}>
                                                <text x={-10} y={4} textAnchor="end" fill="#94a3b8" fontSize={11} fontWeight={600}>
                                                    {country?.flag} {payload.value}
                                                </text>
                                            </g>
                                        );
                                    }}
                                    width={100}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-slate-950 border border-white/10 p-3 rounded-lg shadow-xl">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-lg">{data.flag}</span>
                                                        <span className="font-bold text-white">{data.name}</span>
                                                    </div>
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-muted-foreground">Holdings:</span>
                                                            <span className="font-mono font-bold text-amber-400">{data.value.toLocaleString()}t</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-muted-foreground">YoY Change:</span>
                                                            <span className={cn("font-mono font-bold", data.change > 0 ? "text-emerald-400" : "text-rose-400")}>
                                                                {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill="url(#goldGradient)" />
                                    ))}
                                </Bar>
                                <defs>
                                    <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#b45309" />
                                        <stop offset="100%" stopColor="#fbbf24" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Card>
        </div>
    );
};

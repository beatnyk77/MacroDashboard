import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    DollarSign,
    Coins,
    Globe,
    Landmark,
    Compass
} from 'lucide-react';
import { useDeDollarization, useDeDollarizationHistory } from '@/hooks/useDeDollarization';
import { useBricsTracker } from '@/hooks/useBricsTracker';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { ReserveShareHistoryChart } from '../charts/ReserveShareHistoryChart';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trackClick } from '@/lib/analytics';

interface UnifiedMetricCardProps {
    title: string;
    value: number;
    suffix?: string;
    delta?: number;
    deltaType?: 'qoq' | 'yoy';
    history: any[];
    color: string;
    icon: any;
    isInverse?: boolean;
}

const UnifiedMetricCard: React.FC<UnifiedMetricCardProps> = ({
    title,
    value,
    suffix = '%',
    delta,
    deltaType = 'qoq',
    history,
    color,
    icon: Icon,
    isInverse = false
}) => {
    const isPositive = (delta || 0) > 0;
    const isGood = isInverse ? !isPositive : isPositive;
    const trendColor = isGood ? 'text-emerald-400' : 'text-rose-400';
    const gradId = `grad-${title.replace(/\s+/g, '')}`;

    return (
        <div className="group relative bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 rounded-3xl p-6 border border-white/5 overflow-hidden flex flex-col justify-between h-full">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-2.5 rounded-2xl bg-white/5 shadow-inner transition-transform group-hover:scale-110", `text-${color}-400`)}>
                        <Icon className="w-5 h-5" />
                    </div>
                    {delta !== undefined && (
                        <div className={cn("flex items-center text-[0.65rem] font-black px-2 py-1 rounded-xl bg-white/5 border border-white/10 tabular-nums", trendColor)}>
                            {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                            {Math.abs(delta).toFixed(2)}{suffix === '%' ? 'pp' : suffix} {deltaType.toUpperCase()}
                        </div>
                    )}
                </div>

                <h3 className="text-[0.7rem] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-1">
                    {title}
                </h3>
                <div className="text-3xl font-black text-white/90 tracking-tighter tabular-nums">
                    {value?.toLocaleString(undefined, { maximumFractionDigits: 1 })}{suffix}
                </div>
            </div>

            {/* Sparkline */}
            <div className="h-[80px] w-full mt-4 -mx-2 opacity-50 group-hover:opacity-100 transition-opacity duration-700">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                        <defs>
                            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color === 'amber' ? '#fbbf24' : color === 'blue' ? '#3b82f6' : color === 'rose' ? '#ef4444' : '#8b5cf6'} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color === 'amber' ? '#fbbf24' : color === 'blue' ? '#3b82f6' : color === 'rose' ? '#ef4444' : '#8b5cf6'} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color === 'amber' ? '#fbbf24' : color === 'blue' ? '#3b82f6' : color === 'rose' ? '#ef4444' : '#8b5cf6'}
                            fill={`url(#${gradId})`}
                            strokeWidth={3}
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const GlobalReserveTracker: React.FC = () => {
    const { data: deDolMetrics } = useDeDollarization();
    const { data: usdHistory } = useDeDollarizationHistory('GLOBAL_USD_SHARE_PCT');
    const { data: goldHistory } = useDeDollarizationHistory('GLOBAL_GOLD_SHARE_PCT');

    const { data: bricsData, isLoading: isLoadingBrics } = useBricsTracker();

    const isLoading = !deDolMetrics || isLoadingBrics;

    if (isLoading) {
        return <Skeleton className="h-[600px] w-full rounded-[2.5rem] bg-white/5" />;
    }

    const usdShare = deDolMetrics?.usdShare;
    const goldShare = deDolMetrics?.goldShare;

    const bricsMetrics = bricsData?.metrics || [];
    const bricsHistory = bricsData?.history || {};
    const countryReserves = bricsData?.countryReserves || [];

    const findBricsMetric = (id: string) => bricsMetrics.find(m => m.metric_id === id);

    const bricsUsdShare = findBricsMetric('BRICS_USD_RESERVE_SHARE_PCT');
    const bricsGoldHoldings = findBricsMetric('BRICS_GOLD_HOLDINGS_TONNES');
    const bricsDebt = findBricsMetric('BRICS_DEBT_GDP_PCT');

    const chartData = countryReserves
        .filter(c => c.gold_tonnes > 0)
        .slice(0, 5)
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
        <Card className="p-8 bg-black/40 backdrop-blur-3xl border-white/5 shadow-2xl relative overflow-hidden rounded-[2.5rem]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <Compass className="text-rose-500 w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                            Global <span className="text-rose-500">Reserve</span> Tracker
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
                        Monitoring the structural rotation of global reserves. We track the migration from <span className="text-white font-bold">USD Hegemony</span> toward <span className="text-white font-bold">Multipolar Hard Assets</span>.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="dedollarization" className="space-y-8">
                <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl h-auto flex flex-wrap gap-1 w-fit">
                    <TabsTrigger
                        value="dedollarization"
                        onClick={() => trackClick('reserve_tab_dedollarization', 'global_reserve_tracker')}
                        className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white text-muted-foreground font-black text-[0.65rem] uppercase tracking-widest transition-all"
                    >
                        De-Dollarization Pulse
                    </TabsTrigger>
                    <TabsTrigger
                        value="brics"
                        onClick={() => trackClick('reserve_tab_brics', 'global_reserve_tracker')}
                        className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white text-muted-foreground font-black text-[0.65rem] uppercase tracking-widest transition-all"
                    >
                        BRICS+ Momentum
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dedollarization" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ReserveShareHistoryChart
                            title="Global USD Reserve Share"
                            data={usdHistory || []}
                            currentValue={usdShare?.value ?? 57.7}
                            color="blue"
                            isDeclining={true}
                            description="Visualizing the secular erosion of USD hegemony as central banks rotate toward multi-polar alternatives."
                        />
                        <ReserveShareHistoryChart
                            title="Global Gold Reserve Share"
                            data={goldHistory || []}
                            currentValue={goldShare?.value ?? 15.4}
                            color="amber"
                            description="Physical gold returns as the ultimate neutral reserve asset, with allocation expanding at an accelerating pace."
                        />
                    </div>

                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                        <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                            <AlertTriangle className="text-amber-500 w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Structural Signal</h4>
                            <p className="text-[0.65rem] text-muted-foreground leading-relaxed italic">
                                Central banks are currently in a <span className="text-amber-400 font-bold">rotation phase</span>. While USD remains the primary denominator, the persistent accumulation of physical gold by non-Western powers indicates a "shadow" hedging regime against future fiat volatility.
                            </p>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="brics" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <UnifiedMetricCard
                            title="BRICS USD Reserve Share"
                            value={bricsUsdShare?.value ?? 0}
                            delta={bricsUsdShare?.delta_qoq ?? 0}
                            history={bricsHistory['BRICS_USD_RESERVE_SHARE_PCT'] || []}
                            color="blue"
                            icon={DollarSign}
                            isInverse={true}
                        />
                        <UnifiedMetricCard
                            title="BRICS Gold Holdings"
                            value={bricsGoldHoldings?.value ?? 0}
                            suffix="t"
                            delta={bricsGoldHoldings?.delta_qoq ?? 0}
                            history={bricsHistory['BRICS_GOLD_HOLDINGS_TONNES'] || []}
                            color="amber"
                            icon={Coins}
                        />
                        <UnifiedMetricCard
                            title="BRICS Avg Debt/GDP"
                            value={bricsDebt?.value ?? 0}
                            delta={bricsDebt?.delta_qoq ?? 0}
                            history={bricsHistory['BRICS_DEBT_GDP_PCT'] || []}
                            color="rose"
                            icon={Landmark}
                            isInverse={true}
                        />
                    </div>

                    {/* Gold Leaderboard */}
                    <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/10">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-emerald-500" />
                                    Strategic Accumulation Leaderboard
                                </h3>
                                <p className="text-[0.65rem] text-muted-foreground/60 mt-1 uppercase tracking-tight">
                                    Top 5 BRICS+ Nations by Official Gold Reserves (Tonnes)
                                </p>
                            </div>
                        </div>

                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={({ x, y, payload }) => {
                                            const country = chartData.find(c => c.name === payload.value);
                                            return (
                                                <g transform={`translate(${x},${y})`}>
                                                    <text x={-15} y={4} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize={9} fontWeight={900}>
                                                        {country?.flag} {payload.value}
                                                    </text>
                                                </g>
                                            );
                                        }}
                                        width={120}
                                    />
                                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                                        {chartData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill="url(#goldGradient)" />
                                        ))}
                                    </Bar>
                                    <defs>
                                        <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#b45309" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#fbbf24" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Macro Interpretation Bullets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                        {[
                            { label: 'Reserve Diversification', content: 'Aggressive rotation into hard assets by Eastern central banks.', color: 'emerald' },
                            { label: 'USD Liquidity Risk', content: 'Declining petrodollar reliance creates structural liquidity gaps.', color: 'rose' },
                            { label: 'BOP Pressure', content: 'Friction in trade settlement favoring local currency pairs.', color: 'blue' },
                            { label: 'Gold Normalization', content: 'Gold returning to its role as the primary neutral reserve asset.', color: 'amber' }
                        ].map((bullet, idx) => (
                            <div key={idx} className="flex gap-3 group/bullet">
                                <div className={cn("w-1 h-8 rounded-full opacity-20 group-hover/bullet:opacity-100 transition-opacity", `bg-${bullet.color}-500`)} />
                                <div className="space-y-0.5">
                                    <div className="text-[0.6rem] font-black uppercase tracking-widest text-white/40">{bullet.label}</div>
                                    <p className="text-[0.65rem] text-muted-foreground leading-snug">{bullet.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </Card>
    );
};

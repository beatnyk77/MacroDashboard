import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useMetricHistory } from '@/hooks/useMetricHistory';
import { SectionHeader } from '@/components/SectionHeader';
import { ChartSkeleton } from '@/components/ui/skeleton';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { m } from 'framer-motion';
import {
    DEFAULT_CARTESIAN_GRID_PROPS,
    DEFAULT_XAXIS_PROPS,
    DEFAULT_YAXIS_PROPS,
    DEFAULT_TOOLTIP_STYLE,
    CHART_HEIGHTS
} from '@/constants/chartDefaults';

const parseDateSafe = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(dateStr);
};

const formatValueUSD = (val: number) => {
    if (val === 0) return '$0mn';
    const sign = val > 0 ? '+' : '-';
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0
    }).format(absVal);
    return `${sign}$${formatted}mn`;
};

const formatYtd = (val: number) => {
    const sign = val >= 0 ? '+' : '-';
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0
    }).format(absVal);
    return `YTD: ${sign}$${formatted}mn`;
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        const formattedDate = parseDateSafe(item.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const val = Number(item.value);
        return (
            <div style={DEFAULT_TOOLTIP_STYLE} className="shadow-2xl">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-uppercase mb-2 pb-1 border-b border-white/5">
                    {formattedDate}
                </div>
                <div className="flex justify-between items-center gap-6">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Net Flow</span>
                    <span className={cn("font-black font-mono text-xs", val >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {formatValueUSD(val)}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export const IndiaFIIFlowsMonitor: React.FC = () => {
    const { data: latest, isLoading: latestLoading } = useLatestMetric('india_fii_equity_net_usd_mn');
    const { data: history, isLoading: historyLoading } = useMetricHistory('india_fii_equity_net_usd_mn', 12);

    const isLoading = latestLoading || historyLoading;

    // Combine history and latest to ensure latest is present and chronological
    const chartData = useMemo(() => {
        if (!history || history.length === 0) return [];
        const combined = [...history];

        if (latest && latest.value !== undefined && latest.lastUpdated) {
            const hasLatest = history.some(h => h.date === latest.lastUpdated);
            if (!hasLatest) {
                combined.push({
                    date: latest.lastUpdated,
                    value: latest.value
                });
            }
        }

        // Sort chronologically
        combined.sort((a, b) => a.date.localeCompare(b.date));

        // Keep last 12 points
        const sliced = combined.slice(-12);

        return sliced.map(d => ({
            ...d,
            formattedMonth: parseDateSafe(d.date).toLocaleDateString('en-US', { month: 'short' })
        }));
    }, [history, latest]);

    // Calculate YTD Net
    const ytdSum = useMemo(() => {
        if (chartData.length === 0) return 0;
        const currentYear = new Date().getFullYear();
        const ytdPoints = chartData.filter(d => {
            const ptYear = parseDateSafe(d.date).getFullYear();
            return ptYear === currentYear;
        });
        return ytdPoints.reduce((acc, curr) => acc + curr.value, 0);
    }, [chartData]);

    // Calculate 3M Average Trend
    const avg3m = useMemo(() => {
        if (chartData.length === 0) return 0;
        const last3 = chartData.slice(-3);
        if (last3.length === 0) return 0;
        return last3.reduce((acc, curr) => acc + curr.value, 0) / last3.length;
    }, [chartData]);

    const latestVal = latest?.value ?? (chartData.length > 0 ? chartData[chartData.length - 1].value : null);

    const hasData = chartData.length > 0;

    if (isLoading) {
        return (
            <div className="h-[400px] w-full bg-white/[0.02] animate-pulse rounded-[2.5rem] flex items-center justify-center border border-white/5">
                <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-widest font-mono">
                    Analyzing FII flows...
                </span>
            </div>
        );
    }

    return (
        <section id="fii-flows" className="py-12 scroll-mt-24">
            <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="max-w-7xl mx-auto"
            >
                {/* Section Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                    <SectionHeader
                        title="FII Equity Net Flow Monitor"
                        subtitle="Monthly Foreign Institutional Investor (FII) net equity inflows & outflows"
                    />
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-3xl rounded-full translate-x-24 -translate-y-24 pointer-events-none" />

                    {!hasData ? (
                        // PLACEHOLDER STATE
                        <div className="space-y-8">
                            <div className="p-6 rounded-[1.5rem] bg-blue-500/[0.03] border border-blue-500/10 flex items-start gap-4">
                                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-200 font-bold uppercase tracking-wider">
                                        FII flow data pending ingestion
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 leading-relaxed font-semibold">
                                        Source: SEBI/NSDL monthly release. Available T+15 days after month end.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-uppercase mb-4">Historical Net Flow (12M Chart Scaffold)</p>
                                <ChartSkeleton height={CHART_HEIGHTS.standard} />
                            </div>
                        </div>
                    ) : (
                        // DATA STATE
                        <div className="space-y-8">
                            {/* Summary row */}
                            <div className="flex flex-wrap items-center gap-4">
                                {/* YTD Net */}
                                <div className={cn(
                                    "px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 font-black text-xs font-mono uppercase tracking-wider",
                                    ytdSum >= 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {formatYtd(ytdSum)}
                                </div>

                                {/* 3M Trend */}
                                <div className={cn(
                                    "px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 font-black text-xs font-mono uppercase tracking-wider",
                                    Math.abs(avg3m) < 1.0 ? "text-slate-400" : avg3m > 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    3M Trend: {Math.abs(avg3m) < 1.0 ? "Neutral" : avg3m > 0 ? "Net Buying" : "Net Selling"}
                                </div>

                                {/* Current Month */}
                                {latestVal !== null && (
                                    <div className={cn(
                                        "px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 font-black text-xs font-mono uppercase tracking-wider flex items-center gap-1",
                                        latestVal >= 0 ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        Current: {formatValueUSD(latestVal)} {latestVal >= 0 ? '↑' : '↓'}
                                    </div>
                                )}
                            </div>

                            {/* Chart */}
                            <div className="h-[240px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                                        <XAxis
                                            dataKey="formattedMonth"
                                            {...DEFAULT_XAXIS_PROPS}
                                        />
                                        <YAxis
                                            {...DEFAULT_YAXIS_PROPS}
                                            tickFormatter={(val) => `${val >= 0 ? '+' : ''}${val}`}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                                        <Bar
                                            dataKey="value"
                                            radius={[4, 4, 0, 0]}
                                        >
                                            {chartData.map((entry, index) => {
                                                const fill = entry.value >= 0 ? '#10b981' : '#f43f5e';
                                                return (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={fill}
                                                        fillOpacity={0.7}
                                                    />
                                                );
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </m.div>
        </section>
    );
};

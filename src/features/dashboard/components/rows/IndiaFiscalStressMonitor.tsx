import React, { useState } from 'react';
import { useIndiaFiscalStress } from '@/hooks/useIndiaFiscalStress';
import { SPASection } from '@/components/spa/SPASection';
import { SectionHeader } from '@/components/SectionHeader';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Area
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { m } from 'framer-motion';
import { DataStatePanel } from '@/components/DataStatePanel';
import { TOOLTIP_SHELL_CLASS } from '@/components/charts/chartTooltipFormat';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

export const IndiaFiscalStressMonitor: React.FC = () => {
    const { data, isLoading, isError, refetch } = useIndiaFiscalStress();
    const [timeRange, setTimeRange] = useState<'5Y' | 'ALL'>('ALL');

    const latest = data?.[data.length - 1];

    // Filter data based on time range
    const filteredData = React.useMemo(() => {
        if (!data) return [];
        if (timeRange === '5Y') {
            const fiveYearsAgo = new Date();
            fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
            return data.filter(d => new Date(d.date) >= fiveYearsAgo);
        }
        return data;
    }, [data, timeRange]);

    const interestRevenuePercent = latest?.interest_revenue_pct != null ? latest.interest_revenue_pct.toFixed(1) : null;
    const isCrisisZone = latest?.interest_revenue_pct ? latest.interest_revenue_pct >= 35 : false;

    if (isLoading) {
        return (
            <div className="h-[600px] w-full bg-white/[0.02] animate-pulse rounded-xl flex items-center justify-center">
                <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">Analyzing India Fiscal Stress...</span>
            </div>
        );
    }

    if (isError) {
        return <DataStatePanel variant="error" title="India fiscal data unavailable" description="The fiscal stress source did not return a usable response." onRetry={() => refetch()} height={300} />;
    }

    if (!latest || filteredData.length === 0) {
        return <DataStatePanel variant="empty" title="India fiscal data unavailable" description="No published fiscal-stress observation is available for this module." height={300} />;
    }

    return (
        <SPASection id="india-fiscal-stress-monitor" className="py-24" disableAnimation>
            <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                    <SectionHeader
                        title="India Fiscal Stress Monitor"
                        subtitle="Tracking India central government fiscal vulnerability and debt sustainability"
                    />

                    <div className="flex flex-wrap gap-4">
                        <StatusChip
                            label="Interest Burden"
                            status={isCrisisZone ? 'CRITICAL' : 'ELEVATED'}
                            color={isCrisisZone ? 'rose' : 'amber'}
                        />
                        <StatusChip
                            label="Debt Sustainability"
                            status={latest?.debt_gdp_pct && latest.debt_gdp_pct > 80 ? 'WATCH' : 'STABLE'}
                            color={latest?.debt_gdp_pct && latest.debt_gdp_pct > 80 ? 'amber' : 'emerald'}
                        />
                    </div>
                </div>

                <div className="space-y-12">
                    {/* Narrative Insight */}
                    <div className="p-8 rounded-xl bg-blue-500/[0.03] border border-blue-500/10 max-w-6xl mx-auto">
                        <p className="text-lg text-muted-foreground/80 leading-relaxed font-medium">
                            <span className="text-blue-400 font-semibold uppercase mr-3 tracking-wider text-xs">Fiscal Thesis:</span>
                            India's interest-to-revenue ratio is shown from the latest published fiscal-stress observation. The current ratio is {interestRevenuePercent}%, with source date and methodology carried by the module.
                        </p>
                    </div>

                    {/* Main Chart Section - Full Width */}
                    <div className="bg-white/[0.02] border border-border rounded-xl p-10 relative overflow-hidden group max-w-7xl mx-auto shadow-2xl">
                        <div className="absolute top-10 left-10 z-10">
                            <h3 className="text-sm font-semibold text-terminal-dim uppercase tracking-wider">Interest Payments % of Revenue Receipts</h3>
                            <p className="text-xs text-muted-foreground mt-2 font-medium">Union Government Fiscal Sustainability Gauge</p>
                        </div>

                        <div className="absolute top-10 right-10 z-10 flex items-center gap-6">
                            <div className="flex gap-2 bg-background/40 p-1.5 rounded-xl border border-border">
                                <button
                                    onClick={() => setTimeRange('5Y')}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
                                        timeRange === '5Y' ? "bg-white/10 text-white shadow-xl" : "text-terminal-dim hover:text-white"
                                    )}
                                >
                                    5Y
                                </button>
                                <button
                                    onClick={() => setTimeRange('ALL')}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
                                        timeRange === 'ALL' ? "bg-white/10 text-white shadow-xl" : "text-terminal-dim hover:text-white"
                                    )}
                                >
                                    ALL
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={cn("text-4xl font-bold tabular-nums tracking-heading", isCrisisZone ? "text-rose-500" : "text-amber-500")}>
                                    {interestRevenuePercent}%
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">Current</span>
                                    <span className="text-xs font-semibold text-rose-500/50 uppercase tracking-heading whitespace-nowrap">Crisis: &gt;35%</span>
                                </div>
                            </div>
                        </div>

                        <MacroChartContainer height={CHART_HEIGHTS.hero} className="mt-24">
                                <ComposedChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="indiaInterestGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.gold} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={CHART_COLORS.gold} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} vertical={false} />
                                    <XAxis
                                        {...DEFAULT_XAXIS_PROPS}
                                        dataKey="date"
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: WHITE_ALPHA.dim, fontWeight: 600 }}
                                        minTickGap={60}
                                        tickFormatter={(str) => {
                                            const date = new Date(str);
                                            return `FY${date.getFullYear().toString().slice(-2)}`;
                                        }}
                                    />
                                    <YAxis
                                        {...DEFAULT_YAXIS_PROPS}
                                        width={60}
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: WHITE_ALPHA.dim, fontWeight: 600 }}
                                        tickFormatter={(val) => `${val.toFixed(0)}%`}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: WHITE_ALPHA.line, strokeWidth: 1 }} />

                                    <ReferenceLine
                                        y={35}
                                        stroke={CHART_COLORS.stress}
                                        strokeDasharray="10 10"
                                        strokeOpacity={0.4}
                                        label={{ value: 'CRITICAL STRESS THRESHOLD', position: 'insideTopRight', fill: CHART_COLORS.stress, fontSize: 11, fontWeight: 700 }}
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="interest_revenue_pct"
                                        stroke="none"
                                        fill="url(#indiaInterestGradient)"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="interest_revenue_pct"
                                        name="Interest/Revenue %"
                                        stroke={isCrisisZone ? CHART_COLORS.stress : CHART_COLORS.gold}
                                        strokeWidth={4}
                                        dot={false}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                    />
                                </ComposedChart>
                        </MacroChartContainer>
                    </div>

                    {/* Supporting Metrics - Horizontal Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                        <MetricCard
                            title="Interest/Expenditure"
                            value={latest?.interest_expenditure_pct != null ? latest.interest_expenditure_pct.toFixed(1) : '--'}
                            unit="%"
                            sub="of Total Spending"
                            icon={<DollarSign className="text-amber-500" size={18} />}
                            description="Share of government expenditure consumed by debt service."
                            trend={latest?.interest_expenditure_pct && latest.interest_expenditure_pct > 23 ? 'up' : 'stable'}
                        />
                        <MetricCard
                            title="Interest/GTR"
                            value={latest?.interest_gtr_pct != null ? latest.interest_gtr_pct.toFixed(1) : '--'}
                            unit="%"
                            sub="of Tax Revenue"
                            icon={<AlertTriangle className="text-rose-500" size={18} />}
                            description="Interest payments as percentage of gross tax revenue."
                            trend={latest?.interest_gtr_pct && latest.interest_gtr_pct > 30 ? 'up' : 'stable'}
                        />
                        <MetricCard
                            title="Fiscal Deficit/GDP"
                            value={latest?.fiscal_deficit_gdp_pct != null ? latest.fiscal_deficit_gdp_pct.toFixed(1) : '--'}
                            unit="%"
                            sub="Budget Gap"
                            icon={<TrendingDown className="text-rose-500" size={18} />}
                            description="Annual fiscal deficit as percentage of GDP."
                            trend={latest?.fiscal_deficit_gdp_pct && latest.fiscal_deficit_gdp_pct > 6 ? 'up' : 'down'}
                        />
                        <MetricCard
                            title="Debt/GDP"
                            value={latest?.debt_gdp_pct != null ? latest.debt_gdp_pct.toFixed(1) : '--'}
                            unit="%"
                            sub="Total Debt"
                            icon={<TrendingUp className="text-amber-500" size={18} />}
                            description="General government debt as percentage of GDP."
                            trend={latest?.debt_gdp_pct && latest.debt_gdp_pct > 80 ? 'up' : 'stable'}
                        />
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.03] border border-border">
                        <Info size={14} className="text-blue-400" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                            Source: Union Budget / PRS India / RBI DBIE – updated monthly
                        </span>
                    </div>
                </div>
            </m.div>
        </SPASection>
    );
};

const StatusChip = ({ label, status, color }: { label: string; status: string; color: 'rose' | 'amber' | 'emerald' }) => (
    <div className="px-5 py-3 rounded-xl bg-white/[0.03] border border-border flex flex-col items-start gap-1">
        <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">{label}</span>
        <span className={cn(
            "text-xs font-semibold uppercase tracking-heading",
            color === 'rose' ? "text-rose-500" : color === 'amber' ? "text-amber-500" : "text-emerald-500"
        )}>{status}</span>
    </div>
);

const MetricCard = ({ title, value, unit, sub, icon, description, trend }: {
    title: string;
    value: string;
    unit: string;
    sub: string;
    icon: React.ReactNode;
    description: string;
    trend: 'up' | 'down' | 'stable';
}) => (
    <div className="p-6 rounded-xl bg-white/[0.02] border border-border flex flex-col justify-between hover:bg-white/[0.04] transition-all group">
        <div className="flex items-start justify-between mb-4">
            <div className="p-2 rounded-xl bg-white/[0.03] group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className="text-right">
                <div className="text-xs font-semibold text-terminal-dim uppercase tracking-wider mb-1">{title}</div>
                <div className="flex items-baseline justify-end gap-1">
                    <span className="text-3xl font-bold text-white/90 tabular-nums">{value}</span>
                    <span className="text-xs font-bold text-terminal-dim">{unit}</span>
                </div>
            </div>
        </div>
        <div>
            <div className="text-xs font-bold text-muted-foreground leading-relaxed mb-4">{description}</div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/20">{sub}</span>
                <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full uppercase",
                    trend === 'up' ? "bg-rose-500/10 text-rose-500" : trend === 'down' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                )}>{trend}</span>
            </div>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const date = new Date(label);
        const fy = `FY ${date.getFullYear()}`;

        return (
            <div className={TOOLTIP_SHELL_CLASS}>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-border pb-2">
                    {fy} Fiscal Snapshot
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-12">
                        <span className="text-xs font-bold text-slate-400">Interest/Revenue</span>
                        <span className={cn("text-xs font-semibold tabular-nums", data.interest_revenue_pct >= 35 ? "text-rose-500" : "text-amber-500")}>
                            {data.interest_revenue_pct?.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-12">
                        <span className="text-xs font-bold text-slate-400">Fiscal Deficit/GDP</span>
                        <span className="text-xs font-semibold font-mono tabular-nums text-rose-500">
                            {data.fiscal_deficit_gdp_pct?.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-12">
                        <span className="text-xs font-bold text-slate-400">Debt/GDP</span>
                        <span className="text-xs font-semibold font-mono tabular-nums text-amber-500">
                            {data.debt_gdp_pct?.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

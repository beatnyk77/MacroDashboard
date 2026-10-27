import React, { useMemo, useState } from 'react';
import { useCurrencyWars, CurrencyWarsData } from '@/hooks/useCurrencyWars';
import { SPASection } from '@/components/spa/SPASection';
import { SectionHeader } from '@/components/SectionHeader';


import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';
import { AlertCircle, Zap, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TerminalChartTooltip, type TerminalChartTooltipProps } from '@/components/charts/TerminalChartTooltip';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

const EVENTS = [
    { date: '2008-09-01', label: 'GFC / QE1' },
    { date: '2013-05-01', label: 'Taper Tantrum' },
    { date: '2022-03-01', label: 'Fed Hike Cycle' },
    { date: '2024-09-18', label: 'Fed Pivot' }
];

export const CurrencyWarsMonitor: React.FC = () => {
    const { data, isLoading } = useCurrencyWars();
    const [zoom, setZoom] = useState<'5Y' | '25Y'>('25Y');

    const filteredData = useMemo(() => {
        if (!data) return [] as CurrencyWarsData[];
        if (zoom === '25Y') return data;
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        return data.filter(d => new Date(d.date) >= fiveYearsAgo);
    }, [data, zoom]);

    const latest = data?.[data.length - 1];

    if (isLoading) {
        return (
            <div className="h-[500px] w-full bg-white/[0.02] animate-pulse rounded-xl flex items-center justify-center">
                <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">Mapping Divergence...</span>
            </div>
        );
    }

    return (
        <SPASection id="currency-wars-monitor" className="py-24" disableAnimation>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                <SectionHeader
                    title="Currency Wars Monitor"
                    subtitle="Tracking the policy divergence and rupee pressure in the 'Higher for Longer' era"
                />

                <div className="flex flex-wrap gap-4">
                    {/* Primary Metrics */}
                    <MetricMiniCard
                        label="Policy Divergence"
                        value={`${latest?.divergence?.toFixed(0) || 0} bps`}
                        sub="Fed - RBI"
                        icon={<Zap size={14} className="text-blue-400" />}
                    />
                    <MetricMiniCard
                        label="USD/INR Spot"
                        value={`₹${latest?.usd_inr?.toFixed(2) || 0}`}
                        sub="Real-time FRED"
                        icon={<ArrowRightLeft size={14} className="text-emerald-400" />}
                    />
                    <MetricMiniCard
                        label="Pressure Score"
                        value={(latest?.composite_pressure ?? latest?.pressure ?? 0).toFixed(1)}
                        sub="Composite Index"
                        icon={<AlertCircle size={14} className="text-rose-400" />}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Chart Section */}
                <div className="lg:col-span-3 bg-white/[0.02] border border-border rounded-xl p-8 relative group">
                    <div className="absolute top-8 right-8 z-10 flex gap-2">
                        <ZoomButton active={zoom === '5Y'} onClick={() => setZoom('5Y')} label="5Y" />
                        <ZoomButton active={zoom === '25Y'} onClick={() => setZoom('25Y')} label="25Y" />
                    </div>

                    <div className="space-y-12">
                        {/* Chart 1: Policy Rates & Spot */}
                        <MacroChartContainer height={CHART_HEIGHTS.tall}>
                                <ComposedChart data={filteredData} margin={{ top: 20, right: 60, left: 40, bottom: 0 }}>
                                    <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        hide
                                    />
                                    <YAxis
                                        {...DEFAULT_YAXIS_PROPS}
                                        width={60}
                                        yAxisId="left"
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: WHITE_ALPHA.dim }}
                                        unit="%"
                                        label={{ value: 'RATES', angle: -90, position: 'insideLeft', fill: WHITE_ALPHA.soft, fontSize: 11, offset: -20, fontWeight: 700 }}
                                    />
                                    <YAxis
                                        {...DEFAULT_YAXIS_PROPS}
                                        width={60}
                                        yAxisId="right"
                                        orientation="right"
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: WHITE_ALPHA.dim }}
                                        domain={['auto', 'auto']}
                                        label={{ value: 'USD/INR', angle: 90, position: 'insideRight', fill: WHITE_ALPHA.soft, fontSize: 11, offset: -20, fontWeight: 700 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="top"
                                        align="left"
                                        iconType="circle"
                                        wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                    />

                                    <Line yAxisId="left" type="monotone" dataKey="fed_rate" name="Fed Funds" stroke={CHART_COLORS.west} strokeWidth={2} dot={false} />
                                    <Line yAxisId="left" type="monotone" dataKey="rbi_rate" name="RBI Repo" stroke={CHART_COLORS.gold} strokeWidth={2} dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="usd_inr" name="USD/INR" stroke={CHART_COLORS.white} strokeWidth={2} dot={false} />
                                </ComposedChart>
                        </MacroChartContainer>

                        {/* Chart 2: Pressure & Relative Performance */}
                        <MacroChartContainer height={CHART_HEIGHTS.standard} className="border-t border-border pt-8">
                                <ComposedChart data={filteredData} margin={{ top: 0, right: 60, left: 40, bottom: 0 }}>
                                    <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} vertical={false} />
                                    <XAxis
                                        {...DEFAULT_XAXIS_PROPS}
                                        dataKey="date"
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: WHITE_ALPHA.dim }}
                                        minTickGap={50}
                                        tickFormatter={(str) => new Date(str).getFullYear().toString()}
                                    />
                                    <YAxis
                                        {...DEFAULT_YAXIS_PROPS}
                                        width={60}
                                        yAxisId="pressure"
                                        axisLine={false}
                                        domain={[0, 100]}
                                        tick={{ fontSize: 11, fill: WHITE_ALPHA.dim }}
                                        label={{ value: 'PRESSURE', angle: -90, position: 'insideLeft', fill: WHITE_ALPHA.soft, fontSize: 11, offset: -20, fontWeight: 700 }}
                                    />
                                    <YAxis
                                        {...DEFAULT_YAXIS_PROPS}
                                        width={60}
                                        yAxisId="relative"
                                        orientation="right"
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: WHITE_ALPHA.dim }}
                                        label={{ value: 'VS EM PEERS', angle: 90, position: 'insideRight', fill: WHITE_ALPHA.soft, fontSize: 11, offset: -20, fontWeight: 700 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine y={0} yAxisId="relative" stroke={WHITE_ALPHA.line} />
                                    
                                    {EVENTS.map(event => (
                                        <ReferenceLine
                                            key={event.date}
                                            x={event.date}
                                            yAxisId="pressure"
                                            stroke={WHITE_ALPHA.line}
                                            strokeDasharray="3 3"
                                            label={{ value: event.label, position: 'top', fill: WHITE_ALPHA.soft, fontSize: 11 }}
                                        />
                                    ))}

                                    <Line
                                        yAxisId="pressure"
                                        type="monotone"
                                        dataKey="composite_pressure"
                                        name="Composite Pressure"
                                        stroke={CHART_COLORS.east}
                                        strokeWidth={2}
                                        dot={false}
                                        strokeDasharray="5 5"
                                    />
                                    <Line
                                        yAxisId="relative"
                                        type="monotone"
                                        dataKey="em_relative_pressure"
                                        name="EM Relative Performance (bps)"
                                        stroke={CHART_COLORS.expansion}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </ComposedChart>
                        </MacroChartContainer>
                    </div>
                </div>

                {/* Vertical Sidebar for Insights */}
                <div className="flex flex-col gap-8">
                    <InsightCard
                        title="Policy Divergence"
                        description="Spread between US and Indian terminal rates. Widening spreads typically attract carry trade inflows but increase hedging costs."
                        value={latest?.divergence}
                        unit="bps"
                        trend={(latest?.divergence ?? 0) > 200 ? 'high' : 'normal'}
                    />
                    <InsightCard
                        title="Rupee Pressure"
                        description="Composite index (0-100) measuring flow intensity, volatility, and EM relative weakness. Scores >70 indicate elevated RBI intervention risk."
                        value={latest?.composite_pressure ?? latest?.pressure ?? 0}
                        trend={(latest?.composite_pressure ?? latest?.pressure ?? 0) > 70 ? 'critical' : 'stable'}
                    />
                </div>
            </div>
            {/* Macro Context Integration moved to shared hooks */}
        </SPASection>
    );
};


const MetricMiniCard = ({ label, value, sub, icon }: { label: string; value: string | number; sub: string; icon: React.ReactNode }) => (
    <div className="px-6 py-4 rounded-xl bg-white/[0.03] border border-border flex items-center gap-4 hover:bg-white/[0.05] transition-all">
        <div className="p-2 rounded-xl bg-white/[0.03]">{icon}</div>
        <div>
            <div className="text-xs font-semibold text-terminal-dim uppercase tracking-wider mb-1">{label}</div>
            <div className="text-lg font-bold tabular-nums text-white/90 leading-none">{value}</div>
            <div className="text-xs text-terminal-dim mt-1">{sub}</div>
        </div>
    </div>
);

const InsightCard = ({ title, description, value, unit = '', trend }: { title: string; description: string; value: number | undefined; unit?: string; trend: 'critical' | 'high' | 'stable' | 'normal' }) => (
    <div className="p-6 rounded-xl bg-white/[0.02] border border-border hover:border-white/12 transition-all flex flex-col justify-between">
        <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-4">{title}</div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <div className="mt-6 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white/90">{value?.toFixed(1)}{unit}</span>
            <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider",
                trend === 'critical' || trend === 'high' ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
            )}>
                {trend}
            </span>
        </div>
    </div>
);

const ZoomButton = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
    <button
        onClick={onClick}
        className={cn(
            "px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
            active ? "bg-foreground text-background" : "bg-white/[0.05] text-terminal-dim hover:bg-white/[0.1]"
        )}
    >
        {label}
    </button>
);

const CustomTooltip = (props: TerminalChartTooltipProps) => (
    <TerminalChartTooltip
        {...props}
        labelFormatter={(label) => new Date(String(label)).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        valueFormatter={(value, name) =>
            `${Number(value).toFixed(2)}${name.includes('Rate') || name.includes('Fed') || name.includes('RBI') ? '%' : ''}`
        }
    />
);

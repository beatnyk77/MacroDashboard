import React from 'react';
import { useUSFiscalStress } from '@/hooks/useUSFiscalStress';
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
import { AlertTriangle, TrendingDown, ShieldCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { m } from 'framer-motion';
import { TOOLTIP_SHELL_CLASS } from '@/components/charts/chartTooltipFormat';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

export const DeflationDebasementMonitor: React.FC = () => {
    const { data, isLoading } = useUSFiscalStress();

    const latest = data?.[data.length - 1];

    const insolvencyPercent = latest?.insolvency_ratio ? (latest.insolvency_ratio * 100).toFixed(1) : '0.0';
    const isCrisisZone = latest?.insolvency_ratio ? latest.insolvency_ratio >= 0.25 : false;

    // Calculate percentiles (mock or simplified for now based on historical ranges)
    const getPercentile = (val: number, type: 'insolvency' | 'employment') => {
        if (!data || data.length === 0) return 0;
        const count = data.filter(d => (type === 'insolvency' ? d.insolvency_ratio : d.employment_tax_share) < val).length;
        return Math.round((count / data.length) * 100);
    };

    if (isLoading) {
        return (
            <div className="h-[600px] w-full bg-white/[0.02] animate-pulse rounded-xl flex items-center justify-center">
                <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">Analyzing Fiscal Vulnerability...</span>
            </div>
        );
    }

    return (
        <SPASection id="deflation-debasement-monitor" className="py-24" disableAnimation>
            <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                    <SectionHeader
                        title="Deflation / Debasement Monitor"
                        subtitle="Tracking US fiscal solvency vs. monetary debasement risk ('Print or Default')"
                    />

                    <div className="flex flex-wrap gap-4">
                        <StatusChip
                            label="Insolvency Risk"
                            status={isCrisisZone ? 'CRITICAL' : 'ELEVATED'}
                            color={isCrisisZone ? 'rose' : 'amber'}
                        />
                        <StatusChip
                            label="Tax Base Stability"
                            status="FRAGILE (AI DISRUPTION)"
                            color="rose"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Chart Section */}
                    <div className="lg:col-span-3 bg-white/[0.02] border border-border rounded-xl p-8 relative overflow-hidden group">
                        <div className="absolute top-8 left-8 z-10">
                            <h3 className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">US Federal Insolvency Ratio</h3>
                            <p className="text-xs text-muted-foreground mt-1">Gross Interest Expense ÷ Total Federal Receipts</p>
                        </div>

                        <div className="absolute top-8 right-8 z-10 flex items-center gap-2">
                            <span className={cn("text-3xl font-bold tabular-nums", isCrisisZone ? "text-rose-500" : "text-amber-500")}>
                                {insolvencyPercent}%
                            </span>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-terminal-dim uppercase tracking-heading transition-all">Current</span>
                                <span className="text-xs font-semibold text-rose-500/60 uppercase">Crisis Zone: &gt;25%</span>
                            </div>
                        </div>

                        <MacroChartContainer height={CHART_HEIGHTS.hero} className="mt-12">
                                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="insolvencyGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.stress} stopOpacity={0.1} />
                                            <stop offset="95%" stopColor={CHART_COLORS.stress} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} vertical={false} />
                                    <XAxis
                                        {...DEFAULT_XAXIS_PROPS}
                                        dataKey="date"
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: WHITE_ALPHA.soft }}
                                        minTickGap={60}
                                        tickFormatter={(str) => new Date(str).getFullYear().toString()}
                                    />
                                    <YAxis
                                        {...DEFAULT_YAXIS_PROPS}
                                        width={60}
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: WHITE_ALPHA.soft }}
                                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />

                                    {/* Crisis Zone Reference Line */}
                                    <ReferenceLine y={0.25} stroke={CHART_COLORS.stress} strokeDasharray="5 5" strokeOpacity={0.5} label={{ value: 'FISCAL CRUNCH', position: 'right', fill: CHART_COLORS.stress, fontSize: 11, fontWeight: 'bold' }} />
                                    <ReferenceLine y={0.30} stroke={CHART_COLORS.stress} strokeDasharray="3 3" strokeOpacity={0.8} label={{ value: 'DEFAULT POINT', position: 'right', fill: CHART_COLORS.stress, fontSize: 11, fontWeight: 'bold' }} />

                                    <Area
                                        type="monotone"
                                        dataKey="insolvency_ratio"
                                        stroke="none"
                                        fill="url(#insolvencyGradient)"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="insolvency_ratio"
                                        name="Insolvency Ratio"
                                        stroke={isCrisisZone ? CHART_COLORS.stress : CHART_COLORS.gold}
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                </ComposedChart>
                        </MacroChartContainer>
                    </div>

                    {/* Supporting Metrics Column */}
                    <div className="flex flex-col gap-6">
                        <MetricCard
                            title="Employment Tax Share"
                            value={latest?.employment_tax_share ? (latest.employment_tax_share * 100).toFixed(1) : '0.0'}
                            unit="%"
                            sub={`Percentile: ${getPercentile(latest?.employment_tax_share || 0, 'employment')}th`}
                            icon={<AlertTriangle className="text-amber-500" />}
                            description="Share of receipts vulnerable to AI-driven employment disruption."
                            trend="up"
                        />
                        <MetricCard
                            title="Receipts-to-GDP"
                            value={latest?.receipts_gdp ? (latest.receipts_gdp * 100).toFixed(1) : '0.0'}
                            unit="%"
                            sub="Historical Avg: ~17%"
                            icon={<TrendingDown className="text-rose-500" />}
                            description="Trend in federal revenue collection efficiency relative to economy."
                            trend="down"
                        />
                        <MetricCard
                            title="Interest Coverage"
                            value={latest?.insolvency_ratio ? (1 / latest.insolvency_ratio).toFixed(2) : '0.00'}
                            unit="x"
                            sub="Revenue / Interest"
                            icon={<ShieldCheck className="text-emerald-500" />}
                            description="Ratio of total tax receipts to debt service costs (Inverse of primary ratio)."
                            trend="down"
                        />
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.03] border border-border">
                        <Info size={14} className="text-blue-400" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                            Source: FRED / U.S. Treasury Fiscal Data – updated quarterly
                            {latest?.date && (
                                <span className="opacity-40 italic ml-2">• Latest: {new Date(latest.date).toLocaleDateString([], { month: 'short', year: 'numeric' })}</span>
                            )}
                        </span>
                    </div>
                </div>
            </m.div>
        </SPASection>
    );
};

const StatusChip = ({ label, status, color }: any) => (
    <div className="px-5 py-3 rounded-xl bg-white/[0.03] border border-border flex flex-col items-start gap-1">
        <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">{label}</span>
        <span className={cn(
            "text-xs font-semibold uppercase tracking-heading",
            color === 'rose' ? "text-rose-500" : "text-amber-500"
        )}>{status}</span>
    </div>
);

const MetricCard = ({ title, value, unit, sub, icon, description, trend }: any) => (
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
                    trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>{trend}</span>
            </div>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const val = payload[0].value;
        const date = new Date(label).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return (
            <div className={TOOLTIP_SHELL_CLASS}>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-border pb-2">
                    {date} Fiscal Snapshot
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-12">
                        <span className="text-xs font-bold text-slate-400">Insolvency Ratio</span>
                        <span className={cn("text-xs font-semibold tabular-nums", val > 0.25 ? "text-rose-500" : "text-amber-500")}>
                            {(val * 100).toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

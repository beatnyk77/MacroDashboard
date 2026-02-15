import React, { useState } from 'react';
import { useIndiaFiscalStress } from '@/hooks/useIndiaFiscalStress';
import { SPASection } from '@/components/spa/SPASection';
import { SectionHeader } from '@/components/SectionHeader';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Area
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export const IndiaFiscalStressMonitor: React.FC = () => {
    const { data, isLoading } = useIndiaFiscalStress();
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

    const interestRevenuePercent = latest?.interest_revenue_pct?.toFixed(1) || '0.0';
    const isCrisisZone = latest?.interest_revenue_pct ? latest.interest_revenue_pct >= 35 : false;

    if (isLoading) {
        return (
            <div className="h-[600px] w-full bg-white/[0.02] animate-pulse rounded-3xl flex items-center justify-center">
                <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Analyzing India Fiscal Stress...</span>
            </div>
        );
    }

    return (
        <SPASection id="india-fiscal-stress-monitor" className="py-24" disableAnimation>
            <motion.div
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart Section */}
                    <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group">
                        <div className="absolute top-8 left-8 z-10">
                            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Interest Payments % of Revenue Receipts</h3>
                            <p className="text-[0.6rem] text-muted-foreground/60 mt-1">Union Government Interest Burden</p>
                        </div>

                        <div className="absolute top-8 right-8 z-10 flex items-center gap-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTimeRange('5Y')}
                                    className={cn(
                                        "px-3 py-1 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider transition-all",
                                        timeRange === '5Y' ? "bg-white/10 text-white" : "bg-white/[0.02] text-white/40 hover:bg-white/5"
                                    )}
                                >
                                    5Y
                                </button>
                                <button
                                    onClick={() => setTimeRange('ALL')}
                                    className={cn(
                                        "px-3 py-1 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider transition-all",
                                        timeRange === 'ALL' ? "bg-white/10 text-white" : "bg-white/[0.02] text-white/40 hover:bg-white/5"
                                    )}
                                >
                                    ALL
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn("text-3xl font-black tabular-nums", isCrisisZone ? "text-rose-500" : "text-amber-500")}>
                                    {interestRevenuePercent}%
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-[0.55rem] font-bold text-muted-foreground/40 uppercase tracking-tighter">Current</span>
                                    <span className="text-[0.5rem] font-black text-rose-500/60 uppercase">Crisis: &gt;35%</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[450px] w-full mt-12">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="indiaInterestGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }}
                                        minTickGap={40}
                                        tickFormatter={(str) => {
                                            const date = new Date(str);
                                            return `FY${date.getFullYear().toString().slice(-2)}`;
                                        }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }}
                                        tickFormatter={(val) => `${val.toFixed(0)}%`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />

                                    {/* Crisis Zone Reference Line */}
                                    <ReferenceLine y={35} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.5} label={{ value: 'FISCAL STRESS', position: 'right', fill: '#ef4444', fontSize: 8, fontWeight: 'bold' }} />

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
                                        stroke={isCrisisZone ? "#ef4444" : "#f59e0b"}
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Supporting Metrics Column */}
                    <div className="flex flex-col gap-6">
                        <MetricCard
                            title="Interest/Expenditure"
                            value={latest?.interest_expenditure_pct?.toFixed(1) || '0.0'}
                            unit="%"
                            sub="of Total Spending"
                            icon={<DollarSign className="text-amber-500" size={18} />}
                            description="Share of government expenditure consumed by debt service."
                            trend={latest?.interest_expenditure_pct && latest.interest_expenditure_pct > 23 ? 'up' : 'stable'}
                        />
                        <MetricCard
                            title="Interest/GTR"
                            value={latest?.interest_gtr_pct?.toFixed(1) || '0.0'}
                            unit="%"
                            sub="of Tax Revenue"
                            icon={<AlertTriangle className="text-rose-500" size={18} />}
                            description="Interest payments as percentage of gross tax revenue."
                            trend={latest?.interest_gtr_pct && latest.interest_gtr_pct > 30 ? 'up' : 'stable'}
                        />
                        <MetricCard
                            title="Fiscal Deficit/GDP"
                            value={latest?.fiscal_deficit_gdp_pct?.toFixed(1) || '0.0'}
                            unit="%"
                            sub="Budget Gap"
                            icon={<TrendingDown className="text-rose-500" size={18} />}
                            description="Annual fiscal deficit as percentage of GDP."
                            trend={latest?.fiscal_deficit_gdp_pct && latest.fiscal_deficit_gdp_pct > 6 ? 'up' : 'down'}
                        />
                        <MetricCard
                            title="Debt/GDP"
                            value={latest?.debt_gdp_pct?.toFixed(1) || '0.0'}
                            unit="%"
                            sub="Total Debt"
                            icon={<TrendingUp className="text-amber-500" size={18} />}
                            description="General government debt as percentage of GDP."
                            trend={latest?.debt_gdp_pct && latest.debt_gdp_pct > 80 ? 'up' : 'stable'}
                        />
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.03] border border-white/5">
                        <Info size={14} className="text-blue-400" />
                        <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest text-center">
                            Source: Union Budget / PRS India / RBI DBIE – updated monthly
                        </span>
                    </div>
                </div>
            </motion.div>
        </SPASection>
    );
};

const StatusChip = ({ label, status, color }: { label: string; status: string; color: 'rose' | 'amber' | 'emerald' }) => (
    <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-start gap-1">
        <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-widest">{label}</span>
        <span className={cn(
            "text-[0.65rem] font-black uppercase tracking-tighter",
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
    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between hover:bg-white/[0.04] transition-all group">
        <div className="flex items-start justify-between mb-4">
            <div className="p-2 rounded-xl bg-white/[0.03] group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className="text-right">
                <div className="text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-1">{title}</div>
                <div className="flex items-baseline justify-end gap-1">
                    <span className="text-3xl font-black text-white/90 tabular-nums">{value}</span>
                    <span className="text-xs font-bold text-muted-foreground/40">{unit}</span>
                </div>
            </div>
        </div>
        <div>
            <div className="text-[0.6rem] font-bold text-muted-foreground/60 leading-relaxed mb-4">{description}</div>
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[0.6rem] font-black uppercase tracking-widest text-white/20">{sub}</span>
                <span className={cn(
                    "text-[0.55rem] font-black px-2 py-0.5 rounded-full uppercase",
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
            <div className="bg-slate-950/90 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-3xl">
                <div className="text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                    {fy} Fiscal Snapshot
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-12">
                        <span className="text-[0.7rem] font-bold text-muted-foreground/80">Interest/Revenue</span>
                        <span className={cn("text-[0.8rem] font-black tabular-nums", data.interest_revenue_pct >= 35 ? "text-rose-500" : "text-amber-500")}>
                            {data.interest_revenue_pct?.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-12">
                        <span className="text-[0.7rem] font-bold text-muted-foreground/80">Fiscal Deficit/GDP</span>
                        <span className="text-[0.8rem] font-black tabular-nums text-rose-500">
                            {data.fiscal_deficit_gdp_pct?.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-12">
                        <span className="text-[0.7rem] font-bold text-muted-foreground/80">Debt/GDP</span>
                        <span className="text-[0.8rem] font-black tabular-nums text-amber-500">
                            {data.debt_gdp_pct?.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

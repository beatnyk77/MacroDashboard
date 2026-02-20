import React, { useState, useMemo } from 'react';
import { useIndiaFiscalAllocation } from '@/hooks/useIndiaFiscalAllocation';
import { SectionHeader } from '@/components/SectionHeader';
import { IndiaLeafletMap } from '../maps/IndiaLeafletMap';
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Cell
} from 'recharts';
import { AlertTriangle, Building2, PieChart, Info, Map as MapIcon, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const IndiaFiscalAllocationTracker: React.FC = () => {
    const { data, isLoading } = useIndiaFiscalAllocation();
    const [timeRange, setTimeRange] = useState<'5Y' | 'ALL'>('ALL');
    const [selectedState, setSelectedState] = useState<any>(null);

    const { centralData, stateData } = useMemo(() => {
        return {
            centralData: data?.centralData || [],
            stateData: data?.stateData || []
        };
    }, [data]);

    const latestCentral = centralData[centralData.length - 1];

    const filteredCentral = useMemo(() => {
        if (timeRange === '5Y') return centralData.slice(-5);
        return centralData;
    }, [centralData, timeRange]);

    const getMapColor = (val: number) => {
        if (val >= 4) return '#10b981'; // High Capex
        if (val >= 2.5) return '#059669';
        if (val >= 1.5) return '#64748b'; // Neutral
        if (val >= 1) return '#f43f5e'; // Low
        return '#e11d48'; // Critical
    };

    if (isLoading) {
        return (
            <div className="h-[800px] w-full bg-white/[0.02] border border-white/5 animate-pulse rounded-[3rem] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Decoding Fiscal Allocations...</span>
                </div>
            </div>
        );
    }

    return (
        <section id="india-fiscal-allocation" className="py-24 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-16"
            >
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8">
                    <SectionHeader
                        title="India Fiscal Allocation Tracker"
                        subtitle="Capital Expenditure (Capex) vs Revenue Expenditure / Freebies mix"
                    />
                    <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[0.65rem] font-black text-white/60 uppercase tracking-widest">Live Flow: FY 2024-25 Budgetary Pulse</span>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <KPICard
                        title="Central Capex Momentum"
                        value={`₹${latestCentral?.capex_lakh_cr?.toFixed(1) || '0'}L Cr`}
                        sub="Union Budget Allocation"
                        trend="+16% YoY"
                        trendStatus="positive"
                        icon={<Building2 className="text-emerald-500" size={20} />}
                        description="Direct budgetary allocation for high-multiplier infrastructure projects."
                    />
                    <KPICard
                        title="Capex % Total Spending"
                        value={`${latestCentral?.capex_pct_total?.toFixed(1) || '0'}%`}
                        sub="Allocation Quality"
                        trend="Sustainable"
                        trendStatus="neutral"
                        icon={<PieChart className="text-blue-500" size={20} />}
                        description="Share of total expenditure invested in productive asset creation."
                    />
                    <KPICard
                        title="Freebie/Committed Risk"
                        value={`${latestCentral?.freebies_pct_receipts?.toFixed(1) || '0'}%`}
                        sub="of Revenue Receipts"
                        trend="Elevated"
                        trendStatus="warning"
                        icon={<AlertTriangle className="text-amber-500" size={20} />}
                        description="Subsidies + Committed exp (Salaries, Pensions) as % of Net Receipts."
                    />
                </div>

                {/* Interactive Map & Trends Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                    {/* Left: Interactive Map */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <MapIcon size={18} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest">State-Level Capex Velocity</h4>
                                    <p className="text-[0.6rem] text-muted-foreground/60 italic">Interactive choropleth: Capex % GSDP</p>
                                </div>
                            </div>
                            {selectedState && (
                                <button
                                    onClick={() => setSelectedState(null)}
                                    className="text-[0.6rem] font-black text-emerald-500/60 uppercase tracking-widest hover:text-emerald-500 transition-colors"
                                >
                                    Reset Zoom
                                </button>
                            )}
                        </div>

                        <div className="h-[550px] w-full rounded-[2.5rem] bg-white/[0.01] border border-white/5 p-4 relative overflow-hidden group">
                            <IndiaLeafletMap
                                data={stateData}
                                metric="capex_pct_gdp"
                                getColor={getMapColor}
                                getValue={(s) => s.capex_pct_gdp || 0}
                                onStateClick={(s) => setSelectedState(s)}
                                selectedStateCode={selectedState?.state_code}
                                tooltipFormatter={(s) => `
                                    <div class="space-y-1">
                                        <div class="text-[0.7rem] font-black text-white/90 mb-1 border-b border-white/10 pb-1">${s.state_name}</div>
                                        <div class="flex justify-between gap-4">
                                            <span class="text-muted-foreground/60">Capex/GSDP:</span>
                                            <span class="text-emerald-400 font-black">${s.capex_pct_gdp?.toFixed(1)}%</span>
                                        </div>
                                        <div class="flex justify-between gap-4">
                                            <span class="text-muted-foreground/60">Rev. Exp/GSDP:</span>
                                            <span class="text-amber-400 font-bold">${s.revenue_pct_gdp?.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                `}
                            />

                            {/* Legends */}
                            <div className="absolute bottom-8 right-8 z-[1000] p-4 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/10 flex flex-col gap-3">
                                <span className="text-[0.55rem] font-black text-muted-foreground/60 uppercase tracking-widest border-b border-white/5 pb-2">Capex Intensity (%)</span>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                        <span className="text-[0.6rem] font-bold text-white/80">High (4%+)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-[#64748b]" />
                                        <span className="text-[0.6rem] font-bold text-white/80">Neutral (1.5 - 2.5%)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                                        <span className="text-[0.6rem] font-bold text-white/80">Low (&lt; 1%)</span>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {selectedState && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="absolute top-8 left-8 z-[1000] p-6 rounded-3xl bg-slate-950/90 backdrop-blur-2xl border border-emerald-500/20 max-w-[240px] shadow-3xl"
                                    >
                                        <h5 className="text-lg font-black text-white italic mb-1">{selectedState.state_name}</h5>
                                        <p className="text-[0.6rem] text-muted-foreground/60 uppercase tracking-widest font-black mb-6">State Profile Index</p>
                                        <div className="space-y-4">
                                            <StateDetailRow label="Capex Strategy" value={`${selectedState.capex_pct_gdp?.toFixed(1)}%`} sub="of GSDP" color="text-emerald-500" />
                                            <StateDetailRow label="Revenue Overhang" value={`${selectedState.revenue_pct_gdp?.toFixed(1)}%`} sub="of GSDP" color="text-amber-500" />
                                            <StateDetailRow label="Committed Burden" value={`${selectedState.freebies_pct_receipts?.toFixed(0)}%`} sub="of Receipts" color="text-rose-500" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right: Trends Chart */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    <BarChart3 size={18} className="text-blue-500" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Efficiency Trends</h4>
                                    <p className="text-[0.6rem] text-muted-foreground/60 italic">Central Government Allocation Mix</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {['5Y', 'ALL'].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setTimeRange(r as any)}
                                        className={cn(
                                            "px-3 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-wider transition-all",
                                            timeRange === r ? "bg-white/10 text-white" : "bg-white/[0.02] text-white/40 hover:bg-white/5"
                                        )}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[550px] w-full rounded-[2.5rem] bg-white/[0.01] border border-white/5 p-8 relative group">
                            <div className="absolute top-8 left-8 z-10">
                                <span className="text-[0.5rem] font-black text-white/20 uppercase tracking-[0.3em]">Capital vs Revenue Dynamics</span>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={filteredCentral} margin={{ top: 60, right: 30, left: 0, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="capexGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                                        </linearGradient>
                                        <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis
                                        dataKey="fy"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }}
                                        tickFormatter={(val) => `${val}%`}
                                        domain={[0, 'auto']}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        iconType="circle"
                                        iconSize={6}
                                        wrapperStyle={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '10px' }}
                                    />

                                    <Bar
                                        yAxisId="left"
                                        dataKey="revenue_pct_gdp"
                                        name="Rev Exp / GDP %"
                                        fill="rgba(245, 158, 11, 0.1)"
                                        radius={[4, 4, 0, 0]}
                                        barSize={40}
                                    />
                                    <Bar
                                        yAxisId="left"
                                        dataKey="capex_pct_gdp"
                                        name="Capex / GDP %"
                                        radius={[4, 4, 0, 0]}
                                        barSize={40}
                                    >
                                        {filteredCentral.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill="url(#capexGradient)" />
                                        ))}
                                    </Bar>
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="freebies_pct_receipts"
                                        name="Freebie Multiplier"
                                        stroke="#f43f5e"
                                        strokeWidth={3}
                                        dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }}
                                        activeDot={{ r: 5, strokeWidth: 0 }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Footer Source */}
                <div className="flex justify-center">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.03] border border-white/5">
                        <Info size={14} className="text-blue-400" />
                        <span className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest text-center">
                            Source: Finance.gov.in (Expenditure Profile) / RBI State Finances Report / PRS India analysis
                        </span>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

const KPICard = ({ title, value, sub, trend, trendStatus, icon, description }: any) => (
    <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
        <div className="flex items-start justify-between mb-8">
            <div className="p-3 rounded-2xl bg-white/[0.03] group-hover:scale-110 transition-transform duration-500">
                {icon}
            </div>
            <div className={cn(
                "px-3 py-1 rounded-full text-[0.55rem] font-black uppercase tracking-tighter",
                trendStatus === 'positive' ? "bg-emerald-500/10 text-emerald-500" :
                    trendStatus === 'warning' ? "bg-amber-500/10 text-amber-500" :
                        "bg-blue-500/10 text-blue-500"
            )}>
                {trend}
            </div>
        </div>
        <div>
            <div className="text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-2">{title}</div>
            <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{value}</span>
                <span className="text-[0.6rem] font-bold text-muted-foreground/40 uppercase tracking-widest">{sub}</span>
            </div>
            <div className="text-[0.65rem] font-bold text-muted-foreground/50 leading-relaxed italic">
                {description}
            </div>
        </div>
        {/* Glow effect */}
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full group-hover:bg-emerald-500/10 transition-colors" />
    </div>
);

const StateDetailRow = ({ label, value, sub, color }: any) => (
    <div className="flex justify-between items-end border-b border-white/5 pb-3">
        <div className="flex flex-col">
            <span className="text-[0.55rem] font-black text-white/30 uppercase tracking-widest leading-none mb-1">{label}</span>
            <span className="text-[0.5rem] font-bold text-muted-foreground/40 uppercase tracking-tighter">{sub}</span>
        </div>
        <span className={cn("text-xl font-black tabular-nums tracking-tighter", color)}>{value}</span>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl shadow-3xl">
                <div className="text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                    {label} Fiscal Matrix
                </div>
                <div className="space-y-3">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-12">
                            <span className="text-[0.7rem] font-bold text-muted-foreground/80">{entry.name}</span>
                            <span className="text-[0.8rem] font-black tabular-nums" style={{ color: entry.stroke || entry.fill || entry.color }}>
                                {entry.value?.toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

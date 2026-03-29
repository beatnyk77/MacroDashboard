import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartTooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import {
    TrendingUp,
    AlertTriangle,
    Users,
    Briefcase,
    ArrowDown
} from 'lucide-react';
import { useCorporateProfitShare } from '@/hooks/useCorporateProfitShare';
import { SectionHeader } from '@/components/SectionHeader';
import { Card } from '@/components/ui/card';

const HISTORIC_HIGH_THRESHOLD = 17;

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
};

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/95 border border-white/10 rounded-xl p-4 backdrop-blur-xl text-xs font-mono">
                <p className="text-neutral-400 font-black uppercase tracking-widest mb-3">{label}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-neutral-400">{p.name}:</span>
                        <span className="font-black text-white">{p.value?.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const CorporateProfitCapture: React.FC = () => {
    const { data, isLoading } = useCorporateProfitShare();

    const usData = useMemo(() => data?.filter(d => d.country === 'US') || [], [data]);
    const g20Data = useMemo(() => data?.filter(d => d.country === 'G20') || [], [data]);

    // Merge datasets by year for the chart
    const chartData = useMemo(() => {
        const allYears = Array.from(new Set([...usData.map(d => d.year), ...g20Data.map(d => d.year)])).sort();
        return allYears.map(year => {
            const us = usData.find(d => d.year === year);
            const g20 = g20Data.find(d => d.year === year);
            return {
                year,
                US: us?.profit_share_pct ?? null,
                G20: g20?.profit_share_pct ?? null,
                usWage: us?.wage_share_pct ?? null,
            };
        });
    }, [usData, g20Data]);

    // Latest US stats
    const latestUS = usData[usData.length - 1];
    const latestG20 = g20Data[g20Data.length - 1];
    const isHistoricHigh = (latestUS?.profit_share_pct ?? 0) >= HISTORIC_HIGH_THRESHOLD;

    // Squeeze ratio and YoY change
    const prevUS = usData[usData.length - 2];
    const yoyChange = latestUS && prevUS
        ? latestUS.profit_share_pct - prevUS.profit_share_pct
        : 0;

    if (isLoading) {
        return <div className="h-[600px] w-full bg-white/5 rounded-3xl animate-pulse" />;
    }

    return (
        <div id="corporate-profit-capture" className="py-24">
            <SectionHeader
                title="Corporate Profit Capture"
                subtitle="Profit share of GDP vs worker wages — a structural squeeze in motion"
                icon={<Briefcase className="w-6 h-6 text-emerald-500" />}
            />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="mt-16 space-y-8"
            >
                {/* KPI Row */}
                <motion.div variants={cardVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* US Profit Share */}
                    <Card className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[0.55rem] font-black text-neutral-500 uppercase tracking-widest mb-3">US Profit Share</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white font-mono tracking-tighter">
                                {latestUS?.profit_share_pct?.toFixed(1)}%
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">of GDP · {latestUS?.year}</p>
                        {isHistoricHigh && (
                            <div className="mt-3 flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 w-fit">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                                <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Historic High</span>
                            </div>
                        )}
                    </Card>

                    {/* Worker (Wage) Share */}
                    <Card className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[0.55rem] font-black text-neutral-500 uppercase tracking-widest mb-3">US Wage Share</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white font-mono tracking-tighter">
                                {latestUS?.wage_share_pct?.toFixed(1)}%
                            </span>
                            <div className="flex items-center gap-1">
                                <ArrowDown className="w-3 h-3 text-rose-500" />
                                <span className="text-xs text-rose-400 font-mono font-bold">Lowest since 1980</span>
                            </div>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">of GDP · {latestUS?.year}</p>
                    </Card>

                    {/* Squeeze Ratio */}
                    <Card className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                        <p className="text-[0.55rem] font-black text-neutral-500 uppercase tracking-widest mb-3">Worker Squeeze Ratio</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-amber-400 font-mono tracking-tighter">
                                {latestUS?.squeeze_ratio?.toFixed(2)}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">Profit ÷ Wage Share</p>
                        <p className="text-xs text-amber-500/70 mt-1 font-mono">
                            {latestUS?.squeeze_ratio > 0.35 ? 'Elevated' : 'Moderate'}
                        </p>
                    </Card>

                    {/* G20 Average */}
                    <Card className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                        <p className="text-[0.55rem] font-black text-neutral-500 uppercase tracking-widest mb-3">G20 Avg Profit Share</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-sky-400 font-mono tracking-tighter">
                                {latestG20?.profit_share_pct?.toFixed(1)}%
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">of GDP · {latestG20?.year}</p>
                        <p className="text-xs text-sky-400/70 mt-1 font-mono">OECD NAAG</p>
                    </Card>
                </motion.div>

                {/* Chart Card */}
                <motion.div variants={cardVariants}>
                    <Card className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Corporate Profit Share of GDP</h3>
                                    <p className="text-xs text-neutral-500 uppercase font-black tracking-widest">Historical 1980–present · Quarterly BEA + OECD Sources</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-0.5 bg-emerald-500 block" />
                                    <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">US</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-0.5 bg-sky-500 block border-dashed border-sky-500" style={{ borderTop: '2px dashed' }} />
                                    <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">G20 avg</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[380px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" strokeOpacity={0.5} />
                                    <XAxis
                                        dataKey="year"
                                        tick={{ fill: '#666', fontSize: 11, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval={4}
                                    />
                                    <YAxis
                                        domain={[7, 20]}
                                        tick={{ fill: '#666', fontSize: 11, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={v => `${v}%`}
                                        width={42}
                                    />
                                    <RechartTooltip content={<CustomTooltip />} />

                                    {/* Historic high threshold */}
                                    <ReferenceLine
                                        y={HISTORIC_HIGH_THRESHOLD}
                                        stroke="#f59e0b"
                                        strokeDasharray="6 4"
                                        strokeOpacity={0.5}
                                        label={{
                                            value: '17% — Historic High',
                                            position: 'insideTopRight',
                                            fill: '#f59e0b',
                                            fontSize: 9,
                                            fontWeight: 800
                                        }}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="US"
                                        name="US Profit Share"
                                        stroke="#10b981"
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="G20"
                                        name="G20 Avg"
                                        stroke="#38bdf8"
                                        strokeWidth={2}
                                        strokeDasharray="5 3"
                                        dot={false}
                                        activeDot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }}
                                        connectNulls
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Callout Banner */}
                        <div className="mt-8 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <Users className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-black text-white uppercase tracking-wider mb-1">
                                        US Corporate Profit Share Now at {latestUS?.profit_share_pct?.toFixed(1)}% — Highest Since Records Began
                                    </p>
                                    <p className="text-[0.65rem] text-neutral-400 leading-relaxed font-mono">
                                        The labour share of national income has declined from its 1980 peak of ~58% to a record low of {latestUS?.wage_share_pct?.toFixed(1)}%,
                                        while corporate profits have surged {yoyChange > 0 ? `+${yoyChange.toFixed(1)}pp YoY` : `${yoyChange.toFixed(1)}pp YoY`}.
                                        The Worker Squeeze Ratio — profit share divided by wage share — stands at {latestUS?.squeeze_ratio?.toFixed(2)}.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                    <p className="text-[0.55rem] font-black text-neutral-500 uppercase tracking-widest">YoY Δ Profit</p>
                                    <p className={`text-lg font-black font-mono ${yoyChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(1)}pp
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </motion.div>

            <div className="mt-12 flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-8 gap-6">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-black leading-none">
                    Sources: BEA NIPA Table 1.12 · FRED CP/GDP · OECD NAAG
                </p>
                <p className="text-xs text-neutral-500 uppercase font-black leading-none flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Annual update (Q4 BEA release)
                </p>
            </div>
        </div>
    );
};

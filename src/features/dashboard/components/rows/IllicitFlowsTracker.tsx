import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RechartTooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import {
    AlertTriangle,
    ShieldAlert,
    Globe,
    Activity,
    ArrowUpRight,
    Search
} from 'lucide-react';
import { useIllicitFlowsData } from '@/hooks/useIllicitFlowsData';
import { SectionHeader } from '@/components/SectionHeader';
import { Card } from '@/components/ui/card';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
};

export const IllicitFlowsTracker: React.FC = () => {
    const { data, isLoading } = useIllicitFlowsData();

    const latestYear = useMemo(() => {
        if (!data?.length) return 2024;
        return Math.max(...data.map(d => d.year));
    }, [data]);

    const latestFlows = useMemo(() => {
        return data?.filter(d => d.year === latestYear) || [];
    }, [data, latestYear]);

    const totalLossLatest = useMemo(() => {
        return latestFlows.reduce((sum, f) => sum + f.amount_usd_bn, 0);
    }, [latestFlows]);

    const avgGdpPct = useMemo(() => {
        if (!latestFlows.length) return 0;
        return latestFlows.reduce((sum, f) => sum + f.percent_gdp, 0);
    }, [latestFlows]);

    const chartData = useMemo(() => {
        return latestFlows
            .sort((a, b) => b.amount_usd_bn - a.amount_usd_bn)
            .map(f => ({
                name: f.partner_country,
                amount: f.amount_usd_bn,
                score: f.vulnerability_score,
                pctGdp: f.percent_gdp
            }));
    }, [latestFlows]);

    // Gauge data (simulated with half-pie)
    const gaugeData = [
        { value: avgGdpPct },
        { value: Math.max(0, 5 - avgGdpPct) } // 5% max threshold
    ];

    if (isLoading) {
        return <div className="h-[500px] w-full bg-white/5 rounded-3xl animate-pulse" />;
    }

    return (
        <div id="illicit-flows" className="py-24">
            <SectionHeader
                title="Illicit Flows via Trade Misinvoicing"
                subtitle="Quantifying India's annual capital leakage through bilateral trade gaps"
                icon={<ShieldAlert className="w-6 h-6 text-amber-500" />}
            />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
                {/* Gauge Card */}
                <motion.div variants={cardVariants} className="lg:col-span-4">
                    <Card className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 h-full relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-8">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <Activity className="w-4 h-4 text-amber-500" />
                                </div>
                                <span className="text-xs font-black text-neutral-500 uppercase tracking-widest text-white/60">Annual Loss Pulse</span>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="relative h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={gaugeData}
                                                cx="50%"
                                                cy="80%"
                                                startAngle={180}
                                                endAngle={0}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={0}
                                                dataKey="value"
                                            >
                                                <Cell fill="#f59e0b" />
                                                <Cell fill="#1a1a1a" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
                                        <span className="text-4xl font-black text-white font-mono tracking-tighter">
                                            {avgGdpPct.toFixed(1)}%
                                        </span>
                                        <span className="text-xs font-black text-neutral-500 uppercase tracking-widest mt-1">of India GDP</span>
                                    </div>
                                </div>

                                <div className="text-center mt-6">
                                    <div className="text-5xl font-black text-white font-mono tracking-tighter mb-2">
                                        ${totalLossLatest.toFixed(1)}
                                        <span className="text-lg text-neutral-500 ml-2 font-black uppercase">bn</span>
                                    </div>
                                    <p className="text-xs text-neutral-400 font-medium">Estimated Est. Annual Outflow ({latestYear})</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                <div className="flex justify-between items-center text-xs text-neutral-500 uppercase font-black">
                                    <span>GFI Reliability Score</span>
                                    <span className="text-amber-400">High Confidence</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-2">
                                        <p className="text-[0.65rem] text-neutral-400 leading-relaxed italic">
                                            "Trade misinvoicing allows for the movement of massive amounts of capital out of EM economies into secrecy jurisdictions."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Partner Index Card */}
                <motion.div variants={cardVariants} className="lg:col-span-8">
                    <Card className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 h-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <Globe className="w-4 h-4 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Misinvoicing Partner Index</h3>
                                    <p className="text-xs text-neutral-500 uppercase font-black tracking-widest uppercase">Top Countries identified by trade mismatch</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                <Search className="w-3 h-3 text-neutral-500" />
                                <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Global Financial Integrity (GFI) Reports</span>
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#888', fontSize: '12px', fontWeight: 'bold' }}
                                        width={100}
                                    />
                                    <RechartTooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '10px', color: '#fff' }}
                                    />
                                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#f59e0b' : '#3f3f3f'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-8">
                            {latestFlows.sort((a, b) => b.vulnerability_score - a.vulnerability_score).map((flow, i) => (
                                <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center">
                                    <span className="text-[0.55rem] font-black text-neutral-500 uppercase tracking-widest mb-1 text-center truncate w-full">{flow.partner_country}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-sm font-black font-mono ${flow.vulnerability_score > 80 ? 'text-amber-500' : 'text-white'}`}>{flow.vulnerability_score}</span>
                                        <span className="text-[0.45rem] font-black text-neutral-600 uppercase">INDEX</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </motion.div>

            <div className="mt-8 p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <h5 className="text-[0.65rem] font-black text-white uppercase tracking-widest mb-1">Methodological Note & Disclosure</h5>
                    <p className="text-[0.65rem] text-neutral-400 leading-relaxed font-mono">
                        Estimates of trade misinvoicing are calculated using bilateral trade data gaps (Value Gap analysis). These figures represent illicit outflows linked to tax evasion, money laundering, and capital flight. Data is derived from Global Financial Integrity (GFI) annual reports and UN Comtrade mirrors. These estimates carry a margin of error and reflect illicit *potential* rather than legal convictions.
                    </p>
                </div>
            </div>

            <div className="mt-12 flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-8 gap-6">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <p className="text-xs text-neutral-500 uppercase tracking-widest font-black leading-none">
                        Intelligence: GFI, UN Comtrade, India FIU
                    </p>
                    <div className="h-4 w-px bg-white/5 hidden md:block" />
                    <p className="text-xs text-neutral-500 uppercase tracking-widest font-black leading-none flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Annual Update Synchronized
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-neutral-500 uppercase font-black tracking-widest">Vulnerability Bias</p>
                        <p className="text-xs font-bold text-amber-400 font-mono">Outflow Skewed</p>
                    </div>
                    <div className="h-8 w-px bg-white/5" />
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group">
                        <span className="text-xs font-black text-white uppercase tracking-widest">Bilateral Gaps</span>
                        <ArrowUpRight className="w-3 h-3 text-neutral-500 group-hover:text-white transition-colors" />
                    </button>
                </div>
            </div>
        </div>
    );
};

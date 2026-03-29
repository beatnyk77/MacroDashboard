import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ComposableMap,
    Geographies,
    Geography,
    Line,
    Marker
} from 'react-simple-maps';
import {
    Tooltip as RechartTooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    ShieldAlert,
    Globe,
    TrendingUp,
    ArrowUpRight,
    Zap,
    ChevronRight,
    Lock
} from 'lucide-react';
import { useEliteWealthFlightData, EliteWealthFlight } from '@/hooks/useEliteWealthFlightData';
import { SectionHeader } from '@/components/SectionHeader';
import { Card } from '@/components/ui/card';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const COUNTRY_COORDS: Record<string, [number, number]> = {
    'China': [104, 35],
    'India': [78, 20],
    'US': [-95, 37],
    'UK': [-2, 54],
    'Russia': [105, 60],
    'Norway': [8, 60],
    'Sweden': [18, 60],
    'Singapore': [103.8, 1.35],
    'UAE': [54, 24],
    'Switzerland': [8.2, 46.8],
    'Cayman Islands': [-80.5, 19.3]
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
};

export const EliteWealthFlightIndex: React.FC = () => {
    const { data, isLoading } = useEliteWealthFlightData();
    const [hoveredFlow, setHoveredFlow] = useState<EliteWealthFlight | null>(null);

    const latestYear = useMemo(() => {
        if (!data?.length) return 2024;
        return Math.max(...data.map(d => d.year));
    }, [data]);

    const latestFlows = useMemo(() => {
        return data?.filter(d => d.year === latestYear) || [];
    }, [data, latestYear]);

    const totalFlightLatest = useMemo(() => {
        return latestFlows.reduce((sum, f) => sum + f.amount_usd_bn, 0);
    }, [latestFlows]);

    const cumulativeData = useMemo(() => {
        if (!data) return [];
        const years = Array.from(new Set(data.map(d => d.year))).sort();
        let total = 0;
        return years.map(year => {
            const yearTotal = data.filter(d => d.year === year).reduce((sum, f) => sum + f.amount_usd_bn, 0);
            total += yearTotal;
            return { year, amount: yearTotal, cumulative: total };
        });
    }, [data]);

    if (isLoading) {
        return <div className="h-[600px] w-full bg-white/5 rounded-3xl animate-pulse" />;
    }

    return (
        <div id="elite-wealth-flight" className="py-24">
            <SectionHeader
                title="Elite Offshore Wealth Flight"
                subtitle="High-fidelity tracking of capital migration to tax havens"
                icon={<ShieldAlert className="w-6 h-6 text-rose-500" />}
            />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
                {/* Gauge / KPI Card */}
                <motion.div variants={cardVariants} className="lg:col-span-4 flex flex-col gap-6">
                    <Card className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all duration-500" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-8">
                                <div className="p-2 bg-rose-500/10 rounded-lg">
                                    <Zap className="w-4 h-4 text-rose-500" />
                                </div>
                                <span className="text-xs font-black text-neutral-500 uppercase tracking-widest">Global Outflow</span>
                            </div>

                            <div className="mb-2">
                                <span className="text-6xl font-black text-white font-mono tracking-tighter">
                                    ${totalFlightLatest.toFixed(1)}
                                    <span className="text-xl text-neutral-500 ml-2">bn</span>
                                </span>
                            </div>
                            <p className="text-sm text-neutral-400 font-medium">Wealth flight identified in {latestYear}</p>

                            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-neutral-500 uppercase font-black">Velocity Pulse</span>
                                    <span className="text-xs font-bold text-rose-400 font-mono">Accelerating</span>
                                </div>
                                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: "75%" }}
                                        className="h-full bg-gradient-to-r from-rose-500 to-rose-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 flex flex-col justify-between">
                        <div>
                            <h4 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-6">Top Outflow Nodes</h4>
                            <div className="space-y-4">
                                {latestFlows.sort((a, b) => b.amount_usd_bn - a.amount_usd_bn).slice(0, 4).map((flow, i) => (
                                    <div key={i} className="flex items-center justify-between group cursor-help">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50 group-hover:bg-rose-500 transition-colors" />
                                            <span className="text-sm font-bold text-white/80 group-hover:text-white">{flow.origin_country}</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xs font-mono font-bold text-white">${flow.amount_usd_bn}B</span>
                                            <span className="text-xs text-rose-400">+{flow.flight_velocity_pct}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8 p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Lock className="w-3 h-3 text-rose-400" />
                                <span className="text-xs font-black text-rose-400 uppercase">Havens Identified</span>
                            </div>
                            <p className="text-[0.65rem] text-neutral-400 leading-relaxed font-mono">
                                UAE, Singapore, Switzerland, Cayman Islands
                            </p>
                        </div>
                    </Card>
                </motion.div>

                {/* Map Section */}
                <motion.div variants={cardVariants} className="lg:col-span-8">
                    <Card className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden relative">
                        <div className="absolute top-6 left-8 z-20">
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-rose-500" />
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Flight Trajectory Map</h3>
                                    <p className="text-xs text-neutral-500 uppercase font-black tracking-widest">Real-time Capital Migration Flows</p>
                                </div>
                            </div>
                        </div>

                        <div className="h-[500px] w-full bg-[#0a0a0a]">
                            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120, center: [20, 30] }}>
                                <Geographies geography={geoUrl}>
                                    {({ geographies }) =>
                                        geographies.map((geo) => (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill="#1a1a1a"
                                                stroke="#333"
                                                strokeWidth={0.5}
                                                style={{
                                                    default: { outline: "none" },
                                                    hover: { fill: "#222", outline: "none" },
                                                    pressed: { outline: "none" },
                                                }}
                                            />
                                        ))
                                    }
                                </Geographies>

                                {latestFlows.map((flow, i) => {
                                    const origin = COUNTRY_COORDS[flow.origin_country];
                                    const haven = COUNTRY_COORDS[flow.haven_country];
                                    if (!origin || !haven) return null;

                                    return (
                                        <g key={i}>
                                            <Line
                                                from={origin}
                                                to={haven}
                                                stroke="#f43f5e"
                                                strokeWidth={Math.min(flow.amount_usd_bn / 5, 4)}
                                                strokeOpacity={hoveredFlow?.id === flow.id ? 1 : 0.4}
                                                strokeLinecap="round"
                                                onMouseEnter={() => setHoveredFlow(flow)}
                                                onMouseLeave={() => setHoveredFlow(null)}
                                            />
                                            <Marker coordinates={origin}>
                                                <circle r={3} fill="#f43f5e" />
                                            </Marker>
                                            <Marker coordinates={haven}>
                                                <circle r={2} fill="#fff" />
                                            </Marker>
                                        </g>
                                    );
                                })}
                            </ComposableMap>

                            {/* Hover Details Overlay */}
                            <AnimatePresence>
                                {hoveredFlow && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="absolute bottom-8 right-8 z-30 p-4 bg-black/90 border border-white/10 rounded-2xl backdrop-blur-xl pointer-events-none"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xs font-black text-rose-500 uppercase">{hoveredFlow.origin_country}</span>
                                            <ChevronRight className="w-3 h-3 text-neutral-600" />
                                            <span className="text-xs font-black text-white uppercase">{hoveredFlow.haven_country}</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-black text-white font-mono">${hoveredFlow.amount_usd_bn}B</span>
                                            <span className="text-xs text-neutral-500 uppercase font-bold tracking-tighter">Annual Flight</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Chart Overlay for History */}
                        <div className="absolute bottom-6 left-8 right-8 z-20 h-32 flex gap-8">
                            <Card className="flex-1 bg-black/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 overflow-hidden">
                                <h5 className="text-[0.55rem] font-black text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3 text-rose-500" />
                                    Cumulative Flight 2015-Present
                                </h5>
                                <div className="h-full">
                                    <ResponsiveContainer width="100%" height="80%">
                                        <AreaChart data={cumulativeData}>
                                            <defs>
                                                <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area type="monotone" dataKey="cumulative" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorCum)" />
                                            <RechartTooltip
                                                contentStyle={{ background: '#000', border: '1px solid #333', fontSize: '10px' }}
                                                labelStyle={{ color: '#888' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <Card className="w-48 bg-black/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                                <span className="text-[0.55rem] font-black text-neutral-500 uppercase tracking-widest mb-1">Total identified</span>
                                <span className="text-2xl font-black text-white font-mono tracking-tighter">
                                    ${(cumulativeData[cumulativeData.length - 1]?.cumulative || 0).toFixed(0)}B+
                                </span>
                                <div className="flex items-center gap-1 mt-1">
                                    <ArrowUpRight className="w-3 h-3 text-rose-500" />
                                    <span className="text-xs text-rose-400 font-bold">Structural Shift</span>
                                </div>
                            </Card>
                        </div>
                    </Card>
                </motion.div>
            </motion.div>

            <div className="mt-12 flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-8 gap-6">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <p className="text-xs text-neutral-500 uppercase tracking-widest font-black leading-none">
                        Intelligence: EU Tax Obs, Henley, BIS, TJN
                    </p>
                    <div className="h-4 w-px bg-white/5 hidden md:block" />
                    <p className="text-xs text-neutral-500 uppercase tracking-widest font-black leading-none flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Data Freshness Verified
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-neutral-500 uppercase font-black tracking-widest">Flight Velocity</p>
                        <p className="text-xs font-bold text-rose-400 font-mono">+18.5% YoY</p>
                    </div>
                    <div className="h-8 w-px bg-white/5" />
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group">
                        <span className="text-xs font-black text-white uppercase tracking-widest">Full report</span>
                        <ChevronRight className="w-3 h-3 text-neutral-500 group-hover:text-white transition-colors" />
                    </button>
                </div>
            </div>
        </div>
    );
};

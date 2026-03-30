import React from 'react';
import { useAIComputeEnergy } from '@/hooks/useAIComputeEnergy';
import { SPASection } from '@/components/spa/SPASection';
import { SectionHeader } from '@/components/SectionHeader';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    LineChart,
    Bar,
    BarChart,
    PieChart,
    Pie,
    Cell,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Legend
} from 'recharts';
import { Cpu, Zap, Activity, TrendingDown, Database } from 'lucide-react';
import { motion } from 'framer-motion';

export const AIComputeEnergyMonitor: React.FC = () => {
    const { data: dbData, isLoading } = useAIComputeEnergy();

    if (isLoading) {
        return (
            <div className="h-[600px] w-full bg-indigo-950/[0.02] animate-pulse rounded-3xl flex items-center justify-center">
                <span className="text-xs font-black text-indigo-400/30 uppercase tracking-uppercase">Analyzing Compute Telemetry...</span>
            </div>
        );
    }

    // Process data for charts
    const gpuPriceData = dbData?.filter(d => d.metric_id === 'H100_RENTAL_USD_HR').map(d => ({ date: d.as_of_date, price: d.value, badge: d.metadata?.badge })) || [];
    const latestGpuPrice = gpuPriceData[gpuPriceData.length - 1]?.price || 0;
    const oversupplyRisk = gpuPriceData.some(d => d.badge === 'Oversupply Risk');

    const capexData = dbData?.filter(d => d.category === 'capex' && d.metric_id.startsWith('CAPEX_'));
    // Group capex by company for a simple bar chart
    const techCapex = capexData?.map(d => ({ name: d.label, value: d.value })) || [];

    const energyData = dbData?.filter(d => d.metric_id === 'DATACENTER_ENERGY_TWH').map(d => ({ date: d.as_of_date, twh: d.value })) || [];

    // Cost curve log scale data
    const costCurveData = dbData?.filter(d => d.category === 'cost_curve').map(d => ({ date: d.as_of_date, cost: d.value, model: d.label })) || [];

    // Concentration
    const marketConcentration = dbData?.filter(d => d.category === 'market_share').map(d => ({ name: d.label, value: d.value })) || [
        { name: 'Top-3 Providers', value: 65 }, { name: 'Mid-Tier', value: 35 }
    ];
    const COLORS = ['#8b5cf6', '#06b6d4']; // Violet & Cyan

    return (
        <SPASection id="ai-compute-energy-monitor" className="py-24" disableAnimation>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                    <SectionHeader
                        title="AI Compute & Energy Capex"
                        subtitle="Tracking the 'Shale' cycle of AI: Capex exuberance, price collapse, and physical bottlenecks"
                    />

                    <div className="flex flex-wrap gap-4">
                        {oversupplyRisk && (
                            <div className="px-5 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-start gap-1">
                                <span className="text-xs font-black text-rose-500/60 uppercase tracking-uppercase">Compute Market Status</span>
                                <span className="text-xs font-black uppercase tracking-heading text-rose-500">OVERSUPPLY RISK</span>
                            </div>
                        )}
                        <div className="px-5 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-start gap-1">
                            <span className="text-xs font-black text-cyan-500/60 uppercase tracking-uppercase">Inference Deflation</span>
                            <span className="text-xs font-black uppercase tracking-heading text-cyan-400">STRUCTURAL BEAR</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Panel 1: GPU Price Trend */}
                    <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xs font-black text-indigo-400/60 uppercase tracking-uppercase">H100 Rental Price</h3>
                                <p className="text-xs text-muted-foreground/50 mt-1">Average hourly rate ($/hr)</p>
                            </div>
                            <Cpu className="text-indigo-400 opacity-50" size={20} />
                        </div>
                        <div className="text-4xl font-black text-white/90 tabular-nums mb-8">${latestGpuPrice?.toFixed(2)}</div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={gpuPriceData}>
                                    <ReferenceLine y={0.50} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Oversupply Threshold $0.50', fill: '#ef4444', fontSize: 10 }} />
                                    <Line type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3, fill: '#8b5cf6' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} itemStyle={{ color: '#c084fc' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Panel 2 & 7: Big Tech Capex vs Old Economy */}
                    <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xs font-black text-cyan-400/60 uppercase tracking-uppercase">Big Tech Capex Exuberance</h3>
                                <p className="text-xs text-muted-foreground/50 mt-1">Quarterly Capital Expenditure ($ Billions)</p>
                            </div>
                            <Activity className="text-cyan-400 opacity-50" size={20} />
                        </div>
                        <div className="h-[260px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={techCapex} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}B`} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                    <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Panel 3: Datacenter Energy */}
                    <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xs font-black text-amber-500/60 uppercase tracking-uppercase">Datacenter Energy Demand</h3>
                                <p className="text-xs text-muted-foreground/50 mt-1">Physical constraint vector (TWh)</p>
                            </div>
                            <Zap className="text-amber-500 opacity-50" size={20} />
                        </div>
                        <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={energyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickFormatter={(d) => new Date(d).getFullYear().toString()} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                    <Area type="monotone" dataKey="twh" fill="url(#energyGrad)" stroke="#f59e0b" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Panel 5: Concentration */}
                    <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col items-center justify-center hover:bg-white/[0.04] transition-all">
                        <h3 className="text-xs font-black text-white/50 uppercase tracking-uppercase mb-4 w-full text-left">Market Concentration</h3>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={marketConcentration} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {marketConcentration.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Panel 4: Cost Curve */}
                    <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xs font-black text-teal-400/60 uppercase tracking-uppercase">Inference Cost Curve</h3>
                                <p className="text-xs text-muted-foreground/50 mt-1">Cost per 1M tokens ($ Log Scale)</p>
                            </div>
                            <TrendingDown className="text-teal-400 opacity-50" size={20} />
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={costCurveData} margin={{ top: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickFormatter={(d) => new Date(d).getFullYear().toString()} axisLine={false} tickLine={false} />
                                    <YAxis scale="log" domain={['auto', 'auto']} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                    <Line type="stepAfter" dataKey="cost" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4, fill: '#0f172a', stroke: '#2dd4bf', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Panel 6: Currie Shale Analogy */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-indigo-950/40 to-cyan-950/20 shadow-inner border border-white/12 rounded-[2.5rem] p-8 overflow-hidden">
                        <div className="flex items-center gap-3 mb-8">
                            <Database className="text-indigo-400" size={20} />
                            <h3 className="text-sm font-black text-indigo-300 uppercase tracking-uppercase">The Shale Analogy Matrix</h3>
                        </div>
                        <div className="w-full">
                            <div className="grid grid-cols-2 text-xs font-bold text-muted-foreground/50 uppercase tracking-uppercase border-b border-white/12 pb-4 mb-4 gap-4">
                                <div>2014 Shale Boom Parallels</div>
                                <div>2024 AI Compute Era</div>
                            </div>
                            <div className="space-y-4 text-sm text-white/80">
                                <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Massive Capex → Rig count surge</div>
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div> Hyperscaler Capex → H100 rack delivery</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Crude price collapse '14-'16</div>
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Compute rental price & model API cost crash</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/20"></div> Pipeline / Midstream bottleneck</div>
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Power grid / Substation transformer bottleneck</div>
                                </div>
                            </div>
                            <div className="mt-8 p-4 rounded-2xl bg-black/20 border border-white/5">
                                <span className="text-xs font-medium italic text-indigo-200/60 leading-relaxed">
                                    "Prices are already falling due to rapid inference deflation and open-source models, but the grid transmission lag sustains long-run demand. Don't bet against engineers." – Jeff Currie Thesis
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </SPASection>
    );
};

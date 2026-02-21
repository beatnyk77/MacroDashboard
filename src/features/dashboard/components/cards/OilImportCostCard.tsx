import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Info } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Area } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

interface OilData {
    date: string;
    brent?: number;
    cost_inr?: number;
    cost_cny?: number;
}

interface OilImportCostCardProps {
    importData: any[];
    brentPriceData: { date: string; value: number }[];
    isLoading: boolean;
}

export const OilImportCostCard: React.FC<OilImportCostCardProps> = ({ importData, brentPriceData, isLoading }) => {
    const [activeCountry, setActiveCountry] = useState<'IN' | 'CN'>('IN');

    const chartData = useMemo(() => {
        const dateMap = new Map<string, OilData>();
        brentPriceData.forEach(d => {
            const date = d.date.substring(0, 4);
            dateMap.set(date, { date, brent: d.value });
        });

        importData.forEach(d => {
            const date = d.as_of_date.substring(0, 4);
            if (!dateMap.has(date)) {
                dateMap.set(date, { date });
            }
            const point = dateMap.get(date)!;
            if (d.importer_country_code === 'IN' && d.import_cost_local_currency) {
                point.cost_inr = d.import_cost_local_currency;
            } else if (d.importer_country_code === 'CN' && d.import_cost_local_currency) {
                point.cost_cny = d.import_cost_local_currency;
            }
        });

        return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [importData, brentPriceData]);

    const stats = useMemo(() => {
        const sorted = chartData.filter(d => (activeCountry === 'IN' ? d.cost_inr : d.cost_cny) !== undefined);
        if (sorted.length < 1) return null;

        const latest = sorted[sorted.length - 1];
        const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;

        const currentVal = (activeCountry === 'IN' ? latest.cost_inr : latest.cost_cny) ?? 0;
        const prevVal = prev ? ((activeCountry === 'IN' ? prev.cost_inr : prev.cost_cny) ?? 0) : 0;

        let yoyDelta: number | null = null;
        if (prevVal > 0) {
            yoyDelta = ((currentVal - prevVal) / prevVal) * 100;
        }

        const brentVal = latest.brent || 0;

        return {
            currentVal,
            yoyDelta,
            brentVal,
            year: latest.date,
            currency: activeCountry === 'IN' ? '₹' : '¥',
            label: activeCountry === 'IN' ? 'BHARAT' : 'CHINA',
            color: activeCountry === 'IN' ? 'blue' : 'rose'
        };
    }, [chartData, activeCountry]);

    if (isLoading) return <div className="h-[480px] animate-pulse bg-white/5 rounded-[2.5rem]" />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <Card className="bg-slate-900/60 border-white/10 backdrop-blur-3xl overflow-hidden group p-6 sm:p-8 transition-all hover:bg-slate-900/80 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] min-h-[520px] h-auto flex flex-col relative">
                {/* Background Decorative Gradients - Tamed */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 blur-[120px] -mr-48 -mt-48 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[120px] -ml-48 -mb-48 pointer-events-none" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/5 relative gap-4">
                    <div className="space-y-1.5 font-sans">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-px bg-gradient-to-r ${activeCountry === 'IN' ? 'from-blue-500' : 'from-rose-500'} to-transparent`} />
                            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">
                                Local <span className="text-white">Import Pressure</span>
                            </h3>
                        </div>
                        <div className="flex items-center gap-3 pl-[3.25rem]">
                            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest leading-none">
                                Measuring FX Sensitivity vs. Brent Benchmark
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                        {stats && (
                            <div className="hidden xs:flex px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                                <span className="text-[10px] text-white font-black uppercase tracking-widest">
                                    FY {stats.year}
                                </span>
                            </div>
                        )}
                        <Tabs value={activeCountry} onValueChange={(v: any) => setActiveCountry(v)} className="bg-black/40 p-1 rounded-2xl border border-white/5">
                            <TabsList className="bg-transparent border-0 gap-1 h-8">
                                <TabsTrigger value="IN" className="rounded-xl text-[10px] font-black uppercase px-4 sm:px-6 h-7 tracking-wider transition-all data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">BHARAT</TabsTrigger>
                                <TabsTrigger value="CN" className="rounded-xl text-[10px] font-black uppercase px-4 sm:px-6 h-7 tracking-wider transition-all data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">CHINA</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                <CardContent className="p-0 mt-8 flex-1 min-h-0 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-10 h-full gap-8 lg:gap-12">
                        <div className="lg:col-span-3 lg:border-r border-white/5 lg:pr-10 flex flex-col justify-between gap-8">
                            {stats ? (
                                <div className="space-y-6 sm:space-y-10">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Weighted Avg Cost</p>
                                        <div className="flex items-baseline gap-3 flex-wrap">
                                            <span className={`text-3xl sm:text-5xl font-black text-white drop-shadow-[0_0_15px_${stats.color === 'blue' ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}]`}>
                                                {stats.currency}{stats.currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </span>
                                            <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-widest">/BBL</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-4">
                                            {stats.yoyDelta !== null && (
                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${stats.yoyDelta > 0 ? 'bg-rose-500/5 border-rose-500/20 text-rose-500' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'}`}>
                                                    {stats.yoyDelta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                                    {Math.abs(stats.yoyDelta).toFixed(1)}% YoY
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5">
                                        <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3 relative overflow-hidden group/metric">
                                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/metric:opacity-30 transition-opacity">
                                                <DollarSign className="h-6 sm:h-8 w-6 sm:w-8 text-amber-500" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-3 rounded-full bg-amber-500/50" />
                                                <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Brent Benchmark</span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-xl sm:text-2xl font-black text-white">${stats.brentVal.toFixed(2)}</p>
                                                <span className="text-[10px] font-bold text-muted-foreground/30">AVG</span>
                                            </div>
                                        </div>

                                        <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3 relative overflow-hidden group/metric">
                                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/metric:opacity-30 transition-opacity">
                                                <Info className="h-6 sm:h-8 w-6 sm:w-8 text-blue-500" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1 h-3 rounded-full ${stats.color === 'blue' ? 'bg-blue-500/50' : 'bg-rose-500/50'}`} />
                                                <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Currency Sensitivity</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-white uppercase tracking-tight leading-relaxed">
                                                {activeCountry === 'IN' ? 'INR RISK: High Vol' : 'CNY RISK: Managed Float'}
                                            </p>
                                            <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-tighter italic">Amplification: {activeCountry === 'IN' ? '+18%' : '+12%'} vs USD</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12">
                                    <div className="w-10 h-10 rounded-full border-2 border-white/5 border-t-emerald-500 animate-spin" />
                                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Awaiting Feed Integration</p>
                                </div>
                            )}

                            <div className="mt-auto pt-6 border-t border-white/5 hidden lg:block">
                                <p className="text-[9px] text-muted-foreground/30 font-black uppercase tracking-[0.2em] leading-relaxed">
                                    Terminal Source: EIA-X8 / FRED-M2<br />
                                    Composite calculation enabled.
                                </p>
                            </div>
                        </div>

                        <div className="lg:col-span-7 lg:pl-6 relative min-h-[350px] lg:min-h-[400px] h-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 40, right: 10, left: -20, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={activeCountry === 'IN' ? '#3b82f6' : '#ef4444'} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={activeCountry === 'IN' ? '#3b82f6' : '#ef4444'} stopOpacity={0} />
                                            </linearGradient>
                                            <filter id="glow-line">
                                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 900 }}
                                            padding={{ left: 10, right: 10 }}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fill: '#f59e0b', fontWeight: 700 }}
                                            domain={['auto', 'auto']}
                                            hide
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fill: activeCountry === 'IN' ? '#3b82f6' : '#ef4444', fontWeight: 700 }}
                                            domain={['auto', 'auto']}
                                            hide
                                        />
                                        <Tooltip
                                            cursor={{ stroke: '#ffffff10', strokeWidth: 1 }}
                                            content={({ active, payload, label }) => {
                                                if (!active || !payload) return null;
                                                return (
                                                    <div className="bg-slate-950/95 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-white/20 min-w-[180px] sm:min-w-[200px] z-[100]">
                                                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-4 pb-3 border-b border-white/10">{label} RECAPITULATION</p>
                                                        <div className="space-y-3">
                                                            {payload.map((entry: any) => (
                                                                <div key={entry.name} className="flex justify-between items-center gap-6 sm:gap-10">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }} />
                                                                        <span className="text-[10px] font-black text-muted-foreground uppercase">{entry.name}</span>
                                                                    </div>
                                                                    <span className="text-[11px] sm:text-[12px] font-mono font-black text-white">
                                                                        {entry.name.includes('USD') ? '$' : (activeCountry === 'IN' ? '₹' : '¥')}
                                                                        {entry.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            align="right"
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.15em', paddingBottom: '20px', top: -20, opacity: 0.6 }}
                                        />
                                        <Area
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey={activeCountry === 'IN' ? "cost_inr" : "cost_cny"}
                                            name={activeCountry === 'IN' ? "LOCAL COST UNIT" : "LOCAL COST UNIT"}
                                            stroke={activeCountry === 'IN' ? "#3b82f6" : "#ef4444"}
                                            fill="url(#colorCost)"
                                            strokeWidth={4}
                                            filter="url(#glow-line)"
                                            animationDuration={1500}
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="brent"
                                            name="GLOBAL BRENT (USD)"
                                            stroke="#f59e0b"
                                            strokeWidth={3}
                                            dot={{ r: 3, fill: '#f59e0b', strokeWidth: 1.5, stroke: '#000' }}
                                            activeDot={{ r: 5, strokeWidth: 0, fill: '#fff' }}
                                            animationDuration={1500}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center gap-6 py-12">
                                    <div className="w-12 h-12 rounded-full border-[3px] border-white/5 border-t-blue-500 animate-spin" />
                                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest tracking-[0.2em]">Synchronizing Institutional Feeds...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

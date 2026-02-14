import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Globe, Info } from 'lucide-react';
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
        // Create a map of dates to data points
        const dateMap = new Map<string, OilData>();

        // Add Brent data
        brentPriceData.forEach(d => {
            const date = d.date.substring(0, 4); // Use year for annual data
            dateMap.set(date, { date, brent: d.value });
        });

        // Add Import Cost data
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

        const currentVal = activeCountry === 'IN' ? latest.cost_inr! : latest.cost_cny!;
        const prevVal = prev ? (activeCountry === 'IN' ? prev.cost_inr! : prev.cost_cny!) : null;

        const yoyDelta = prevVal ? ((currentVal - prevVal) / prevVal) * 100 : null;
        const brentVal = latest.brent || 0;

        return {
            currentVal,
            yoyDelta,
            brentVal,
            year: latest.date,
            currency: activeCountry === 'IN' ? '₹' : '¥'
        };
    }, [chartData, activeCountry]);

    if (isLoading) return <div className="h-[400px] animate-pulse bg-white/5 rounded-3xl" />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
        >
            <Card className="bg-black/60 border-white/5 backdrop-blur-3xl overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5 bg-white/[0.01]">
                    <div className="space-y-1">
                        <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Globe className="h-4 w-4 text-emerald-400" />
                            Oil Import Cost <span className="text-white">Local Currency</span>
                        </CardTitle>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                            Measuring Local Currency Pressure vs. Global Brent Benchmark
                        </p>
                    </div>
                    <Tabs value={activeCountry} onValueChange={(v: any) => setActiveCountry(v)} className="bg-white/5 p-1 rounded-xl border border-white/5">
                        <TabsList className="bg-transparent border-0 gap-1 h-7">
                            <TabsTrigger value="IN" className="rounded-lg text-[10px] font-black uppercase px-4 h-6 tracking-tighter">India (INR)</TabsTrigger>
                            <TabsTrigger value="CN" className="rounded-lg text-[10px] font-black uppercase px-4 h-6 tracking-tighter">China (CNY)</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[400px]">
                        {/* Summary Stats Sidebar */}
                        <div className="lg:col-span-1 border-r border-white/5 p-8 flex flex-col justify-between bg-white/[0.01]">
                            {stats ? (
                                <div className="space-y-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Weighted Avg Cost</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-white">
                                                {stats.currency}{stats.currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </span>
                                            <span className="text-[10px] font-bold text-muted-foreground">/bbl</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {stats.yoyDelta !== null && (
                                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${stats.yoyDelta > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                    {stats.yoyDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                    {Math.abs(stats.yoyDelta).toFixed(1)}% YoY
                                                </div>
                                            )}
                                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{stats.year} AVG</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-muted-foreground uppercase">USD Benchmark</span>
                                                <DollarSign className="h-3 w-3 text-amber-500" />
                                            </div>
                                            <p className="text-xl font-black text-white">${stats.brentVal.toFixed(2)}</p>
                                            <p className="text-[8px] text-muted-foreground/60 italic font-medium">Brent Crude Spot Price (Annual Avg)</p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-muted-foreground uppercase">Currency Pressure</span>
                                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                                            </div>
                                            <p className="text-sm font-bold text-white uppercase tracking-tight">
                                                {activeCountry === 'IN' ? 'INR Sensitivity: High' : 'CNY Control: Moderate'}
                                            </p>
                                            <p className="text-[8px] text-muted-foreground/60 italic font-medium">Import costs are amplified by USD strength.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <Info className="h-8 w-8 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Data Processing</p>
                                </div>
                            )}

                            <div className="mt-8 pt-8 border-t border-white/5">
                                <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-[0.2em] leading-relaxed">
                                    Data Source: EIA International Statistics & FRED Financial Data.
                                    Calculation: Brent Price × Weighted Avg Local FX.
                                </p>
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div className="lg:col-span-3 p-8 relative">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={activeCountry === 'IN' ? '#3b82f6' : '#ef4444'} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={activeCountry === 'IN' ? '#3b82f6' : '#ef4444'} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 900 }}
                                            padding={{ left: 20, right: 20 }}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fill: '#f59e0b', fontWeight: 700 }}
                                            domain={['auto', 'auto']}
                                            label={{ value: 'BRENT USD ($)', angle: -90, position: 'insideLeft', fontSize: 8, fill: '#f59e0b', fontWeight: 900, dx: -10 }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fill: activeCountry === 'IN' ? '#3b82f6' : '#ef4444', fontWeight: 700 }}
                                            domain={['auto', 'auto']}
                                            label={{ value: activeCountry === 'IN' ? 'INDIA INR (₹)' : 'CHINA CNY (¥)', angle: 90, position: 'insideRight', fontSize: 8, fill: activeCountry === 'IN' ? '#3b82f6' : '#ef4444', fontWeight: 900, dx: 10 }}
                                        />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (!active || !payload) return null;
                                                return (
                                                    <div className="bg-slate-950/90 border border-white/10 p-4 rounded-2xl backdrop-blur-xl shadow-2xl">
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 pb-2 border-b border-white/5">{label} SUMMARY</p>
                                                        <div className="space-y-2">
                                                            {payload.map((entry: any) => (
                                                                <div key={entry.name} className="flex justify-between items-center gap-8">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{entry.name}</span>
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-white">
                                                                        {entry.name.includes('USD') ? '$' : (activeCountry === 'IN' ? '₹' : '¥')}
                                                                        {entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
                                            align="left"
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: '20px' }}
                                        />
                                        <Area
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey={activeCountry === 'IN' ? "cost_inr" : "cost_cny"}
                                            name={activeCountry === 'IN' ? "Import Cost (INR)" : "Import Cost (CNY)"}
                                            stroke={activeCountry === 'IN' ? "#3b82f6" : "#ef4444"}
                                            fill="url(#colorCost)"
                                            strokeWidth={3}
                                            animationDuration={1500}
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="brent"
                                            name="Brent USD"
                                            stroke="#f59e0b"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#000' }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                            animationDuration={1500}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-muted-foreground">
                                    <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                                    <div className="space-y-1">
                                        <p className="italic font-medium">Synchronizing Institutional Price Feeds...</p>
                                        <p className="text-[10px] uppercase tracking-widest font-black opacity-50">High-Fidelity Upstream Mapping Active</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

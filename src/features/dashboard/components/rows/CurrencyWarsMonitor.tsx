import React, { useMemo, useState } from 'react';
import { useCurrencyWars, CurrencyWarsData } from '@/hooks/useCurrencyWars';
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
    Legend,
    ReferenceLine
} from 'recharts';
import { AlertCircle, Zap, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            <div className="h-[500px] w-full bg-white/[0.02] animate-pulse rounded-3xl flex items-center justify-center">
                <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-uppercase">Mapping Divergence...</span>
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
                <div className="lg:col-span-3 bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative group">
                    <div className="absolute top-8 right-8 z-10 flex gap-2">
                        <ZoomButton active={zoom === '5Y'} onClick={() => setZoom('5Y')} label="5Y" />
                        <ZoomButton active={zoom === '25Y'} onClick={() => setZoom('25Y')} label="25Y" />
                    </div>

                    <div className="h-[450px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={filteredData} margin={{ top: 20, right: 60, left: 40, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                                    minTickGap={50}
                                    tickFormatter={(str) => new Date(str).getFullYear().toString()}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                                    unit="%"
                                    label={{ value: 'POLICY RATES', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.2)', fontSize: 8, offset: -20, fontWeight: 900 }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                                    domain={['auto', 'auto']}
                                    label={{ value: 'USD/INR SPOT', angle: 90, position: 'insideRight', fill: 'rgba(255,255,255,0.2)', fontSize: 8, offset: -20, fontWeight: 900 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="top"
                                    align="left"
                                    iconType="circle"
                                    wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                />

                                {EVENTS.map(event => (
                                    <ReferenceLine
                                        key={event.date}
                                        x={event.date}
                                        yAxisId="left"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeDasharray="3 3"
                                        label={{ value: event.label, position: 'top', fill: 'rgba(255,255,255,0.2)', fontSize: 8 }}
                                    />
                                ))}

                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="fed_rate"
                                    name="Fed Funds"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="rbi_rate"
                                    name="RBI Repo"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="usd_inr"
                                    name="USD/INR"
                                    stroke="#ffffff"
                                    strokeWidth={3}
                                    dot={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
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
    <div className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4 hover:bg-white/[0.05] transition-all">
        <div className="p-2 rounded-xl bg-white/[0.03]">{icon}</div>
        <div>
            <div className="text-xs font-bold text-muted-foreground/40 uppercase tracking-uppercase mb-1">{label}</div>
            <div className="text-lg font-black tabular-nums text-white/90 leading-none">{value}</div>
            <div className="text-xs text-muted-foreground/30 mt-1">{sub}</div>
        </div>
    </div>
);

const InsightCard = ({ title, description, value, unit = '', trend }: { title: string; description: string; value: number | undefined; unit?: string; trend: 'critical' | 'high' | 'stable' | 'normal' }) => (
    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/12 transition-all flex flex-col justify-between">
        <div>
            <div className="text-xs font-black uppercase tracking-uppercase text-muted-foreground/40 mb-4">{title}</div>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">{description}</p>
        </div>
        <div className="mt-6 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white/90">{value?.toFixed(1)}{unit}</span>
            <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-uppercase",
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
            "px-3 py-1 rounded-lg text-xs font-black uppercase tracking-uppercase transition-all",
            active ? "bg-white text-black" : "bg-white/[0.05] text-muted-foreground/40 hover:bg-white/[0.1]"
        )}
    >
        {label}
    </button>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background-dashboard/90 backdrop-blur-md border border-white/12 p-4 rounded-xl shadow-2xl">
                <div className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase mb-3">
                    {new Date(label).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
                <div className="space-y-2">
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs font-bold text-muted-foreground/80">{entry.name}</span>
                            </div>
                            <span className="text-xs font-black tabular-nums">{entry.value.toFixed(2)}{entry.name.includes('Rate') || entry.name.includes('Fed') || entry.name.includes('RBI') ? '%' : ''}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

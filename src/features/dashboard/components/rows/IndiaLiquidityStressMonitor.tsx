import React, { useMemo } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { Activity, AlertTriangle, Zap, Info, TrendingUp, ArrowRight } from 'lucide-react';
import { useIndiaLiquidity, type IndiaLiquidityData } from '@/hooks/useIndiaLiquidity';
import { DataStatePanel } from '@/components/DataStatePanel';

type LiveLiquidityData = IndiaLiquidityData & {
    laf_net_injection_cr: number;
    call_rate: number;
    msf_rate: number;
};

export const IndiaLiquidityStressMonitor: React.FC = () => {
    const { data: rawData, loading } = useIndiaLiquidity();

    const chartData = useMemo(() => {
        if (!rawData) return [];
        const validData = rawData.filter((d): d is LiveLiquidityData => d.laf_net_injection_cr != null && d.call_rate != null && d.msf_rate != null);
        return validData.map(d => ({
            ...d,
            formattedDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            // Net LAF in ₹ Trillion for better readability in chart
            laf_net_trillion: d.laf_net_injection_cr / 100000,
            // Stress spread: Call vs MSF
            stress_spread: d.call_rate - d.msf_rate
        }));
    }, [rawData]);

    const latest = useMemo(() => chartData[chartData.length - 1], [chartData]);
    const previous = useMemo(() => chartData[chartData.length - 2], [chartData]);

    if (loading) {
        return <div className="h-96 w-full bg-card border border-border rounded-3xl animate-pulse" />;
    }

    if (!latest) {
        return <DataStatePanel variant="empty" title="India liquidity data unavailable" description="The module requires current call-rate, MSF, and LAF observations." height={300} />;
    }

    const isStressActive = latest.call_rate > latest.msf_rate;
    const wacrDelta = previous ? latest.call_rate - previous.call_rate : null;
    const lafStatus = latest.laf_net_injection_cr > 0 ? 'DEFICIT' : 'SURPLUS';

    return (
        <section className="w-full bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm font-sans relative group text-card-foreground">
            {/* Header Area */}
            <div className="p-8 pb-6 border-b border-border bg-muted/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="flex h-2 w-2 relative">
                                <span className={`animate-ping absolute inline-flex h-2 w-2 rounded-full ${isStressActive ? 'bg-rose-500' : 'bg-cyan-500'} opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isStressActive ? 'bg-rose-500' : 'bg-cyan-500'}`}></span>
                            </span>
                            <span className={`${isStressActive ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'} text-xs font-black uppercase tracking-uppercase`}>Real-time Stress Gauge</span>
                            <span className="text-muted-foreground text-xs font-black uppercase tracking-uppercase ml-2 border-l border-border pl-2">Source: RBI DBIE / CCIL</span>
                        </div>
                        <h2 className="text-3xl font-black text-foreground tracking-heading leading-none">
                            India Funding Stress & Liquidity
                        </h2>
                    </div>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border border-b border-border bg-muted/40">
                <MetricCard
                    title="Latest WACR"
                    value={`${latest.call_rate.toFixed(2)}%`}
                    delta={wacrDelta != null ? `${wacrDelta > 0 ? '+' : ''}${(wacrDelta * 100).toFixed(0)} bps` : undefined}
                    trend={wacrDelta != null ? (wacrDelta > 0 ? 'up' : 'down') : undefined}
                    icon={<Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />}
                    colorClass="text-cyan-700 dark:text-cyan-400"
                />
                <MetricCard
                    title="MSF Spread (Breach)"
                    value={`${(latest.stress_spread * 100).toFixed(0)} bps`}
                    subtext={isStressActive ? 'OUTSIDE CORRIDOR' : 'WITHIN CORRIDOR'}
                    icon={<Zap className={`w-5 h-5 ${isStressActive ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'}`} />}
                    colorClass={isStressActive ? "text-amber-600 dark:text-amber-400" : "text-foreground"}
                />
                <MetricCard
                    title="Net LAF Position"
                    value={`₹${Math.abs(latest.laf_net_injection_cr / 1000).toFixed(0)}B`}
                    subtext={lafStatus}
                    icon={<TrendingUp className={`w-5 h-5 ${latest.laf_net_injection_cr > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`} />}
                    colorClass={latest.laf_net_injection_cr > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}
                />

                {/* Alpha Signal Panel */}
                <div className={`p-6 flex flex-col justify-center transition-all duration-500 ${isStressActive ? 'bg-rose-500/10' : 'bg-transparent'}`}>
                    {isStressActive ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="w-5 h-5 animate-bounce" />
                                <span className="text-sm font-black uppercase tracking-uppercase">Stress Detected</span>
                            </div>
                            <p className="text-xs text-rose-700 dark:text-rose-300 font-medium leading-tight">
                                WACR {'>'} MSF Rate: Acute institutional funding deficit active. Leading indicator for volatility.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <Zap className="w-5 h-5" />
                                <span className="text-sm font-black uppercase tracking-uppercase">Liquidity Normal</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium leading-tight">
                                Rates anchored within corridor. No systemic funding stress detected.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                {/* Left: Net Liquidity Chart */}
                <div className="p-8 relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-uppercase flex items-center gap-2">
                                Systemic Liquidity <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </h3>
                            <p className="text-xs text-muted-foreground font-bold">RBI Net LAF Injection (₹ Trillion)</p>
                        </div>
                    </div>

                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.5} vertical={false} />
                                <XAxis
                                    dataKey="formattedDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                                    className="text-muted-foreground"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                                    className="text-muted-foreground"
                                    tickFormatter={(val) => `₹${val}T`}
                                />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <ReferenceLine y={0} stroke="currentColor" className="text-border" strokeWidth={1} />
                                <Bar
                                    dataKey="laf_net_trillion"
                                    name="Net LAF"
                                    radius={[4, 4, 0, 0]}
                                    shape={(props: any) => {
                                        const { x, y, width, height, payload } = props;
                                        // Deficit (Positive) = Orange, Surplus (Negative) = Cyan
                                        const fill = payload.laf_net_trillion > 0 ? '#d97706' : '#0891b2';
                                        return <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} ry={2} opacity={0.8} />;
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Policy Corridor Chart */}
                <div className="p-8 relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-uppercase flex items-center gap-2">
                                Money Market Pressure <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </h3>
                            <p className="text-xs text-muted-foreground font-bold">WACR/TREPS vs. Policy Corridor (%)</p>
                        </div>
                    </div>

                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.5} vertical={false} />
                                <XAxis
                                    dataKey="formattedDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                                    className="text-muted-foreground"
                                />
                                <YAxis
                                    domain={['auto', 'auto']}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                                    className="text-muted-foreground"
                                    tickFormatter={(val) => `${val}%`}
                                />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }} className="text-muted-foreground" />

                                {/* Policy Corridor Bands */}
                                <Line type="stepAfter" dataKey="msf_rate" name="MSF (Cap)" stroke="#64748b" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                                <Line type="stepAfter" dataKey="repo_rate" name="Repo" stroke="currentColor" className="text-foreground/30" strokeWidth={1} dot={false} />

                                {/* Market Rates */}
                                <Line
                                    type="monotone"
                                    dataKey="call_rate"
                                    name="WACR"
                                    stroke="#db2777"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 0, fill: '#db2777' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="treps_rate"
                                    name="TREPS"
                                    stroke="#0284c7"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Analyst Insight Footer */}
            <div className="p-8 bg-muted/20 border-t border-border flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="text-xs font-black text-foreground uppercase tracking-uppercase">Structural Insight</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                        {isStressActive
                            ? "Banking system is running a structural deficit. Consistent MSF breaches indicate that repo injections are insufficient to cover currency leakage or tax outflows. Expect upside volatility in NSE indices."
                            : "Liquidity remains broadly balanced. Systemic rates are anchored within the collateralized repo corridor, suggesting supportive conditions for credit growth and equity positioning."}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">Breach Intensity</div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className={`h-1.5 w-8 rounded-full transition-all duration-1000 ${isStressActive && i <= Math.ceil(latest.stress_spread * 20)
                                    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                    : 'bg-muted'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

// Internal charts to avoid full export of chart components
const BarChart = ComposedChart;

const MetricCard = ({ title, value, delta, subtext, icon, colorClass, trend }: any) => (
    <div className="p-6 bg-transparent hover:bg-muted/30 transition-colors group">
        <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-uppercase group-hover:text-foreground transition-colors tracking-uppercase">{title}</span>
            <div className="p-1.5 rounded-lg bg-muted border border-border">
                {icon}
            </div>
        </div>
        <div className="flex items-end gap-2">
            <span className={`text-3xl font-black tracking-heading leading-none ${colorClass}`}>{value}</span>
            {delta && (
                <span className={`flex items-center text-xs font-black mb-1 px-1.5 py-0.5 rounded-md border ${trend === 'up' ? 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-rose-700 dark:text-rose-400 border-rose-500/20 bg-rose-500/10'}`}>
                    {delta}
                </span>
            )}
        </div>
        {subtext && (
            <div className={`mt-2 text-xs font-black tracking-uppercase uppercase ${subtext.includes('DEFICIT') || subtext.includes('OUTSIDE') ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'}`}>{subtext}</div>
        )}
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover/95 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl z-50 min-w-[200px] text-popover-foreground">
                <div className="text-xs font-black text-muted-foreground uppercase tracking-uppercase mb-3 border-b border-border pb-2">
                    {label}
                </div>
                <div className="space-y-2">
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-heading">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                {entry.name}
                            </span>
                            <span className="text-foreground font-mono font-black text-xs">
                                {entry.name.includes('LAF') ? `₹${entry.value.toFixed(2)}T` : `${entry.value.toFixed(2)}%`}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

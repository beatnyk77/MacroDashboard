import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine
} from 'recharts';
import { useNetLiquidityHistory } from '@/hooks/useNetLiquidityHistory';
import { Info, Zap, BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-slate-950/95 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
            <p className="text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-3">
                {new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
            <div className="space-y-2.5">
                {payload.map((entry: any) => (
                    <div key={entry.name} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[0.7rem] font-bold text-white/80 tracking-tight">{entry.name}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-[0.7rem] font-black text-white">
                                ${entry.value.toFixed(2)}T
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const GlobalNetLiquidityHistoricalChart: React.FC = () => {
    const { data: history } = useNetLiquidityHistory();

    const chartData = useMemo(() => {
        if (!history || history.length === 0) return [];

        // Calculate 3-year (156 weeks approx, using 1300 records for 25 years implies roughly weekly)
        // Let's use a windows of 150 points for the "trend"
        const windowSize = 150;

        return history.map((point, index) => {
            const start = Math.max(0, index - windowSize);
            const slice = history.slice(start, index + 1);
            const sum = slice.reduce((acc, p) => acc + p.value, 0);
            const trend = sum / slice.length;

            return {
                ...point,
                trend: trend
            };
        });
    }, [history]);

    if (!history) {
        return <Skeleton className="h-[600px] w-full rounded-[2.5rem] bg-white/5" />;
    }

    const latest = history[history.length - 1];

    return (
        <Card className="p-8 bg-black/40 backdrop-blur-3xl border-white/5 shadow-2xl overflow-hidden rounded-[2.5rem] relative group">
            {/* Ambient Background Radial */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:bg-blue-500/10 transition-colors duration-1000" />

            <div className="relative z-10 space-y-8">
                {/* Header Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-inner">
                                <BarChart3 className="text-blue-400 w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                                Global <span className="text-blue-500">Net Liquidity</span> 25Y Context
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                            Tracking the "spendable" liquidity provided by the Federal Reserve since 2002.
                            This metric represents the actual oxygen in the financial system after accounting for government cash and repo drains.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest">Current Outstanding</span>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="text-4xl font-black text-white tracking-tighter tabular-nums">
                            ${latest?.value.toFixed(2)}<span className="text-xl text-muted-foreground/60 ml-1">T</span>
                        </div>
                        <div className="text-[0.65rem] text-muted-foreground/60 font-medium mt-1 uppercase italic">
                            As of {latest ? new Date(latest.date).toLocaleDateString() : '--'}
                        </div>
                    </div>
                </div>

                {/* Main Chart Area */}
                <div className="h-[600px] w-full relative">
                    <div className="absolute inset-0 bg-white/[0.01] rounded-[2.5rem] -m-4 border border-white/[0.02]" />

                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="rgba(255,255,255,0.15)"
                                fontSize={11}
                                tickFormatter={(v) => new Date(v).getFullYear().toString()}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontWeight: 900 }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                                interval={window.innerWidth < 768 ? 150 : 80}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.15)"
                                fontSize={11}
                                tickFormatter={(v) => `$${v}T`}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontWeight: 900 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />

                            {/* Current Value Highlight */}
                            {latest && (
                                <ReferenceLine
                                    y={latest.value}
                                    stroke="#3b82f6"
                                    strokeDasharray="3 3"
                                    label={{
                                        position: 'right',
                                        value: 'Current',
                                        fill: '#3b82f6',
                                        fontSize: 10,
                                        fontWeight: 900,
                                        className: 'uppercase'
                                    }}
                                />
                            )}

                            <Area
                                type="monotone"
                                dataKey="value"
                                name="Net Liquidity"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#liquidityGradient)"
                                animationDuration={2500}
                            />

                            <Area
                                type="monotone"
                                dataKey="trend"
                                name="3Y Moving Trend"
                                stroke="#fbbf24"
                                strokeWidth={2.5}
                                strokeDasharray="8 4"
                                fill="transparent"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Analysis Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Info className="text-blue-400 w-4 h-4" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Why It Matters</h3>
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Global Net Liquidity represents the actual "spendable" money in the financial system.
                                While the Fed's Balance Sheet (WALCL) shows total assets, it does not account for money locked in the
                                <span className="text-white font-bold"> Treasury General Account (TGA)</span> or drained via the
                                <span className="text-white font-bold"> Reverse Repo Facility (RRP)</span>.
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                High liquidity levels correlate strongly with <span className="text-blue-400 font-bold uppercase">Risk-On</span> environments,
                                acting as a primary driver for Equities, Bitcoin, and Hard Assets.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Zap className="text-amber-400 w-4 h-4" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Historical Interpretation</h3>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Institutional Formula:</span>
                                <span className="text-white font-mono font-bold">Fed Assets - TGA - RRP</span>
                            </div>
                            <div className="h-px bg-white/5" />
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <p className="text-[0.7rem] text-muted-foreground">
                                        <span className="text-white font-bold">Expansion Stage:</span> When Net Liquidity rises above its 3Y trend, risk assets typically find floor support.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <p className="text-[0.7rem] text-muted-foreground">
                                        <span className="text-white font-bold">Drain Stage:</span> Falling liquidity (QT or TGA builds) leads to volatility and valuation compression.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="flex justify-between items-center text-[0.6rem] text-muted-foreground/30 uppercase font-bold tracking-tighter">
                    <div>Data Source: Federal Reserve Board, US Treasury (Daily Feed)</div>
                    <div className="italic">Standardized for Trillions USD</div>
                </div>
            </div>
        </Card>
    );
};

import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import {
    ResponsiveContainer,
    Area,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ComposedChart,
    Line,
    CartesianGrid
} from 'recharts';
import { useTreasuryHedging, TreasuryHedgingData } from '@/hooks/useTreasuryHedging';
import { cn } from '@/lib/utils';
import {
    ShieldCheck,
    Activity,
    Zap,
    BarChart3,
    Compass
} from 'lucide-react';

const MetricGauge: React.FC<{
    label: string;
    value: number;
    unit: string;
    min: number;
    max: number;
    color: string;
}> = ({ label, value, unit, min, max, color }) => {
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

    return (
        <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
            <div className="flex justify-between items-start">
                <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-widest">{label}</span>
                <Zap className="w-3 h-3 text-white/10 group-hover:text-white/30 transition-colors" />
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{value.toFixed(2)}</span>
                <span className="text-[0.6rem] font-bold text-white/20 uppercase">{unit}</span>
            </div>
            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 transition-all duration-1000"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                />
            </div>
            <div className="flex justify-between text-[0.5rem] font-black text-white/10 uppercase tracking-tighter">
                <span>{min}{unit}</span>
                <span>{max}{unit}</span>
            </div>
        </div>
    );
};

export const CorporateTreasuryHedgingSection: React.FC = () => {
    const { data } = useTreasuryHedging();

    const metrics = useMemo(() => {
        if (!data) return {};
        return data.reduce((acc, m) => {
            acc[m.metric_id] = m;
            return acc;
        }, {} as Record<string, TreasuryHedgingData>);
    }, [data]);

    // Combine 2Y and 10Y for dual axis chart
    const yieldCurveData = useMemo(() => {
        const us10y = metrics['US_10Y_YIELD'];
        const us2y = metrics['US_2Y_YIELD'];
        if (!us10y || !us2y) return [];
        const combined = [];
        const length = Math.min(us10y.history.length, us2y.history.length);
        for (let i = 0; i < length; i++) {
            combined.push({
                date: us10y.history[i].date,
                y10: us10y.history[i].value,
                y2: us2y.history[i].value,
                spread: us10y.history[i].value - us2y.history[i].value
            });
        }
        return combined;
    }, [metrics]);

    if (!data) return null;

    const sofr = metrics['SOFR_RATE'];
    const us10y = metrics['US_10Y_YIELD'];
    const us2y = metrics['US_2Y_YIELD'];
    const oil = metrics['WTI_OIL_PRICE'];
    const usdinr = metrics['USD_INR_SPOT'];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">
                            Corporate <span className="text-emerald-500">Treasury Hedging</span> Monitor
                        </h2>
                        <p className="text-[0.65rem] text-muted-foreground/60 font-bold uppercase tracking-[0.2em] mt-0.5">
                            Macro-driven exposure & mitigation intelligence
                        </p>
                    </div>
                </div>
                <div className="hidden md:flex gap-4">
                    <div className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-right">
                        <div className="text-[0.5rem] font-black text-muted-foreground/40 uppercase tracking-widest">Hedge Sentiment</div>
                        <div className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Opportunity High</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricGauge
                    label="SOFR (Floating Base)"
                    value={sofr?.current_value || 0}
                    unit="%"
                    min={0}
                    max={6}
                    color="#10b981"
                />
                <MetricGauge
                    label="USD/INR Spot"
                    value={usdinr?.current_value || 0}
                    unit=""
                    min={80}
                    max={100}
                    color="#3b82f6"
                />
                <MetricGauge
                    label="WTI Oil (Supply Chain Risk)"
                    value={oil?.current_value || 0}
                    unit="$/b"
                    min={40}
                    max={120}
                    color="#f59e0b"
                />
                <MetricGauge
                    label="Term Premium (10Y-2Y)"
                    value={(us10y?.current_value || 0) - (us2y?.current_value || 0)}
                    unit="%"
                    min={-1}
                    max={2}
                    color="#8b5cf6"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Yield Curve Context */}
                <Card className="lg:col-span-2 p-8 bg-black/40 backdrop-blur-3xl border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-emerald-500/10 transition-colors" />

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Compass className="w-4 h-4 text-emerald-500" />
                            <h4 className="text-[0.7rem] font-black text-white/90 uppercase tracking-[0.3em]">Interest Rate Transition Curve</h4>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={yieldCurveData}>
                                    <defs>
                                        <linearGradient id="colorY10" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        hide
                                    />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        stroke="#ffffff20"
                                        fontSize={10}
                                        tickFormatter={(v) => `${v}%`}
                                        orientation="left"
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="y10"
                                        stroke="#10b981"
                                        fillOpacity={1}
                                        fill="url(#colorY10)"
                                        name="10Y Yield"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="y2"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={false}
                                        name="2Y Yield"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex gap-6 mt-4 opacity-50 text-[0.6rem] font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>10Y Bench</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>2Y Hedge Baseline</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Exposure Sensitivity Heatmap */}
                <Card className="p-8 bg-black/40 backdrop-blur-3xl border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-4 h-4 text-emerald-500" />
                            <h4 className="text-[0.7rem] font-black text-white/90 uppercase tracking-[0.3em]">Hedge Effectiveness Heatmap</h4>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { l: 'SOFR +10bp', v: '-0.42%', c: 'bg-rose-500/20' },
                                { l: 'INR -1%', v: '+0.85%', c: 'bg-emerald-500/20' },
                                { l: 'Oil +$10', v: '-1.20%', c: 'bg-rose-900/40' },
                                { l: '10Y -5bp', v: '+0.15%', c: 'bg-emerald-500/10' },
                                { l: 'INR +2%', v: '-1.45%', c: 'bg-rose-500/40' },
                                { l: 'SOFR -25bp', v: '+1.10%', c: 'bg-emerald-500/40' },
                                { l: 'Oil -$5', v: '+0.40%', c: 'bg-emerald-500/10' },
                                { l: 'Spread Comp', v: '-0.30%', c: 'bg-white/5' },
                                { l: 'Roll Yield', v: '+0.65%', c: 'bg-emerald-500/20' },
                            ].map((item, i) => (
                                <div key={i} className={cn("p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1", item.c)}>
                                    <span className="text-[0.45rem] font-bold text-white/40 uppercase text-center leading-tight">{item.l}</span>
                                    <span className="text-[0.7rem] font-black text-white">{item.v}</span>
                                </div>
                            ))}
                        </div>

                        <p className="text-[0.55rem] text-muted-foreground/40 font-bold uppercase leading-relaxed italic">
                            * Estimated impact on unhedged interest/FX expense based on historical volatility.
                        </p>
                    </div>
                </Card>
            </div>

            {/* Regulatory & Institutional Context */}
            <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-4">
                <Activity className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
                <div className="space-y-1">
                    <span className="text-[0.7rem] font-black text-emerald-400 uppercase tracking-widest">Treasurer's Perspective:</span>
                    <p className="text-[0.6rem] text-muted-foreground/70 leading-relaxed font-medium">
                        Current SOFR-Oil correlation levels indicate heightened supply-chain driven inflation risk. Hedging costs for USD/INR remain in the 45th percentile, suggesting neutral forward positioning. Monitor 2Y-10Y spread for transition into 'Higher for Longer' regime stability.
                    </p>
                </div>
            </div>
        </div>
    );
};

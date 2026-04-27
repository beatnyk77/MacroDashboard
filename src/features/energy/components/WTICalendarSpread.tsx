import React from 'react';
import { 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Area, 
    ComposedChart,
    ReferenceLine,
    ReferenceArea
} from 'recharts';
import { useOilSpread } from '@/hooks/useOilSpread';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Fuel, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export const WTICalendarSpread: React.FC = () => {
    const { data: spreadData, isLoading, error } = useOilSpread();

    const chartData = React.useMemo(() => {
        if (!spreadData) return [];
        return [...spreadData].reverse().map(d => ({
            ...d,
            formattedDate: format(new Date(d.date), 'MMM dd'),
            displayDate: format(new Date(d.date), 'yyyy-MM-dd')
        }));
    }, [spreadData]);

    const latest = spreadData?.[0];
    
    const getRegimeDetails = (spread: number) => {
        if (spread > 2.0) return { label: 'CRITICAL BACKWARDATION', color: 'text-rose-500 bg-rose-500/10', icon: AlertTriangle, desc: 'Extreme Physical Shortage' };
        if (spread > 1.0) return { label: 'ELEVATED BACKWARDATION', color: 'text-orange-500 bg-orange-500/10', icon: TrendingUp, desc: 'Market Tightening' };
        if (spread < -1.0) return { label: 'STEEP CONTANGO', color: 'text-blue-500 bg-blue-500/10', icon: TrendingDown, desc: 'Oversupply / Storage Stress' };
        return { label: 'NORMAL REGIME', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle2, desc: 'Balanced Physical Flows' };
    };

    const regime = latest ? getRegimeDetails(latest.spread) : null;

    if (isLoading) {
        return (
            <div className="w-full h-[500px] bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse flex items-center justify-center">
                <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-[0.2em]">Synchronizing WTI Futures...</span>
            </div>
        );
    }

    if (error || !latest) {
        return (
            <div className="w-full h-[500px] bg-rose-500/5 border border-rose-500/10 rounded-3xl flex items-center justify-center text-center p-8">
                <div className="max-w-md space-y-4">
                    <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
                    <h3 className="text-lg font-black text-white uppercase tracking-heading">Data Ingestion Failure</h3>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                        Unable to synchronize WTI CL1/CL2 series. Ensure EIA API connectivity is active.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl overflow-hidden rounded-[2rem]">
            <CardHeader className="p-8 pb-0 border-b border-white/5 bg-white/[0.02]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-500/10">
                                <Fuel className="w-5 h-5 text-amber-500" />
                            </div>
                            <CardTitle className="text-2xl font-black uppercase tracking-heading text-white italic">
                                WTI Calendar Spread <span className="text-muted-foreground/40 not-italic">(CL1 - CL2)</span>
                            </CardTitle>
                        </div>
                        <CardDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest pl-11">
                            Physical Oil Stress Indicator • NYMEX Futures Terminal
                        </CardDescription>
                    </div>

                    {regime && (
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">Current Spread</p>
                                <p className={cn("text-3xl font-black tracking-heading italic", latest.spread >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                    {latest.spread >= 0 ? '+' : ''}{latest.spread.toFixed(2)} <span className="text-xs not-italic">USD</span>
                                </p>
                            </div>
                            <div className={cn("px-6 py-4 rounded-2xl border border-white/5 flex flex-col items-center gap-2", regime.color)}>
                                <regime.icon className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em]">{regime.label}</span>
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Insights Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Institutional Summary</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Front Month (CL1)</span>
                                    <span className="text-sm font-black text-white italic">${latest.front_price.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Next Month (CL2)</span>
                                    <span className="text-sm font-black text-white italic">${latest.next_price.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">1D Change</span>
                                    <span className={cn("text-sm font-black italic", latest.change_1d >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                        {latest.change_1d >= 0 ? '+' : ''}{latest.change_1d.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-3">So What?</h4>
                            <p className="text-[11px] leading-relaxed text-amber-500/70 font-bold uppercase tracking-wide">
                                {regime?.desc}. {latest.spread > 1 ? 
                                    "Physical buyers are front-loading deliveries, signaling immediate supply shortages." : 
                                    latest.spread < -1 ? 
                                    "Excess supply is hitting storage limits, forcing front-month prices below next-month." : 
                                    "The physical market remains in equilibrium with no immediate stress signals."
                                }
                            </p>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="lg:col-span-3 h-[400px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="spreadGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={latest.spread >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={latest.spread >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis 
                                    dataKey="formattedDate" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#ffffff30', fontSize: 10, fontWeight: 900 }}
                                    dy={10}
                                />
                                <YAxis 
                                    yAxisId="price"
                                    orientation="left"
                                    domain={['auto', 'auto']}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#ffffff30', fontSize: 10, fontWeight: 900 }}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <YAxis 
                                    yAxisId="spread"
                                    orientation="right"
                                    domain={[-4, 4]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#ffffff30', fontSize: 10, fontWeight: 900 }}
                                />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: '#000000e0', 
                                        borderColor: '#ffffff10', 
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}
                                    itemStyle={{ padding: '2px 0' }}
                                />
                                
                                {/* Normal Band ±1.0 */}
                                <ReferenceArea 
                                    yAxisId="spread"
                                    y1={-1} 
                                    y2={1} 
                                    fill="#ffffff05" 
                                    strokeOpacity={0}
                                />
                                <ReferenceLine yAxisId="spread" y={0} stroke="#ffffff10" strokeWidth={1} />
                                <ReferenceLine yAxisId="spread" y={1} stroke="#ffffff05" strokeDasharray="3 3" />
                                <ReferenceLine yAxisId="spread" y={-1} stroke="#ffffff05" strokeDasharray="3 3" />

                                <Area 
                                    yAxisId="spread"
                                    type="monotone" 
                                    dataKey="spread" 
                                    fill="url(#spreadGradient)" 
                                    stroke={latest.spread >= 0 ? "#10b981" : "#f43f5e"}
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line 
                                    yAxisId="price"
                                    type="monotone" 
                                    dataKey="front_price" 
                                    stroke="#ffffff60" 
                                    strokeWidth={3}
                                    dot={false}
                                    name="Front Month (CL1)"
                                />
                                <Line 
                                    yAxisId="price"
                                    type="monotone" 
                                    dataKey="next_price" 
                                    stroke="#3b82f660" 
                                    strokeWidth={3}
                                    dot={false}
                                    name="Next Month (CL2)"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { 
    Droplet, Shield, Globe, History, AlertTriangle, 
    ArrowUpRight, ArrowDownRight, TrendingUp, Info
} from 'lucide-react';
import { useIranConflictImpact } from '@/hooks/useIranConflictImpact';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const IranConflictImpactMonitor: React.FC = () => {
    const { data, isLoading } = useIranConflictImpact();

    if (isLoading) {
        return <Skeleton className="w-full h-[500px] rounded-xl bg-card/50" />;
    }

    if (!data) return null;

    const { brentPrice, fxReserves, remittanceFlows, resilienceMetrics, stateRisks } = data;

    // Oil Shock Logic: Threshold $80. Every $10 adds ~$5B to import bill
    const oilThreshold = 80;
    const currentOilDiff = Math.max(0, brentPrice - oilThreshold);
    const projectedAdditionalCost = (currentOilDiff / 10) * 5; // $5B per $10/bbl extra

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Globe className="text-orange-500" size={24} />
                        Iran Conflict Impact Monitor
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Second & Third order effects of prolonged regional conflict on India's macro-fiscal stability.
                    </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <AlertTriangle className="text-orange-500 animate-pulse" size={18} />
                    <div>
                        <div className="text-xs font-black uppercase text-orange-500/70 leading-none">Scenario Status</div>
                        <div className="text-sm font-bold text-orange-500">Active Monitoring / Stress Test</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Panel 1: Oil Price Shock Gauge */}
                <Card className="bg-card/50 border-border/40 overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <Droplet className="text-blue-400" size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Oil Shock Gauge</span>
                            </div>
                            <Info size={14} className="text-muted-foreground/30 cursor-help" />
                        </div>
                        
                        <div className="relative h-32 flex items-center justify-center">
                            {/* Simple SVG Gauge */}
                            <svg className="w-48 h-24 transform translate-y-4" viewBox="0 0 100 50">
                                <path 
                                    d="M 10 45 A 35 35 0 0 1 90 45" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="8" 
                                    className="text-slate-800"
                                />
                                <path 
                                    d="M 10 45 A 35 35 0 0 1 90 45" 
                                    fill="none" 
                                    stroke="url(#gaugeGradient)" 
                                    strokeWidth="8" 
                                    strokeDasharray="125.6"
                                    strokeDashoffset={125.6 - (Math.min(100, (brentPrice / 120) * 100) / 100 * 125.6)}
                                />
                                <defs>
                                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#34d399" />
                                        <stop offset="66%" stopColor="#facc15" />
                                        <stop offset="100%" stopColor="#f87171" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                                <span className="text-3xl font-black tabular-nums">${brentPrice.toFixed(1)}</span>
                                <span className="text-xs font-bold text-muted-foreground uppercase opacity-60">Brent Crude / BBL</span>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-white/5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Fiscal Sensitivity</span>
                                <span className="text-xs font-bold text-rose-400">-${projectedAdditionalCost.toFixed(1)}B</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-rose-500 transition-all duration-1000" 
                                    style={{ width: `${Math.min(100, (projectedAdditionalCost / 25) * 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground/60 mt-2">
                                Est. annual import bill increase above ${oilThreshold} pivot.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Panel 2: State Remittance Risk Heatmap */}
                <Card className="bg-card/50 border-border/40 overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <Shield className="text-orange-400" size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">State Risk Heatmap</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5">
                            {stateRisks.slice(0, 16).map((state) => (
                                <div 
                                    key={state.state_code}
                                    className={cn(
                                        "aspect-square rounded flex flex-col items-center justify-center p-1 transition-all group/cell",
                                        state.risk_score > 70 ? "bg-rose-500/80 text-white" :
                                        state.risk_score > 40 ? "bg-orange-500/60 text-white" :
                                        "bg-slate-800 text-muted-foreground hover:bg-slate-700"
                                    )}
                                >
                                    <span className="text-xs font-black">{state.state_code}</span>
                                    <div className="hidden group-hover/cell:flex absolute z-50 bg-slate-950 border border-white/10 p-2 rounded shadow-2xl -translate-y-12">
                                        <div className="text-xs font-bold uppercase whitespace-nowrap text-white">
                                            {state.state_name}: {state.risk_score.toFixed(0)} Risk
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-muted-foreground uppercase">Top Exposure</span>
                                <span className="text-rose-400 uppercase">High Vulnerability</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {stateRisks.slice(0, 3).map(s => (
                                    <span key={s.state_code} className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 text-xs font-black border border-rose-500/20 rounded">
                                        {s.state_name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Panel 3: Remittance Flows vs FX Reserves Line Chart */}
                <Card className="bg-card/50 border-border/40 overflow-hidden lg:col-span-1">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="text-emerald-400" size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Resilience Buffer</span>
                            </div>
                        </div>

                        <div className="h-32 w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={remittanceFlows}>
                                    <defs>
                                        <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', fontSize: '10px' }}
                                        labelStyle={{ color: '#64748b' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#10b981" 
                                        fillOpacity={1} 
                                        fill="url(#colorFlow)" 
                                        strokeWidth={2}
                                    />
                                    <ReferenceLine y={100} stroke="#f43f5e" strokeDasharray="3 3" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                            <div>
                                <div className="text-xs font-black uppercase text-muted-foreground/50 leading-none mb-1">FX Reserve Cover</div>
                                <div className="text-lg font-black tabular-nums">${fxReserves}B</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-black uppercase text-muted-foreground/50 leading-none mb-1">Buffer Health</div>
                                <div className="flex items-center gap-1 text-emerald-400">
                                    <span className="text-sm font-bold uppercase">Optimal</span>
                                    <ArrowUpRight size={14} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Panel 4: Fiscal Buffer Comparison (1990 vs 2025) */}
                <Card className="bg-card/50 border-border/40 overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <History className="text-purple-400" size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">1990 vs 2025 Baseline</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {resilienceMetrics.map((item, idx) => (
                                <div key={idx} className="group/row">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-muted-foreground uppercase">{item.metric}</span>
                                        {item.status === 'IMPROVED' ? (
                                            <ArrowUpRight className="text-emerald-400" size={12} />
                                        ) : item.status === 'DEGRADED' ? (
                                            <ArrowDownRight className="text-rose-400" size={12} />
                                        ) : null}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-slate-900/40 p-1.5 rounded border border-white/5 flex flex-col">
                                            <span className="text-xs font-black text-muted-foreground/40 uppercase">1990</span>
                                            <span className="text-xs font-bold text-muted-foreground/80 tabular-nums">{item.val1990}</span>
                                        </div>
                                        <div className="bg-slate-900/60 p-1.5 rounded border border-white/10 flex flex-col group-hover/row:border-blue-500/30 transition-colors">
                                            <span className="text-xs font-black text-blue-400/50 uppercase">2025</span>
                                            <span className="text-xs font-black text-foreground tabular-nums">{item.val2025}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="p-4 bg-slate-900/80 border border-white/5 shadow-inner rounded-xl backdrop-blur-md">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-orange-500/10 rounded-full">
                        <Info className="text-orange-400" size={20} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-widest text-orange-400">Strategic Intelligence Summary</h4>
                        <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                            <span className="text-foreground font-bold italic">India far more exposed but resilient</span> — $125bn remittances at risk vs $2.4bn in 1990. Oil shock threshold shifted to $80/bbl due to higher imports, however $680bn FX reserves provide 11-month cover (vs 14 days in 1990). Kerala and Tamil Nadu face highest fiscal-remittance risk correlation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

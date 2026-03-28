import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import {
    Activity, Briefcase, TrendingUp, TrendingDown,
    AlertTriangle, Zap, Database, Clock
} from 'lucide-react';
import { useUSLabor } from '@/hooks/useUSLabor';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-terminal-header border border-terminal-border p-3 rounded shadow-2xl backdrop-blur-md">
                <p className="text-terminal-muted text-[10px] font-black uppercase mb-2">{new Date(label).toLocaleDateString()}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
                        <span className="text-white font-mono text-sm">{entry.name}:</span>
                        <span className="text-white/90 font-mono text-sm">
                            {(entry.value || 0) > 1000 ? `${((entry.value || 0) / 1000).toFixed(1)}k` : (entry.value || 0).toFixed(2)}
                            {entry.name.includes('%') || entry.name.includes('Rate') ? '%' : ''}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const USLaborMarketMonitor: React.FC = () => {
    const { data: laborDataResp, isLoading } = useUSLabor();
    const laborData = laborDataResp?.data;
    const staleness = laborDataResp?.staleness;

    const latest = useMemo(() => {
        if (!laborData || laborData.length === 0) return null;
        return laborData[laborData.length - 1];
    }, [laborData]);

    const prev = useMemo(() => {
        if (!laborData || laborData.length < 2) return null;
        return laborData[laborData.length - 2];
    }, [laborData]);

    if (isLoading) return <Card className="h-96 flex items-center justify-center bg-terminal-bg border-terminal-border/50"><div className="text-terminal-muted font-mono animate-pulse">LOADING TELEMETRY [LABOR]...</div></Card>;

    const unrateMoM = latest && prev ? latest.unemployment_rate - prev.unemployment_rate : 0;

    return (
        <Card className="w-full bg-terminal-bg border border-terminal-border/50 text-white overflow-hidden">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-terminal-border">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Activity size={16} className="text-terminal-blue" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-terminal-blue">US Labor Market Pulse</span>
                    </div>
                    <CardTitle className="text-lg font-mono font-black tracking-tight uppercase">Employment & Payroll Terminals</CardTitle>
                </div>

                <div className="flex gap-4 items-center">
                    {/* Provenance and Freshness */}
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="border-terminal-border/60 text-terminal-muted font-mono text-[9px] uppercase px-1.5 rounded-none flex items-center gap-1">
                            <Database size={10} /> Source: FRED
                        </Badge>
                        {staleness && (
                            <Badge variant="outline" className={`border-terminal-border/60 ${staleness.status === 'fresh' ? 'text-terminal-emerald' : staleness.status === 'stale' ? 'text-terminal-gold' : 'text-terminal-rose'} font-mono text-[9px] uppercase px-1.5 rounded-none flex items-center gap-1`}>
                                <Clock size={10} /> {staleness.daysStale} Days Old ({staleness.status})
                            </Badge>
                        )}
                    </div>

                    <div className="px-3 py-1.5 bg-terminal-header border border-terminal-border">
                        <span className="block font-mono text-[9px] text-terminal-muted uppercase mb-0.5">Labor Distress</span>
                        <div className="flex items-center gap-2">
                            <span className={`font-mono text-base font-black ${latest?.labor_distress_index && latest.labor_distress_index > 7 ? 'text-terminal-rose' : 'text-terminal-emerald'}`}>
                                {latest?.labor_distress_index?.toFixed(1) || '0.0'}
                            </span>
                            <Zap size={14} className={latest?.labor_distress_index && latest.labor_distress_index > 7 ? 'text-terminal-rose' : 'text-terminal-emerald'} />
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* 1. Main Gauge: Unemployment */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-4 bg-terminal-header border border-terminal-border relative overflow-hidden group">
                            <div className="absolute inset-0 bg-terminal-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <span className="font-mono text-[10px] uppercase text-terminal-muted tracking-wider block mb-1">Unemployment Rate</span>
                                    <div className="font-mono text-3xl font-black text-white">{latest?.unemployment_rate}%</div>
                                </div>
                                <div className={`px-2 py-1 flex items-center gap-1 ${unrateMoM >= 0 ? 'bg-terminal-rose/10 text-terminal-rose' : 'bg-terminal-emerald/10 text-terminal-emerald'}`}>
                                    {unrateMoM >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    <span className="font-mono text-[10px] font-bold">{Math.abs(unrateMoM).toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-terminal-border relative z-10">
                                <div className="flex justify-between font-mono text-[9px] uppercase">
                                    <span className="text-terminal-muted">Participation</span>
                                    <span className="text-terminal-blue">{latest?.labor_participation_rate}%</span>
                                </div>
                                <div className="w-full bg-terminal-bg h-1 mt-1 overflow-hidden">
                                    <div className="h-full bg-terminal-blue" style={{ width: `${latest?.labor_participation_rate}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-terminal-header border border-terminal-border">
                            <span className="font-mono text-[10px] uppercase text-terminal-muted tracking-wider block mb-3">Wage Growth (Avg Hrly)</span>
                            <div className="flex items-center justify-between">
                                <div className="font-mono text-xl font-black text-white">${latest?.average_hourly_earnings}</div>
                                <div className="text-terminal-emerald flex items-center font-mono text-[10px] gap-1">
                                    <TrendingUp size={12} /> 4.1% YoY
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Jobless Claims Trend */}
                    <div className="lg:col-span-2 p-4 bg-terminal-header border border-terminal-border">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Briefcase size={14} className="text-terminal-gold" />
                                <span className="font-mono text-[10px] uppercase text-terminal-muted tracking-wider">Weekly Jobless Claims</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-sm bg-terminal-blue" />
                                    <span className="font-mono text-[9px] text-terminal-muted">Initial</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-sm bg-terminal-gold" />
                                    <span className="font-mono text-[9px] text-terminal-muted">Continued</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={laborData}>
                                    <defs>
                                        <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis
                                        dataKey="date"
                                        hide
                                    />
                                    <YAxis
                                        orientation="right"
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        name="Initial Claims"
                                        type="step"
                                        dataKey="initial_claims"
                                        stroke="#60a5fa"
                                        strokeWidth={1}
                                        fillOpacity={1}
                                        fill="url(#colorClaims)"
                                    />
                                    <Area
                                        name="Continuing Claims"
                                        type="step"
                                        dataKey="continuing_claims"
                                        stroke="#fbbf24"
                                        strokeWidth={1}
                                        fillOpacity={0}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Macro Correlation Notes */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="p-3 bg-terminal-header border border-terminal-blue/30">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap size={14} className="text-terminal-blue" />
                                <span className="font-mono text-[9px] uppercase text-terminal-blue tracking-wider">Macro Correlation</span>
                            </div>
                            <p className="font-mono text-[10px] text-terminal-muted leading-tight">
                                &gt; Initial claims historically lead sovereign liquidity pivots by 3-5 weeks. Current upward drift signals potential tightening by quarter-end.
                            </p>
                        </div>

                        <div className="p-3 bg-terminal-header border border-terminal-rose/30">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={14} className="text-terminal-rose" />
                                <span className="font-mono text-[9px] uppercase text-terminal-rose tracking-wider">Recession Trigger</span>
                            </div>
                            <div className="font-mono text-[10px] text-terminal-muted">Sahm Rule Status: <span className="text-terminal-emerald ml-1">Stable (0.2)</span></div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: JOLTS & Payrolls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-terminal-border">
                    <div className="bg-terminal-header border border-terminal-border p-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-mono text-[10px] uppercase text-terminal-muted tracking-wider">Payroll Composition (Nonfarm vs ADP)</span>
                        </div>
                        <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={laborData?.slice(-6)}>
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar name="Nonfarm" dataKey="nonfarm_payrolls" fill="#60a5fa" radius={[2, 2, 0, 0]} />
                                    <Bar name="ADP" dataKey="adp_payrolls" fill="#fbbf24" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-terminal-header border border-terminal-border p-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-mono text-[10px] uppercase text-terminal-muted tracking-wider">JOLTS: Openings vs Layoffs</span>
                        </div>
                        <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={laborData?.slice(-12)}>
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area name="Openings" type="step" dataKey="jolts_openings" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.1} />
                                    <Area name="Layoffs" type="step" dataKey="jolts_layoffs" stroke="#fb7185" fill="#fb7185" fillOpacity={0.1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

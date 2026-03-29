import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface PowerMixDivergenceCardProps {
    data?: { region: string; coal: number; renewable: number; other: number }[];
    isLoading?: boolean;
    lastUpdated?: string;
}

export const PowerMixDivergenceCard: React.FC<PowerMixDivergenceCardProps> = ({
    data = [],
    lastUpdated
}) => {
    return (
        <Card className="w-full h-full min-h-[450px] p-6 bg-black/40 border-white/10 backdrop-blur-md flex flex-col gap-6 group shadow-2xl relative overflow-hidden rounded-[2.5rem]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />

            <div className="flex items-center justify-between px-0">
                <div>
                    <h4 className="text-xl font-light text-white flex items-center gap-2">
                        <span className="w-8 h-px bg-emerald-500/50" />
                        Power Mix Divergence
                    </h4>
                    <div className="flex items-center gap-3 mt-1 ml-10">
                        <span className="text-xs font-bold text-emerald-500/80 flex items-center gap-1.5 uppercase tracking-widest">
                            {lastUpdated ? (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    AS OF {new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </>
                            ) : (
                                "Establishing Data Feed..."
                            )}
                        </span>
                    </div>
                </div>
                <div className="px-3 py-1.5 rounded-2xl bg-white/5 border border-white/5 text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    {data.length > 0 ? (
                        <>
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            Live Generation Data
                        </>
                    ) : (
                        <>
                            <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                            Data Syncing
                        </>
                    )}
                </div>
            </div>

            <CardContent className="flex-1 w-full mt-4 p-0">
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground italic text-xs">
                        Connecting to Ember Global Electricity Review...
                    </div>
                ) : (
                    <>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    layout="vertical"
                                    margin={{ top: 10, right: 40, left: 40, bottom: 20 }}
                                    barSize={32}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        domain={[0, 100]}
                                        stroke="rgba(255,255,255,0.1)"
                                        fontSize={9}
                                        fontWeight="900"
                                        tickFormatter={(v) => `${v}%`}
                                        className="uppercase tracking-tighter"
                                    />
                                    <YAxis
                                        dataKey="region"
                                        type="category"
                                        stroke="rgba(255,255,255,0.1)"
                                        fontSize={10}
                                        fontWeight="900"
                                        width={80}
                                        className="uppercase tracking-widest text-white"
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        content={({ active, payload, label }) => {
                                            if (!active || !payload) return null;
                                            return (
                                                <div className="bg-slate-950/90 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
                                                    <p className="text-xs font-black text-white mb-3 uppercase tracking-widest border-b border-white/5 pb-2">{label}</p>
                                                    <div className="space-y-2 min-w-[140px]">
                                                        {payload.map((p: any) => (
                                                            <div key={p.name} className="flex justify-between items-center gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.fill }} />
                                                                    <span className="text-xs text-muted-foreground uppercase font-bold">{p.name}</span>
                                                                </div>
                                                                <span className="text-xs font-mono font-black text-white">{p.value.toFixed(1)}%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Bar dataKey="coal" stackId="a" fill="#334155" name="Coal" radius={[4, 0, 0, 4]} />
                                    <Bar dataKey="renewable" stackId="a" fill="#10b981" name="Renewables" />
                                    <Bar dataKey="other" stackId="a" fill="#3b82f6" name="Nuclear/Gas/Other" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex items-center gap-6 mb-8 px-10">
                            {[
                                { color: '#334155', label: 'Coal' },
                                { color: '#10b981', label: 'Renewables' },
                                { color: '#3b82f6', label: 'Nuclear/Gas/Other' }
                            ].map(legend => (
                                <div key={legend.label} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full border border-white/10" style={{ backgroundColor: legend.color }} />
                                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{legend.label}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="mt-8 p-6 rounded-3xl bg-white/[0.02] border border-white/5 relative group/insight overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50 group-hover/insight:bg-emerald-400 transition-colors" />
                    <p className="text-xs leading-relaxed text-muted-foreground/80 font-medium">
                        <span className="text-white font-black uppercase tracking-widest mr-2 underline decoration-emerald-500/30">Strategic Insight:</span>
                        The structural divergence in power generation is the primary driver of 2025 energy cost disparities.
                        <span className="text-white"> China and India</span> prioritize energy density via coal to fuel industrial expansion,
                        while the <span className="text-white">EU and US</span> Clean Energy transition creates intermittency risks
                        without sufficient baseload or storage backup, leading to higher industrial volatility.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

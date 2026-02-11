import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIndiaEnergy, StateEnergyStats } from '@/hooks/useIndiaEnergy';
import { Activity, Zap, Flame, Lightbulb, ChevronRight } from 'lucide-react';

export const EnergySection: React.FC = () => {
    const { data, isLoading, error } = useIndiaEnergy();
    const [selectedMetric, setSelectedMetric] = useState<keyof StateEnergyStats>('coal_production');

    if (isLoading) return <div className="flex justify-center p-12"><Activity className="animate-spin text-blue-500" /></div>;

    if (error || !data || data.length === 0) return (
        <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
            <p className="text-muted-foreground text-sm font-medium italic">
                {error ? 'Err: Telemetry Interrupted' : 'No state energy data in current buffer.'}
            </p>
        </div>
    );

    const sortedData = [...data].sort((a, b) => Number(b[selectedMetric]) - Number(a[selectedMetric]));
    const topStates = sortedData.slice(0, 5);

    // Calculate aggregates
    const totalCoal = data.reduce((sum, s) => sum + s.coal_production, 0);
    const avgRenewableShare = data.reduce((sum, s) => sum + s.renewable_share, 0) / data.length;
    const totalElectricity = data.reduce((sum, s) => sum + s.electricity_consumption, 0);
    const avgEnergyIntensity = data.reduce((sum, s) => sum + s.energy_intensity, 0) / data.length;

    let intensityStatus: 'safe' | 'warning' | 'danger' = 'safe';
    if (avgEnergyIntensity > 18) intensityStatus = 'danger';
    else if (avgEnergyIntensity > 15) intensityStatus = 'warning';

    const metricTabs = [
        { id: 'coal_production', label: 'Coal production', icon: Flame },
        { id: 'renewable_share', label: 'Renewables %', icon: Zap },
        { id: 'electricity_consumption', label: 'Grid Demand', icon: Lightbulb }
    ];

    return (
        <div className="space-y-10">
            {/* National Aggregates Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent pointer-events-none" />

                <div className="space-y-1.5 relative z-10">
                    <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Aggregate Coal</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white font-mono tracking-tighter">{totalCoal.toFixed(1)}</span>
                        <span className="text-[0.6rem] font-bold text-white/20 uppercase">MT</span>
                    </div>
                </div>

                <div className="space-y-1.5 relative z-10">
                    <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Renewable Alpha</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-400 font-mono tracking-tighter">
                            {avgRenewableShare > 0 ? `${avgRenewableShare.toFixed(1)}%` : <span className="text-sm text-muted-foreground/30 italic">n/a</span>}
                        </span>
                    </div>
                </div>

                <div className="space-y-1.5 relative z-10">
                    <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">System Demand</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-blue-400 font-mono tracking-tighter">{(totalElectricity / 1000).toFixed(1)}</span>
                        <span className="text-[0.6rem] font-bold text-white/20 uppercase">GW</span>
                    </div>
                </div>

                <div className="space-y-1.5 relative z-10">
                    <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Energy Intensity</span>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-2xl font-black font-mono tracking-tighter",
                            avgEnergyIntensity > 0 ? (
                                intensityStatus === 'safe' ? "text-emerald-400" : intensityStatus === 'warning' ? "text-amber-400" : "text-rose-400"
                            ) : "text-muted-foreground/30 text-sm italic"
                        )}>
                            {avgEnergyIntensity > 0 ? `${avgEnergyIntensity.toFixed(1)}%` : 'n/a'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Heatmap & Matrix */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Sub-National Energy Matrix</h3>
                            <p className="text-[0.65rem] font-bold text-muted-foreground/60 uppercase tracking-widest">State-level intensity thresholds</p>
                        </div>

                        <div className="flex p-1 rounded-xl bg-white/5 border border-white/5 gap-1">
                            {metricTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedMetric(tab.id as keyof StateEnergyStats)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                                        selectedMetric === tab.id
                                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    <span className="text-[0.6rem] font-black uppercase tracking-wider">{tab.label.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                        {sortedData.map((state) => {
                            const val = state[selectedMetric as keyof typeof state] as number;
                            const maxVal = Math.max(...data.map(d => d[selectedMetric as keyof typeof d] as number));
                            const intensity = (val / maxVal);

                            return (
                                <div
                                    key={state.state_code}
                                    className="p-3 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group relative overflow-hidden"
                                >
                                    {/* Intensity Bar (Bottom) */}
                                    <div
                                        className={cn(
                                            "absolute bottom-0 left-0 h-1 transition-all duration-1000 ease-out opacity-40",
                                            selectedMetric === 'coal_production' ? "bg-orange-500" :
                                                selectedMetric === 'renewable_share' ? "bg-emerald-500" : "bg-blue-500"
                                        )}
                                        style={{ width: `${intensity * 100}%` }}
                                    />

                                    <span className="text-[0.5rem] font-black text-muted-foreground/30 uppercase tracking-[0.2em] block mb-1">
                                        {state.state_code}
                                    </span>
                                    <span className="text-[0.65rem] font-bold text-white/50 block mb-2 truncate">
                                        {state.state_name}
                                    </span>
                                    <div className="text-lg font-black text-white/90 tabular-nums tracking-tighter">
                                        {selectedMetric === 'renewable_share' ? val.toFixed(1) + '%' :
                                            selectedMetric === 'electricity_consumption' ? Math.round(val / 1000).toLocaleString() + ' GW' :
                                                val.toFixed(1)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rankings & Benchmarking */}
                <div className="space-y-6">
                    <h3 className="text-lg font-black text-white italic tracking-tight uppercase px-4 border-l-2 border-emerald-500">Tier-1 Rankings</h3>
                    <div className="space-y-3">
                        {topStates.map((state, i) => (
                            <div
                                key={state.state_code}
                                className="flex justify-between items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-[0.6rem] font-black text-muted-foreground/20 italic">0{i + 1}</span>
                                    <span className="text-xs font-black text-white/80 uppercase tracking-tight">{state.state_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-emerald-400 font-mono">
                                        {Number(state[selectedMetric]).toLocaleString()}
                                    </span>
                                    <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-emerald-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {avgEnergyIntensity > 0 && (
                        <div className="mt-8 p-6 rounded-3xl bg-emerald-500/[0.03] border border-emerald-500/10">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[0.6rem] font-black text-emerald-500 uppercase tracking-widest">Protocol Efficiency Note</span>
                            </div>
                            <p className="text-[0.7rem] leading-relaxed text-emerald-100/40 font-medium italic">
                                Aggregate intensity of {avgEnergyIntensity.toFixed(1)}% indicates a strong decoupling between GVA growth and grid reliance.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

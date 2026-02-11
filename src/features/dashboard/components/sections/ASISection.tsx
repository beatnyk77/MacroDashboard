import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { IndiaASIMap, ASIMapMetric } from '../maps/IndiaASIMap';
import { useIndiaASI, StateASIStats } from '@/hooks/useIndiaASI';
import { Factory, Users, TrendingUp, ChevronRight, Activity, Globe } from 'lucide-react';

export const ASISection: React.FC = () => {
    const { data, isLoading, error } = useIndiaASI();
    const [selectedMetric, setSelectedMetric] = useState<ASIMapMetric>('total_gva');
    const [rankingMetric, setRankingMetric] = useState<'total_gva' | 'total_employment' | 'avg_capacity_utilization'>('total_gva');
    const [selectedState, setSelectedState] = useState<StateASIStats | null>(null);

    // ✅ Move useMemo BEFORE early returns to comply with Rules of Hooks
    const topStates = useMemo(() => {
        const stats = [...(data || [])].sort((a, b) => (b[rankingMetric] as number) - (a[rankingMetric] as number));
        return stats.slice(0, 5);
    }, [data, rankingMetric]);

    // NOW safe to do early returns after all hooks have been called
    if (isLoading) return <div className="flex justify-center p-12"><Activity className="animate-spin text-blue-500" /></div>;
    if (error) return <div className="p-8 text-rose-400 font-bold bg-rose-500/10 rounded-2xl border border-rose-500/20">Error loading ASI telemetry</div>;

    const formatValue = (state: StateASIStats, metric: 'total_gva' | 'total_employment' | 'avg_capacity_utilization') => {
        switch (metric) {
            case 'total_employment': return `${(state.total_employment / 1000).toFixed(1)}M`;
            case 'avg_capacity_utilization': return `${state.avg_capacity_utilization.toFixed(1)}%`;
            default: return `₹${(state.total_gva / 100000).toFixed(2)}T`;
        }
    };

    // Calculate aggregates
    const nationalGVA = (data || []).reduce((sum, s) => sum + s.total_gva, 0);
    const nationalEmployment = (data || []).reduce((sum, s) => sum + s.total_employment, 0);
    const avgCapacityUtil = (data || []).reduce((sum, s) => sum + s.avg_capacity_utilization, 0) / (data?.length || 1);

    const activeStats = selectedState ? {
        gva: selectedState.total_gva,
        employment: selectedState.total_employment,
        capacity: selectedState.avg_capacity_utilization,
        title: selectedState.state_name
    } : {
        gva: nationalGVA,
        employment: nationalEmployment,
        capacity: avgCapacityUtil,
        title: "All India Aggregates"
    };

    return (
        <div className="space-y-10">
            {/* Header Content */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <Factory className="text-emerald-500 w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Annual Survey of Industries</h3>
                </div>
                <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                    Institutional-grade industrial telemetry tracking Manufacturing, Mining, and Electricity sectors at a sub-national resolution.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Map Interface */}
                <div className="lg:col-span-8 p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 relative group overflow-hidden z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="space-y-1">
                            <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Geospatial Intensity</span>
                            <h4 className="text-md font-black text-white/90">Regional Growth Map</h4>
                        </div>

                        <div className="flex p-1 rounded-xl bg-white/5 border border-white/5 gap-1">
                            {[
                                { id: 'total_gva', label: 'GVA' },
                                { id: 'total_employment', label: 'Labor' },
                                { id: 'avg_capacity_utilization', label: 'Capacity' },
                                { id: 'geopolitics', label: 'Sphere Influence' },
                                { id: 'efficiency', label: 'Job Efficiency' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedMetric(tab.id as ASIMapMetric)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg transition-all text-[0.6rem] font-black uppercase tracking-wider",
                                        selectedMetric === tab.id
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "text-muted-foreground hover:text-white"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative h-[550px] w-full bg-slate-900/40 rounded-3xl border border-white/5 flex items-center justify-center z-10">
                        <IndiaASIMap
                            data={data || []}
                            metric={selectedMetric}
                            onStateClick={setSelectedState}
                            selectedStateCode={selectedState?.state_code}
                        />
                    </div>
                </div>

                {/* Sidebar: Stats & Rankings */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Focus Card */}
                    <div className={cn(
                        "p-8 rounded-[2rem] border transition-all duration-500 group relative overflow-hidden",
                        selectedState
                            ? "bg-blue-500/10 border-blue-500/20"
                            : "bg-white/[0.02] border-white/5"
                    )}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                                <span className="text-[0.5rem] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
                                    {selectedState ? 'Selected Node' : 'National Buffer'}
                                </span>
                                <h4 className="text-xl font-black text-white/90 truncate">{activeStats.title}</h4>
                            </div>
                            {selectedState && (
                                <button
                                    onClick={() => setSelectedState(null)}
                                    className="text-[0.55rem] font-black text-blue-400 hover:text-blue-300 underline underline-offset-4"
                                >
                                    REFRESH VIEW
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 opacity-40">
                                    <Globe className="w-3 h-3" />
                                    <span className="text-[0.55rem] font-black uppercase">GVA Total</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-white font-mono tracking-tighter">₹{(activeStats.gva / 100000).toFixed(1)}</span>
                                    <span className="text-[0.6rem] font-bold text-white/30 uppercase">T</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 opacity-40">
                                    <Users className="w-3 h-3" />
                                    <span className="text-[0.55rem] font-black uppercase">Employment</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-white font-mono tracking-tighter">{(activeStats.employment / 1000).toFixed(1)}</span>
                                    <span className="text-[0.6rem] font-bold text-white/30 uppercase">M</span>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-1.5 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 opacity-40">
                                    <TrendingUp className="w-3 h-3" />
                                    <span className="text-[0.55rem] font-black uppercase">Capacity Utilization</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-emerald-500 font-mono tracking-tighter">{activeStats.capacity.toFixed(1)}%</span>
                                    <span className="text-[0.6rem] font-bold text-emerald-500/40 uppercase italic tracking-widest pl-2">Nominal Alpha</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rankings */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[0.7rem] font-black text-white/90 uppercase tracking-[0.3em]">Tier-1 States</h4>
                            <select
                                value={rankingMetric}
                                onChange={(e) => setRankingMetric(e.target.value as any)}
                                className="bg-white/5 border-none text-[0.6rem] font-black text-muted-foreground uppercase py-1 rounded-lg cursor-pointer hover:text-white transition-colors"
                            >
                                <option value="total_gva">GVA</option>
                                <option value="total_employment">Labor</option>
                                <option value="avg_capacity_utilization">Util</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            {topStates.map((state) => (
                                <button
                                    key={state.state_code}
                                    onClick={() => setSelectedState(state)}
                                    className={cn(
                                        "w-full flex justify-between items-center p-4 rounded-2xl border transition-all group",
                                        selectedState?.state_code === state.state_code
                                            ? "bg-blue-500/10 border-blue-500/20"
                                            : "bg-white/[0.01] border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <span className="text-xs font-black text-white/80 uppercase tracking-tight">{state.state_name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black text-blue-400 font-mono">
                                            {formatValue(state, rankingMetric)}
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useIndiaASI, StateASIStats } from '@/hooks/useIndiaASI';
import { useGeopoliticalExposure } from '@/hooks/useGeopoliticalExposure';
import { Factory, Users, TrendingUp, ChevronRight, Activity, Globe, DollarSign, Briefcase } from 'lucide-react';
import { scaleQuantile } from 'd3-scale';
import { StateMacroInsights } from '../StateMacroInsights';
import React, { Suspense } from 'react';

const IndiaLeafletMap = React.lazy(() => import('../maps/IndiaLeafletMap').then(m => ({ default: m.IndiaLeafletMap })));

export type ASIMapMetric = 'total_gva' | 'total_employment' | 'avg_capacity_utilization' | 'employment_growth_yoy';

export const ASISection: React.FC = () => {
    const { data, isLoading, error } = useIndiaASI();
    const { data: geoData } = useGeopoliticalExposure();
    const [selectedMetric, setSelectedMetric] = useState<ASIMapMetric>('total_gva');
    const [rankingMetric, setRankingMetric] = useState<ASIMapMetric>('total_gva');
    const [selectedState, setSelectedState] = useState<StateASIStats | null>(null);
    const [isInfrared, setIsInfrared] = useState(false);

    const colorScale = useMemo(() => {
        const fallback = () => '#333';
        if (!data || data.length === 0) return fallback;

        let domain: number[] = [0, 1];
        let range: string[] = ['#064e3b', '#065f46', '#059669', '#10b981', '#34d399'];

        if (isInfrared) {
            domain = [0, 0.2, 0.4, 0.6, 0.8, 1];
            range = ['#2563eb', '#60a5fa', '#94a3b8', '#fb7185', '#e11d48'];
        } else {
            const values = data.map(d => Number(d[selectedMetric]) || 0);
            domain = values;
            range = selectedMetric === 'employment_growth_yoy'
                ? ['#450a0a', '#7f1d1d', '#b91c1c', '#dc2626', '#ef4444']
                : selectedMetric === 'total_employment'
                    ? ['#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#4f46e5']
                    : ['#064e3b', '#065f46', '#059669', '#10b981', '#34d399'];
        }

        return scaleQuantile<string>()
            .domain(domain)
            .range(range);
    }, [data, selectedMetric, isInfrared]);

    const topStates = useMemo(() => {
        const stats = [...(data || [])].sort((a, b) => (Number(b[rankingMetric]) || 0) - (Number(a[rankingMetric]) || 0));
        return stats.slice(0, 5);
    }, [data, rankingMetric]);

    if (isLoading) return <div className="flex justify-center p-12"><Activity className="animate-spin text-blue-500" /></div>;
    if (error) return <div className="p-8 text-rose-400 font-bold bg-rose-500/10 rounded-2xl border border-rose-500/20">Error loading ASI telemetry</div>;

    const formatValue = (state: StateASIStats, metric: ASIMapMetric) => {
        const val = Number(state[metric]) || 0;
        switch (metric) {
            case 'total_employment': return `${(val / 1000).toFixed(1)}M`;
            case 'avg_capacity_utilization': return `${val.toFixed(1)}%`;
            case 'employment_growth_yoy': return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
            default: return `₹${(val / 100000).toFixed(2)}T`;
        }
    };

    // Calculate aggregates
    const nationalGVA = (data || []).reduce((sum, s) => sum + s.total_gva, 0);
    const nationalEmployment = (data || []).reduce((sum, s) => sum + s.total_employment, 0);
    const avgCapacityUtil = (data || []).reduce((sum, s) => sum + s.avg_capacity_utilization, 0) / (data?.length || 1);
    const nationalEfficiency = (geoData || []).reduce((sum, s) => sum + s.loan_job_multiplier, 0) / (geoData?.length || 1);

    const activeStats = selectedState ? {
        gva: selectedState.total_gva,
        employment: selectedState.total_employment,
        capacity: selectedState.avg_capacity_utilization,
        growth: selectedState.employment_growth_yoy,
        efficiency: geoData?.find(s => s.state_code === selectedState.state_code)?.loan_job_multiplier || 0,
        title: selectedState.state_name
    } : {
        gva: nationalGVA,
        employment: nationalEmployment,
        capacity: avgCapacityUtil,
        growth: 0, // Aggregated growth is complex, show 0 for now
        efficiency: nationalEfficiency,
        title: "All India Aggregates"
    };

    const metricTabs = [
        { id: 'total_gva', label: 'GVA', unit: '₹T', icon: DollarSign },
        { id: 'total_employment', label: 'Labor', unit: 'M', icon: Users },
        { id: 'avg_capacity_utilization', label: 'Util', unit: '%', icon: Briefcase },
        { id: 'employment_growth_yoy', label: 'Growth', unit: '%', icon: TrendingUp },
    ];


    return (
        <div className="space-y-10">
            {/* Header Content */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <Factory className="text-emerald-500 w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-white italic tracking-tight uppercase">ASI Industrial Matrix</h3>
                </div>
                <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                    Sub-national industrial resolution tracking Manufacturing and Mining output with high-fidelity labor benchmarks.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Map Interface */}
                <div className="lg:col-span-8 p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 relative group overflow-hidden z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="space-y-1">
                            <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Geospatial Intensity</span>
                            <h4 className="text-md font-black text-white/90">Regional Industrial Map</h4>
                        </div>

                        <div className="flex p-1 rounded-xl bg-white/5 border border-white/5 gap-1">
                            <button
                                onClick={() => setIsInfrared(!isInfrared)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                                    isInfrared
                                        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20 animate-pulse"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Globe className="w-3.5 h-3.5" />
                                <span className="text-xs font-black uppercase tracking-wider">Geopolitical Alignment</span>
                            </button>
                            <div className="w-[1px] h-4 bg-white/10 self-center mx-1" />
                            {metricTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setSelectedMetric(tab.id as ASIMapMetric);
                                        setIsInfrared(false);
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                                        !isInfrared && selectedMetric === tab.id
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    <span className="text-xs font-black uppercase tracking-wider">{tab.label.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative h-[550px] w-full z-10">
                        <Suspense fallback={
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.02] border border-white/5 rounded-3xl gap-4">
                                <Activity className="w-6 h-6 text-emerald-500 animate-spin" />
                                <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Calibrating Industrial Sensors...</span>
                            </div>
                        }>
                            <IndiaLeafletMap
                                data={data || []}
                                metric={isInfrared ? 'geopolitical_alignment' : selectedMetric}
                                getColor={colorScale}
                                getValue={(s) => {
                                    if (isInfrared) {
                                        const exposure = geoData?.find(g => g.state_code === s.state_code);
                                        return exposure?.east_share_pct || 0.5;
                                    }
                                    return Number(s[selectedMetric]);
                                }}
                                onStateClick={setSelectedState}
                                selectedStateCode={selectedState?.state_code}
                                tooltipFormatter={(s) => {
                                    if (isInfrared) {
                                        const exposure = geoData?.find(g => g.state_code === s.state_code);
                                        const eastShare = (exposure?.east_share_pct || 0.5) * 100;
                                        const dominant = exposure?.dominant_sphere || 'NEUTRAL';
                                        return `
                                            <div style="font-weight: 900; color: #fff; margin-bottom: 4px;">${s.state_name}</div>
                                            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 10px;">
                                                <div style="display: flex; justify-content: space-between;">
                                                    <span>Dominant Sphere:</span>
                                                    <span style="color: ${dominant === 'EAST' ? '#e11d48' : dominant === 'WEST' ? '#2563eb' : '#94a3b8'}; font-weight: 900;">${dominant}</span>
                                                </div>
                                                <div style="display: flex; justify-content: space-between;">
                                                    <span>East Capital Share:</span>
                                                    <span>${eastShare.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        `;
                                    }
                                    return `
                                        <div style="font-weight: 900; color: #fff; margin-bottom: 4px;">${s.state_name}</div>
                                        <div style="display: flex; justify-content: space-between; gap: 12px; font-size: 10px;">
                                            <span>${metricTabs.find(t => t.id === selectedMetric)?.label}:</span>
                                            <span style="color: #10b981;">${formatValue(s, selectedMetric)}</span>
                                        </div>
                                    `;
                                }}
                            />
                        </Suspense>
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
                                <span className="text-xs font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
                                    {selectedState ? 'Selected Node' : 'National Buffer'}
                                </span>
                                <h4 className="text-xl font-black text-white/90 truncate">{activeStats.title}</h4>
                            </div>
                            {selectedState && (
                                <button
                                    onClick={() => setSelectedState(null)}
                                    className="text-xs font-black text-blue-400 hover:text-blue-300 underline underline-offset-4"
                                >
                                    RESET
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 opacity-40">
                                    <Globe className="w-3 h-3" />
                                    <span className="text-xs font-black uppercase">GVA Total</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-white font-mono tracking-tighter">₹{(activeStats.gva / 100000).toFixed(1)}</span>
                                    <span className="text-xs font-bold text-white/30 uppercase">T</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 opacity-40">
                                    <Users className="w-3 h-3" />
                                    <span className="text-xs font-black uppercase">Employment</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-white font-mono tracking-tighter">{(activeStats.employment / 1000).toFixed(1)}</span>
                                    <span className="text-xs font-bold text-white/30 uppercase">M</span>
                                </div>
                            </div>
                            <div className="space-y-1.5 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 opacity-40">
                                    <TrendingUp className="w-3 h-3" />
                                    <span className="text-xs font-black uppercase">Cap Util</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-emerald-500 font-mono tracking-tighter">{activeStats.capacity.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="space-y-1.5 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 opacity-40">
                                    <Briefcase className="w-3 h-3" />
                                    <span className="text-xs font-black uppercase">YoY Growth</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className={cn(
                                        "text-xl font-black font-mono tracking-tighter",
                                        activeStats.growth >= 0 ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        {activeStats.growth > 0 ? '+' : ''}{activeStats.growth.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {activeStats.efficiency > 0 && (
                                <div className="col-span-2 space-y-1.5 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 opacity-40">
                                        <DollarSign className="w-3 h-3 text-emerald-500" />
                                        <span className="text-xs font-black uppercase tracking-widest">Loan-to-Job Efficiency</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-emerald-400 font-mono tracking-tighter">
                                            ${Math.round(activeStats.efficiency).toLocaleString()}
                                        </span>
                                        <span className="text-xs font-bold text-emerald-400/40 uppercase tracking-widest pl-1">CAPEX / NEW JOB</span>
                                    </div>
                                </div>
                            )}

                            {selectedState && (
                                <div className="col-span-2 pt-6">
                                    <StateMacroInsights type="asi" data={selectedState} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rankings */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black text-white/90 uppercase tracking-[0.3em]">Tier-1 States</h4>
                            <select
                                value={rankingMetric}
                                onChange={(e) => setRankingMetric(e.target.value as any)}
                                className="bg-white/5 border-none text-xs font-black text-muted-foreground uppercase py-1 rounded-lg cursor-pointer hover:text-white transition-colors"
                            >
                                <option value="total_gva">GVA</option>
                                <option value="total_employment">Labor</option>
                                <option value="avg_capacity_utilization">Util</option>
                                <option value="employment_growth_yoy">Growth</option>
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
                                            ? "bg-emerald-500/10 border-emerald-500/20"
                                            : "bg-white/[0.01] border-white/5 hover:border-white/12"
                                    )}
                                >
                                    <span className="text-xs font-black text-white/80 uppercase tracking-tight">{state.state_name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black text-emerald-400 font-mono">
                                            {formatValue(state, rankingMetric)}
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-emerald-500 transition-colors" />
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

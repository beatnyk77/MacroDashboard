import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useIndiaEnergy, StateEnergyStats } from '@/hooks/useIndiaEnergy';
import { Activity, Zap, Flame, Lightbulb, ChevronRight } from 'lucide-react';
import { scaleQuantile } from 'd3-scale';
import { StateMacroInsights } from '../StateMacroInsights';
import React, { Suspense } from 'react';

const IndiaLeafletMap = React.lazy(() => import('../maps/IndiaLeafletMap').then(m => ({ default: m.IndiaLeafletMap })));

export const EnergySection: React.FC = () => {
    const { data, isLoading, error } = useIndiaEnergy();
    const [selectedMetric, setSelectedMetric] = useState<keyof StateEnergyStats>('coal_production');
    const [selectedState, setSelectedState] = useState<StateEnergyStats | null>(null);
    const [isInfrared, setIsInfrared] = useState(false);

    const colorScale = useMemo(() => {
        const fallback = () => '#333';
        if (!data || data.length === 0) return fallback;

        let domain: number[] = [0, 100];
        let range: string[] = ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6'];

        if (isInfrared) {
            domain = [0, 100];
            range = ['#10b981', '#34d399', '#f59e0b', '#ef4444', '#7f1d1d'];
        } else {
            const values = data.map(d => Number(d[selectedMetric]) || 0);
            domain = values;
            range = selectedMetric === 'renewable_share'
                ? ['#064e3b', '#065f46', '#059669', '#34d399', '#6ee7b7']
                : selectedMetric === 'coal_production'
                    ? ['#431407', '#7c2d12', '#9a3412', '#c2410c', '#ea580c']
                    : ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6'];
        }

        return scaleQuantile<string>()
            .domain(domain)
            .range(range);
    }, [data, selectedMetric, isInfrared]);

    const getInfraredValue = (s: StateEnergyStats) => {
        // Higher value = higher transition risk (more coal relative to RE)
        return (100 - s.renewable_share);
    };

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
    const totalElectricity = data.reduce((sum, s) => sum + (s.electricity_consumption || 0), 0);
    const avgEnergyIntensity = data.reduce((sum, s) => sum + s.energy_intensity, 0) / data.length;

    const metricTabs = [
        { id: 'coal_production', label: 'Coal production', icon: Flame, unit: 'KToE' },
        { id: 'renewable_share', label: 'Renewables %', icon: Zap, unit: '%' },
        { id: 'electricity_consumption', label: 'Grid Demand', icon: Lightbulb, unit: 'KToE' }
    ];

    const currentTab = metricTabs.find(t => t.id === selectedMetric)!;

    return (
        <div className="space-y-10">
            {/* National Aggregates Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent pointer-events-none" />

                <div className="space-y-1.5 relative z-10">
                    <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Aggregate Coal</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white font-mono tracking-tighter">{totalCoal.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                        <span className="text-xs font-bold text-white/20 uppercase">KToE</span>
                    </div>
                </div>

                <div className="space-y-1.5 relative z-10">
                    <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Renewable Alpha</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-400 font-mono tracking-tighter">
                            {avgRenewableShare > 0 ? `${avgRenewableShare.toFixed(1)}%` : <span className="text-xs text-muted-foreground/30 uppercase tracking-widest italic font-bold">Sync...</span>}
                        </span>
                    </div>
                </div>

                <div className="space-y-1.5 relative z-10">
                    <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">System Demand</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-blue-400 font-mono tracking-tighter">{(totalElectricity).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <span className="text-xs font-bold text-white/20 uppercase">KToE</span>
                    </div>
                </div>

                <div className="space-y-1.5 relative z-10">
                    <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Relative Intensity</span>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black font-mono tracking-tighter text-emerald-400">
                            {avgEnergyIntensity.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Geospatial Terminal */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Sub-National Energy Matrix</h3>
                            <p className="text-[0.65rem] font-bold text-muted-foreground/60 uppercase tracking-widest">Interactive choropleth • High-fidelity telemetry</p>
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
                                <Zap className="w-3.5 h-3.5" />
                                <span className="text-xs font-black uppercase tracking-wider">Infrared Overlay</span>
                            </button>
                            <div className="w-[1px] h-4 bg-white/10 self-center mx-1" />
                            {metricTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setSelectedMetric(tab.id as keyof StateEnergyStats);
                                        setIsInfrared(false);
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                                        !isInfrared && selectedMetric === tab.id
                                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    <span className="text-xs font-black uppercase tracking-wider">{tab.label.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[550px] w-full relative group">
                        <Suspense fallback={
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.02] border border-white/5 rounded-3xl gap-4">
                                <Activity className="w-6 h-6 text-blue-500 animate-spin" />
                                <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Initializing Geospatial Environment...</span>
                            </div>
                        }>
                            <IndiaLeafletMap
                                data={data}
                                metric={isInfrared ? 'transition_intensity' : selectedMetric}
                                getColor={colorScale}
                                getValue={(s) => isInfrared ? getInfraredValue(s) : Number(s[selectedMetric])}
                                onStateClick={setSelectedState}
                                selectedStateCode={selectedState?.state_code}
                                tooltipFormatter={(s) => isInfrared ? `
                                    <div style="font-weight: 900; color: #fff; margin-bottom: 4px;">${s.state_name}</div>
                                    <div style="display: flex; flex-direction: column; gap: 4px; font-size: 10px;">
                                        <div style="display: flex; justify-content: space-between;">
                                            <span>Carbon Risk:</span>
                                            <span style="color: #ef4444; font-weight: 900;">HIGH</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between;">
                                            <span>RE Share:</span>
                                            <span>${s.renewable_share.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                ` : `
                                    <div style="font-weight: 900; color: #fff; margin-bottom: 4px;">${s.state_name}</div>
                                    <div style="display: flex; justify-between; gap: 12px; font-size: 10px;">
                                        <span>${currentTab.label}:</span>
                                        <span style="color: #3b82f6;">${Number(s[selectedMetric]).toFixed(1)}${currentTab.unit}</span>
                                    </div>
                                `}
                            />
                        </Suspense>
                    </div>
                </div>

                {/* Vertical Rankings & Context */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black text-white italic tracking-tight uppercase px-4 border-l-2 border-emerald-500">Tier-1 Node Ranking</h3>
                            <span className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">Live Buffer</span>
                        </div>
                        <div className="space-y-3">
                            {topStates.map((state, i) => (
                                <button
                                    key={state.state_code}
                                    onClick={() => setSelectedState(state)}
                                    className={cn(
                                        "w-full flex justify-between items-center p-4 rounded-2xl border transition-all group text-left",
                                        selectedState?.state_code === state.state_code
                                            ? "bg-blue-500/10 border-blue-500/20 shadow-lg shadow-blue-500/5"
                                            : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black text-muted-foreground/20 italic">0{i + 1}</span>
                                        <span className="text-xs font-black text-white/80 uppercase tracking-tight">{state.state_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-blue-400 font-mono">
                                            {Number(state[selectedMetric]).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                        </span>
                                        <ChevronRight className={cn(
                                            "w-3 h-3 transition-colors",
                                            selectedState?.state_code === state.state_code ? "text-blue-500" : "text-white/10 group-hover:text-blue-500"
                                        )} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedState ? (
                        <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Node Focus: {selectedState.state_name}</span>
                                <button onClick={() => setSelectedState(null)} className="text-xs font-black text-white/30 hover:text-white underline uppercase">Clear</button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-black text-muted-foreground/50 uppercase tracking-widest">Coal Prod</span>
                                    <div className="text-sm font-black text-white font-mono">{selectedState.coal_production.toFixed(1)} <span className="text-xs text-white/20">KToE</span></div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-black text-muted-foreground/50 uppercase tracking-widest">RE Share</span>
                                    <div className="text-sm font-black text-emerald-400 font-mono">{selectedState.renewable_share.toFixed(1)}%</div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <StateMacroInsights type="energy" data={selectedState} />
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 rounded-3xl border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-4">
                            <Activity className="w-5 h-5 text-white/10 animate-pulse" />
                            <p className="text-[0.65rem] font-bold text-muted-foreground/40 uppercase tracking-widest leading-relaxed">
                                Select a state on the map for <br /> high-frequency drill-down
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

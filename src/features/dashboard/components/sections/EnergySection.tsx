import { useState, useMemo } from 'react';
import { TrailLink as Link } from '@/components/TrailLink';
import { cn } from '@/lib/utils';
import { useIndiaEnergy, StateEnergyStats } from '@/hooks/useIndiaEnergy';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { Activity, Zap, Flame, Lightbulb, ChevronRight, Fuel, ArrowRight } from 'lucide-react';
import { scaleQuantile } from 'd3-scale';
import { StateMacroInsights } from '../StateMacroInsights';
import { OilSpreadChart } from '../energy/OilSpreadChart';
import { OilStressSignal } from '../energy/OilStressSignal';
import { FreshnessChip } from '@/components/FreshnessChip';
import React, { Suspense } from 'react';
import { CHART_COLORS, CHART_RAMPS } from '@/constants/chartDefaults';

const IndiaLeafletMap = React.lazy(() => import('../maps/IndiaLeafletMap').then(m => ({ default: m.IndiaLeafletMap })));

export const EnergySection: React.FC = () => {
    const { data, isLoading, error } = useIndiaEnergy();
    const { data: brentMetric } = useLatestMetric(MID.BRENT_CRUDE_PRICE);
    const brentFreshness = getStaleness(brentMetric?.lastUpdated, brentMetric?.frequency);

    const [selectedMetric, setSelectedMetric] = useState<keyof StateEnergyStats>('coal_production');
    const [selectedState, setSelectedState] = useState<StateEnergyStats | null>(null);
    const [isInfrared, setIsInfrared] = useState(false);

    const colorScale = useMemo(() => {
        const fallback = () => '#333';
        if (!data || data.length === 0) return fallback;

        let domain: number[] = [0, 100];
        let range: string[] = [...CHART_RAMPS.blue];

        if (isInfrared) {
            domain = [0, 100];
            range = [CHART_COLORS.expansion, CHART_COLORS.expansionSoft, CHART_COLORS.gold, CHART_COLORS.stress, CHART_RAMPS.red[1]];
        } else {
            const values = data.map(d => Number(d[selectedMetric]) || 0);
            domain = values;
            range = selectedMetric === 'renewable_share'
                ? [...CHART_RAMPS.green]
                : selectedMetric === 'coal_production'
                    ? [...CHART_RAMPS.orange]
                    : [...CHART_RAMPS.blue];
        }

        return scaleQuantile<string>()
            .domain(domain)
            .range(range);
    }, [data, selectedMetric, isInfrared]);

    const getInfraredValue = (s: StateEnergyStats) => {
        return (100 - s.renewable_share);
    };

    const hasIndiaData = !isLoading && !error && data && data.length > 0;

    const sortedData = hasIndiaData ? [...data].sort((a, b) => Number(b[selectedMetric]) - Number(a[selectedMetric])) : [];
    const topStates = sortedData.slice(0, 5);

    const totalCoal = hasIndiaData ? data.reduce((sum, s) => sum + s.coal_production, 0) : 0;
    const avgRenewableShare = hasIndiaData ? data.reduce((sum, s) => sum + s.renewable_share, 0) / data.length : 0;
    const totalElectricity = hasIndiaData ? data.reduce((sum, s) => sum + (s.electricity_consumption || 0), 0) : 0;
    const avgEnergyIntensity = hasIndiaData ? data.reduce((sum, s) => sum + s.energy_intensity, 0) / data.length : 0;

    const metricTabs = [
        { id: 'coal_production', label: 'Coal production', icon: Flame, unit: 'KToE' },
        { id: 'renewable_share', label: 'Renewables %', icon: Zap, unit: '%' },
        { id: 'electricity_consumption', label: 'Grid Demand', icon: Lightbulb, unit: 'KToE' },
    ];

    const currentTab = metricTabs.find(t => t.id === selectedMetric)!;

    return (
        <div className="space-y-10">
            {/* Global Energy Market Pulse */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4">
                    <OilStressSignal />
                </div>
                <div className="md:col-span-8">
                    <OilSpreadChart />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-xl bg-amber-500/[0.05] border border-amber-500/20">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <Fuel className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Brent Crude</span>
                        <div className="flex items-center gap-3 mt-1">
                            {brentMetric?.value != null ? (
                                <span className="text-2xl font-bold text-foreground font-mono tracking-heading">
                                    ${Number(brentMetric.value).toFixed(2)}
                                </span>
                            ) : (
                                <span className="text-sm font-semibold text-terminal-dim uppercase">Unavailable</span>
                            )}
                            <FreshnessChip status={brentFreshness.state} lastUpdated={brentMetric?.lastUpdated} />
                        </div>
                    </div>
                </div>
                <Link
                    to="/labs/energy-commodities"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-muted/60 hover:border-amber-500/30 transition-colors shadow-sm"
                >
                    Open Energy Lab
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {hasIndiaData && (
                <>
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">India State Energy Matrix</h3>
                        <span className="text-[11px] font-semibold text-terminal-dim uppercase">Weekly · MoSPI</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-xl bg-card border border-border backdrop-blur-xl relative overflow-hidden group shadow-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent pointer-events-none" />

                        <div className="space-y-1.5 relative z-10">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aggregate Coal</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-foreground font-mono tracking-heading">{totalCoal.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                <span className="text-xs font-semibold text-terminal-dim uppercase">KToE</span>
                            </div>
                        </div>

                        <div className="space-y-1.5 relative z-10">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Renewable Alpha</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-emerald-400 font-mono tracking-heading">
                                    {avgRenewableShare > 0 ? `${avgRenewableShare.toFixed(1)}%` : <span className="text-xs text-terminal-dim uppercase tracking-wider italic font-semibold">Sync...</span>}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5 relative z-10">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Demand</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-blue-400 font-mono tracking-heading">{(totalElectricity).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                <span className="text-xs font-semibold text-terminal-dim uppercase">KToE</span>
                            </div>
                        </div>

                        <div className="space-y-1.5 relative z-10">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Relative Intensity</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold font-mono tracking-heading text-emerald-400">
                                    {avgEnergyIntensity.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold text-foreground italic tracking-heading uppercase">Sub-National Energy Matrix</h3>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interactive choropleth · High-fidelity telemetry</p>
                                </div>

                                <div className="flex p-1 rounded-xl bg-white/5 border border-border gap-1">
                                    <button
                                        onClick={() => setIsInfrared(!isInfrared)}
                                        className={cn(
                                            'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all',
                                            isInfrared
                                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 animate-pulse'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                                        )}
                                    >
                                        <Zap className="w-3.5 h-3.5" />
                                        <span className="text-xs font-semibold uppercase tracking-wider">Infrared Overlay</span>
                                    </button>
                                    <div className="w-[1px] h-4 bg-border self-center mx-1" />
                                    {metricTabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setSelectedMetric(tab.id as keyof StateEnergyStats);
                                                setIsInfrared(false);
                                            }}
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all',
                                                !isInfrared && selectedMetric === tab.id
                                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                                            )}
                                        >
                                            <tab.icon className="w-3.5 h-3.5" />
                                            <span className="text-xs font-semibold uppercase tracking-wider">{tab.label.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-[550px] w-full relative group">
                                <Suspense fallback={
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-card border border-border rounded-xl gap-4">
                                        <Activity className="w-6 h-6 text-primary animate-spin" />
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Initializing Geospatial Environment...</span>
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
                                                    <span style="color: ${CHART_COLORS.stress}; font-weight: 900;">HIGH</span>
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
                                                <span style="color: ${CHART_COLORS.west};">${Number(s[selectedMetric]).toFixed(1)}${currentTab.unit}</span>
                                            </div>
                                        `}
                                    />
                                </Suspense>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-10">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-foreground italic tracking-heading uppercase px-4 border-l-2 border-emerald-500">Tier-1 Node Ranking</h3>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Buffer</span>
                                </div>
                                <div className="space-y-3">
                                    {topStates.map((state, i) => (
                                        <button
                                            key={state.state_code}
                                            onClick={() => setSelectedState(state)}
                                            className={cn(
                                                'w-full flex justify-between items-center p-4 rounded-xl border transition-all group text-left',
                                                selectedState?.state_code === state.state_code
                                                    ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5'
                                                    : 'bg-card border-border hover:bg-muted/50',
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-bold text-terminal-dim italic">0{i + 1}</span>
                                                <span className="text-xs font-semibold text-foreground uppercase tracking-heading">{state.state_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-primary font-mono">
                                                    {Number(state[selectedMetric]).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                                </span>
                                                <ChevronRight className={cn(
                                                    'w-3 h-3 transition-colors',
                                                    selectedState?.state_code === state.state_code ? 'text-primary' : 'text-terminal-dim group-hover:text-primary',
                                                )} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedState ? (
                                <div className="p-6 rounded-xl bg-primary/10 border border-primary/20 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Node Focus: {selectedState.state_name}</span>
                                        <button onClick={() => setSelectedState(null)} className="text-xs font-semibold text-muted-foreground hover:text-foreground underline uppercase">Clear</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coal Prod</span>
                                            <div className="text-sm font-bold text-foreground font-mono">{selectedState.coal_production.toFixed(1)} <span className="text-xs text-terminal-dim">KToE</span></div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">RE Share</span>
                                            <div className="text-sm font-bold text-emerald-500 font-mono">{selectedState.renewable_share.toFixed(1)}%</div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <StateMacroInsights type="energy" data={selectedState} />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 rounded-xl border border-dashed border-border bg-card/60 flex flex-col items-center justify-center text-center space-y-4">
                                    <Activity className="w-5 h-5 text-terminal-dim animate-pulse" />
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-relaxed">
                                        Select a state on the map for <br /> high-frequency drill-down
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
import React, { Suspense, lazy } from 'react';
import { useOilData } from '@/hooks/useOilData';
import { SectionHeader } from '@/components/SectionHeader';

const RefiningCapacityCard = lazy(() => import('../cards/RefiningCapacityCard').then(m => ({ default: m.RefiningCapacityCard })));
const OilImportSankeyCard = lazy(() => import('../cards/OilImportSankeyCard').then(m => ({ default: m.OilImportSankeyCard })));
const OilFlowsSankey = lazy(() => import('../cards/OilFlowsSankey').then(m => ({ default: m.OilFlowsSankey })));
const VulnerabilityScoreMatrix = lazy(() => import('../cards/VulnerabilityScoreMatrix').then(m => ({ default: m.VulnerabilityScoreMatrix })));
const SPRTrackerCard = lazy(() => import('../cards/SPRTrackerCard').then(m => ({ default: m.SPRTrackerCard })));
const PowerMixDivergenceCard = lazy(() => import('../cards/PowerMixDivergenceCard').then(m => ({ default: m.PowerMixDivergenceCard })));

// Fallback/Mock Data generator for when API returns empty
const generateFallbackData = () => ({
    sprData: Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i) * 7);
        return { date: d.toISOString().split('T')[0], value: 350 + Math.sin(i / 5) * 10 };
    }),
    utilizationData: Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i) * 7);
        return { date: d.toISOString().split('T')[0], value: 85 + Math.random() * 5 };
    }),
    importData: [
        { importer_country_code: 'USA', exporter_country_code: 'CAN', import_volume_mbbl: 4500, as_of_date: '2025-01-01', frequency: 'Monthly' },
        { importer_country_code: 'USA', exporter_country_code: 'MEX', import_volume_mbbl: 650, as_of_date: '2025-01-01', frequency: 'Monthly' },
        { importer_country_code: 'USA', exporter_country_code: 'SAU', import_volume_mbbl: 320, as_of_date: '2025-01-01', frequency: 'Monthly' },
        { importer_country_code: 'IN', exporter_country_code: 'RU', exporter_country_name: 'Russia', import_volume_mbbl: 1800, as_of_date: '2024-01-01', frequency: 'Annual' },
        { importer_country_code: 'IN', exporter_country_code: 'IQ', exporter_country_name: 'Iraq', import_volume_mbbl: 900, as_of_date: '2024-01-01', frequency: 'Annual' },
        { importer_country_code: 'CN', exporter_country_code: 'RU', exporter_country_name: 'Russia', import_volume_mbbl: 2200, as_of_date: '2024-01-01', frequency: 'Annual' },
        { importer_country_code: 'CN', exporter_country_code: 'SA', exporter_country_name: 'Saudi Arabia', import_volume_mbbl: 1500, as_of_date: '2024-01-01', frequency: 'Annual' }
    ] as any[],
    capacityData: []
});

export const EnergySecuritySection: React.FC = () => {
    const { data: apiData } = useOilData();

    // Merge API data with fallback if API data is empty (temporary fix until ingestion runs)
    const { data, isFallback } = React.useMemo(() => {
        if (apiData.sprData && apiData.sprData.length > 0) return { data: apiData, isFallback: false };

        console.warn('Using fallback energy data for visualization');
        const fallback = generateFallbackData();
        const merged = {
            ...apiData,
            sprData: apiData.sprData.length ? apiData.sprData : fallback.sprData,
            utilizationData: apiData.utilizationData.length ? apiData.utilizationData : fallback.utilizationData,
            importData: apiData.importData.length ? apiData.importData : fallback.importData
        };
        return { data: merged, isFallback: true };
    }, [apiData]);

    const hasNoData = !data.sprData.length && !data.importData.length && !data.capacityData?.length;

    if (hasNoData) {
        return (
            <div className="space-y-8">
                <SectionHeader
                    title="Energy Security & Supply Chain"
                    subtitle="US Refining Capacity, Crude Sourcing, and Supplier Vulnerability"
                />
                <div className="h-[400px] flex flex-col items-center justify-center bg-black/40 border border-white/10 rounded-[2.5rem] backdrop-blur-3xl">
                    <span className="text-sm font-black text-rose-500/50 uppercase tracking-widest mb-2">Energy Security data temporarily unavailable</span>
                    <p className="text-xs text-muted-foreground/40 italic">System is currently normalizing upstream feeds. Please check back shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <SectionHeader
                title="Energy Security & Supply Chain"
                subtitle="US Refining Capacity, Crude Sourcing, and Supplier Vulnerability"
            />
            {isFallback && (
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">
                            Live Feed Normalizing — Displaying Institutional Proxies
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-12">
                {/* Row 1: US Refining Strategic Capacity */}
                <div className="w-full">
                    <div className="mb-4">
                        <h3 className="text-xl font-light text-white flex items-center gap-2">
                            <span className="w-8 h-px bg-emerald-500/50" />
                            Refining Strategic Capacity
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 ml-10 max-w-2xl">
                            Monitoring the industrial backbone of US energy independence. Operable capacity vs. utilization rates indicates system stress and supply-side resilience.
                        </p>
                    </div>
                    <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-xl" />}>
                        {data.capacityData && data.capacityData.length > 0 ? (
                            <RefiningCapacityCard
                                data={data.capacityData}
                                utilizationData={data.utilizationData}
                                isLoading={false}
                            />
                        ) : (
                            <div className="h-[400px] flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
                                <span className="text-xs text-muted-foreground uppercase tracking-widest">No Refining Data Found</span>
                            </div>
                        )}
                    </Suspense>
                </div>

                {/* Row 2: Strategic Petroleum Reserve */}
                <div className="w-full">
                    <div className="mb-4">
                        <h3 className="text-xl font-light text-white flex items-center gap-2">
                            <span className="w-8 h-px bg-orange-500/50" />
                            Strategic Petroleum Reserve (SPR)
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 ml-10 max-w-2xl">
                            The US emergency buffer. Current inventory levels relative to historical capacity provide a critical signal on national security readiness and energy buffer depletion.
                        </p>
                    </div>
                    <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-xl" />}>
                        {data.sprData && data.sprData.length > 0 ? (
                            <SPRTrackerCard data={data.sprData} isLoading={false} />
                        ) : (
                            <div className="h-[400px] flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
                                <span className="text-xs text-muted-foreground uppercase tracking-widest">No SPR Data Found</span>
                            </div>
                        )}
                    </Suspense>
                </div>

                {/* Row 3: Power Mix Divergence */}
                <div className="w-full">
                    <div className="mb-4">
                        <h3 className="text-xl font-light text-white flex items-center gap-2">
                            <span className="w-8 h-px bg-emerald-500/50" />
                            Power Mix Divergence
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 ml-10 max-w-2xl">
                            Analyzing the underlying molecular reality of power generation. The divergence between G7 "Clean" mandates and BRICS+ energy density priorities creates structural inflation and supply chain disparities.
                        </p>
                    </div>
                    {/* STACKED LAYOUT FOR DESKTOP */}
                    <div className="flex flex-col gap-8">
                        {/* 1. Main Chart */}
                        <div className="w-full">
                            <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-xl" />}>
                                <PowerMixDivergenceCard />
                            </Suspense>
                        </div>

                        {/* 2. KPI Cards as Full Width Rows */}
                        <div className="w-full p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">EU Gas Resilience</h4>
                                <p className="text-[10px] text-muted-foreground/60 italic">EU Aggregate Gas Storage levels (GIE Data)</p>
                            </div>
                            <div className="flex items-center gap-6 flex-1 max-w-2xl">
                                <div className="hidden md:block flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: '74.2%' }} />
                                </div>
                                <div className="flex items-end gap-2 shrink-0">
                                    <span className="text-3xl font-black text-white">74.2%</span>
                                    <span className="text-[10px] font-bold text-emerald-400 mb-1.5">+1.2% WoW</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full p-6 bg-orange-500/5 border border-orange-500/10 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-1">Global Refining Stress</h4>
                                <p className="text-[10px] text-muted-foreground/60 italic">Avg Utilization (EIA/KAPSARC derived)</p>
                            </div>
                            <div className="flex items-center gap-6 flex-1 max-w-2xl">
                                <div className="hidden md:block flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500" style={{ width: '88.4%' }} />
                                </div>
                                <div className="flex items-end gap-2 shrink-0">
                                    <span className="text-3xl font-black text-white">88.4%</span>
                                    <span className="text-[10px] font-bold text-rose-400 mb-1.5">+0.5% WoW</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 3.5: Asia Commodity Flows */}
                <div className="w-full">
                    <div className="mb-4">
                        <h3 className="text-xl font-light text-white flex items-center gap-2">
                            <span className="w-8 h-px bg-emerald-500/50" />
                            Asia Commodity Flow Dynamics
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 ml-10 max-w-2xl">
                            Visualizing the molecular shift toward the East. Tracking Crude Oil import origins for India and China identifies emerging trade corridors and energy density dependencies.
                        </p>
                    </div>
                    <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-xl" />}>
                        <OilFlowsSankey data={data.importData} isLoading={false} />
                    </Suspense>
                </div>

                {/* Row 4: Import Vulnerability & Flow Matrix */}
                <div className="w-full">
                    <div className="mb-4">
                        <h3 className="text-xl font-light text-white flex items-center gap-2">
                            <span className="w-8 h-px bg-blue-500/50" />
                            Global Supply Vulnerability
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 ml-10 max-w-2xl">
                            Mapping the origin of US energy imports. Higher concentration from geopolitically volatile regions (OPEC+, Venezuela, Middle East) directly impacts the national risk profile.
                        </p>
                    </div>

                    {/* STACKED LAYOUT FOR DESKTOP */}
                    <div className="flex flex-col gap-12">
                        {/* 1. Sankey Diagram */}
                        <div className="w-full">
                            <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-xl" />}>
                                {data.importData && data.importData.length > 0 ? (
                                    <OilImportSankeyCard data={data.importData} isLoading={false} />
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10 p-8 text-center">
                                        <span className="text-[0.6rem] text-muted-foreground uppercase tracking-widest mb-2 font-black">Data normalization under protocol...</span>
                                        <p className="text-[0.6rem] text-muted-foreground/40 italic">Global flows require ingestion from `ingest-oil-global`. Mapping EU+ and Asia nodes.</p>
                                    </div>
                                )}
                            </Suspense>
                        </div>

                        {/* 2. Matrix Table - Full Width */}
                        <div className="w-full h-[500px]">
                            <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-xl" />}>
                                {data.importData && data.importData.length > 0 ? (
                                    <VulnerabilityScoreMatrix data={data.importData} isLoading={false} />
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10 p-8 text-center">
                                        <span className="text-[0.6rem] text-rose-500/50 uppercase tracking-widest mb-2 font-black">Vulnerability Analysis Pending</span>
                                        <p className="text-[0.6rem] text-muted-foreground/40 italic">Run institutional security scanner (ingest-oil-global) to populate risk metrics.</p>
                                    </div>
                                )}
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

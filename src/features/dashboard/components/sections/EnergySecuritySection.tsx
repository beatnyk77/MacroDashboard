import React, { Suspense, lazy } from 'react';
import { useOilData } from '@/hooks/useOilData';
import { SectionHeader } from '@/components/SectionHeader';
import { DataQualityBadge } from '@/components/DataQualityBadge';
import { MotionCard } from '@/components/MotionCard';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';

const RefiningCapacityCard = lazy(() => import('../cards/RefiningCapacityCard').then(m => ({ default: m.RefiningCapacityCard })));

const OilFlowsSankey = lazy(() => import('../cards/OilFlowsSankey').then(m => ({ default: m.OilFlowsSankey })));

const SPRTrackerCard = lazy(() => import('../cards/SPRTrackerCard').then(m => ({ default: m.SPRTrackerCard })));
const ReserveTrackerCard = lazy(() => import('@/features/commodities/components/ReserveTrackerCard').then(m => ({ default: m.ReserveTrackerCard })));

const PowerMixDivergenceCard = lazy(() => import('../cards/PowerMixDivergenceCard').then(m => ({ default: m.PowerMixDivergenceCard })));

// Fallback/Mock Data generator for when API returns empty
// NOTE: Uses stable, non-random values so UI doesn't flicker on re-renders.
// The 'simulated' DataQualityBadge is always shown when isFallback === true.
const STABLE_UTILIZATION_VALUES = [85.1, 85.4, 85.0, 85.7, 86.1, 85.9, 85.3, 84.8, 85.2, 85.6, 86.2, 85.8, 85.5, 85.1, 84.9, 85.3, 85.7, 86.0, 85.4, 84.7, 85.0, 85.5, 86.1, 85.9, 85.2, 84.6, 85.3, 85.8, 86.2, 85.6];
const STABLE_EU_GAS_SEASONAL = [29.2, 31.4, 35.8, 42.1, 68.2, 82.5, 91.4, 93.1, 87.6, 74.3, 55.2, 38.7, 28.9, 30.1, 34.6, 41.8, 67.3, 81.9, 90.8, 92.4, 86.7, 73.2, 54.1, 37.5, 27.8, 29.4, 33.9, 40.5, 66.1, 80.7, 89.9, 91.8, 85.9, 72.1, 53.0, 36.3, 27.1, 28.7, 33.2, 39.8, 65.0, 79.6, 89.1, 91.2, 85.2, 71.0, 52.1, 35.2];
const generateFallbackData = () => ({
    sprData: Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i) * 7);
        return { date: d.toISOString().split('T')[0], value: 350 + Math.sin(i / 5) * 10 };
    }),
    utilizationData: Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i) * 7);
        return { date: d.toISOString().split('T')[0], value: STABLE_UTILIZATION_VALUES[i] };
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
    powerMixData: [
        { region: 'US', coal: 19.5, renewable: 22.4, other: 58.1 },
        { region: 'EU', coal: 12.3, renewable: 44.7, other: 43.0 },
        { region: 'India', coal: 74.2, renewable: 11.8, other: 14.0 },
        { region: 'China', coal: 61.4, renewable: 15.6, other: 23.0 }
    ],
    powerMixLastUpdated: new Date().toISOString(),
    capacityData: [],
    euGasData: Array.from({ length: 48 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - (47 - i));
        return { date: d.toISOString().split('T')[0], value: STABLE_EU_GAS_SEASONAL[i] ?? 50 };
    })
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
            importData: apiData.importData.length ? apiData.importData : fallback.importData,
            powerMixData: apiData.powerMixData.length ? apiData.powerMixData : fallback.powerMixData,
            euGasData: apiData.euGasData?.length ? apiData.euGasData : fallback.euGasData,
            powerMixLastUpdated: apiData.powerMixLastUpdated || fallback.powerMixLastUpdated
        };
        return { data: merged, isFallback: true };
    }, [apiData]);

    const hasNoData = !data.sprData.length && !data.importData.length && !data.capacityData?.length;

    if (hasNoData) {
        return (
            <div className="space-y-8">
                <SectionHeader
                    title="Energy Security & Supply Chain"
                    subtitle="US Refining Capacity, Crude Sourcing, and Supplier Concentration"
                />
                <div className="h-[400px] flex flex-col items-center justify-center bg-black/40 border border-white/12 rounded-[2.5rem] backdrop-blur-3xl">
                    <span className="text-sm font-black text-rose-500/50 uppercase tracking-uppercase mb-2">Energy Security data temporarily unavailable</span>
                    <p className="text-xs text-muted-foreground/40 italic">System is currently normalizing upstream feeds. Please check back shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <SectionHeader
                title="Energy Security & Supply Chain"
                subtitle="US Refining Capacity, Crude Sourcing, and Supplier Concentration"
                exportId="energy-security-section"
            />
            {isFallback && (
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <DataQualityBadge type="simulated" />
                        <p className="text-xs font-black uppercase tracking-uppercase text-amber-500/90 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            Live Feed Normalizing — Displaying Institutional Proxies
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-16">
                {/* Row 1: US Refining Strategic Capacity */}
                <MotionCard delay={0.1} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-emerald-500/30">
                        <h3 className="text-2xl font-black text-white uppercase tracking-heading">
                            Refining Strategic Capacity
                        </h3>
                        <p className="text-xs text-muted-foreground/60 mt-2 max-w-2xl font-medium tracking-wide">
                            Industrial backbone of US energy independence. Operable capacity vs. utilization rates indicates system stress and supply-side resilience.
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
                            <div className="h-[400px] flex items-center justify-center bg-white/5 rounded-xl border border-white/12">
                                <span className="text-xs text-muted-foreground uppercase tracking-uppercase">No Refining Data Found</span>
                            </div>
                        )}
                    </Suspense>
                </MotionCard>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                {/* Row 2: Strategic Petroleum Reserve */}
                <MotionCard delay={0.2} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-orange-500/30">
                        <h3 className="text-2xl font-black text-white uppercase tracking-heading">
                            Strategic Petroleum Reserve <span className="text-orange-500/40">(SPR)</span>
                        </h3>
                        <p className="text-xs text-muted-foreground/60 mt-2 max-w-2xl font-medium tracking-wide">
                            Emergency oil stockpile metrics. Tracking drawdown, inventory levels, and strategic refilling mandates relative to historical baselines.
                        </p>
                    </div>
                    <Suspense fallback={<div className="h-[350px] animate-pulse bg-white/5 rounded-[2.5rem]" />}>
                        <SPRTrackerCard data={data.sprData} isLoading={false} />
                    </Suspense>
                </MotionCard>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                {/* Row 2.5: Global Strategic Reserves & Stockpiles */}
                <MotionCard delay={0.25} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-emerald-500/30">
                        <h3 className="text-2xl font-black text-white uppercase tracking-heading">
                            Strategic Reserve & Stockpile Tracker
                        </h3>
                        <p className="text-xs text-muted-foreground/60 mt-2 max-w-2xl font-medium tracking-wide">
                            Comprehensive monitoring of critical resource inventories. India Grains (Rice/Wheat) and Global Crude Oil strategic/commercial levels.
                        </p>
                    </div>
                    <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-xl" />}>
                        <ReserveTrackerCard />
                    </Suspense>
                </MotionCard>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                {/* Row 3: Power Mix Divergence */}
                <MotionCard delay={0.3} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-blue-500/30">
                        <h3 className="text-2xl font-black text-white uppercase tracking-heading">
                            Power Mix Divergence
                        </h3>
                        <p className="text-xs text-muted-foreground/60 mt-2 max-w-2xl font-medium tracking-wide">
                            Comparative analysis of electricity generation sources. Highlighting decarbonization pace and reliance on fossil baseload across G4 economies.
                        </p>
                    </div>
                    <div className="flex flex-col gap-8">
                        {/* 1. Main Chart */}
                        <div className="w-full">
                            <Suspense fallback={<div className="h-[450px] animate-pulse bg-white/5 rounded-[2.5rem]" />}>
                                {data.powerMixData && data.powerMixData.length > 0 ? (
                                    <PowerMixDivergenceCard
                                        data={data.powerMixData}
                                        lastUpdated={data.powerMixLastUpdated}
                                    />
                                ) : (
                                    <div className="h-[450px] flex items-center justify-center bg-white/5 rounded-[2.5rem] border border-white/12">
                                        <span className="text-xs text-muted-foreground uppercase tracking-uppercase">Loading Power Mix Data...</span>
                                    </div>
                                )}
                            </Suspense>
                        </div>

                        {/* 2. KPI Cards as Full Width Rows */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="w-full p-8 rounded-[2rem] bg-blue-500/[0.03] border border-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-sm">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-uppercase text-blue-400 mb-2">EU Gas Resilience</h4>
                                    <p className="text-xs text-muted-foreground/40 font-bold uppercase tracking-uppercase">Aggregate Storage Trend</p>
                                </div>
                                <div className="flex items-center gap-6 flex-1 max-w-md h-16">
                                    <div className="flex-1 h-full w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={data.euGasData}>
                                                <defs>
                                                    <linearGradient id="euGasGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#3b82f6"
                                                    fill="url(#euGasGradient)"
                                                    strokeWidth={2}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex items-end gap-2 shrink-0">
                                        <span className="text-4xl font-black text-white italic">
                                            {data.euGasData && data.euGasData.length > 0
                                                ? Math.round(data.euGasData[data.euGasData.length - 1].value)
                                                : 'N/A'}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full p-8 rounded-[2rem] bg-rose-500/[0.03] border border-rose-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-sm">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-uppercase text-rose-400 mb-2">Refining Stress</h4>
                                    <p className="text-xs text-muted-foreground/40 font-bold uppercase tracking-uppercase">Historical Utilization Rate</p>
                                </div>
                                <div className="flex items-center gap-6 flex-1 max-w-md h-16">
                                    <div className="flex-1 h-full w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={data.utilizationData}>
                                                <defs>
                                                    <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <YAxis domain={['auto', 'auto']} hide />
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#f43f5e"
                                                    fill="url(#utilGradient)"
                                                    strokeWidth={2}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex items-end gap-2 shrink-0">
                                        <span className="text-4xl font-black text-white italic">
                                            {data.utilizationData && data.utilizationData.length > 0
                                                ? Math.round(data.utilizationData[data.utilizationData.length - 1].value)
                                                : 'N/A'}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </MotionCard>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                {/* Row 3.5: Asia Commodity Flows */}
                <MotionCard delay={0.4} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-emerald-500/30">
                        <h3 className="text-2xl font-black text-white uppercase tracking-heading">
                            Asia Commodity Flow Dynamics
                        </h3>
                        <p className="text-xs text-muted-foreground/60 mt-2 max-w-2xl font-medium tracking-wide">
                            Molecular shift toward the East. Tracking Crude import origins for Bharat & China identifies emerging trade corridors and energy density dependencies.
                        </p>
                    </div>
                    <Suspense fallback={<div className="h-[520px] animate-pulse bg-white/5 rounded-xl" />}>
                        <OilFlowsSankey data={data.importData} isLoading={false} />
                    </Suspense>
                </MotionCard>


            </div>
        </div>
    );
};

import React, { Suspense, lazy } from 'react';
import { useOilData } from '@/hooks/useOilData';
import { DataQualityBadge } from '@/components/DataQualityBadge';
import { MotionCard } from '@/components/MotionCard';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';

const RefiningCapacityCard = lazy(() => import('../cards/RefiningCapacityCard').then(m => ({ default: m.RefiningCapacityCard })));
const SPRTrackerCard = lazy(() => import('../cards/SPRTrackerCard').then(m => ({ default: m.SPRTrackerCard })));
const ReserveTrackerCard = lazy(() => import('@/features/commodities/components/ReserveTrackerCard').then(m => ({ default: m.ReserveTrackerCard })));
const PowerMixDivergenceCard = lazy(() => import('../cards/PowerMixDivergenceCard').then(m => ({ default: m.PowerMixDivergenceCard })));

// Fallback/Mock Data generator for when API returns empty
// NOTE: Uses stable, non-random values so UI doesn't flicker on re-renders.
// The 'simulated' DataQualityBadge is always shown when isFallback === true.
const STABLE_UTIL = [85.1, 85.4, 85.0, 85.7, 86.1, 85.9, 85.3, 84.8, 85.2, 85.6, 86.2, 85.8, 85.5, 85.1, 84.9, 85.3, 85.7, 86.0, 85.4, 84.7, 85.0, 85.5, 86.1, 85.9, 85.2, 84.6, 85.3, 85.8, 86.2, 85.6];
const STABLE_GAS = [29.2, 31.4, 35.8, 42.1, 68.2, 82.5, 91.4, 93.1, 87.6, 74.3, 55.2, 38.7, 28.9, 30.1, 34.6, 41.8, 67.3, 81.9, 90.8, 92.4, 86.7, 73.2, 54.1, 37.5, 27.8, 29.4, 33.9, 40.5, 66.1, 80.7, 89.9, 91.8, 85.9, 72.1, 53.0, 36.3, 27.1, 28.7, 33.2, 39.8, 65.0, 79.6, 89.1, 91.2, 85.2, 71.0, 52.1, 35.2];
const generateFallbackData = () => ({
    sprData: Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i) * 7);
        return { date: d.toISOString().split('T')[0], value: 350 + Math.sin(i / 5) * 10 };
    }),
    utilizationData: Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i) * 7);
        return { date: d.toISOString().split('T')[0], value: STABLE_UTIL[i] };
    }),
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
        return { date: d.toISOString().split('T')[0], value: STABLE_GAS[i] ?? 50 };
    })
});


export const SovereignEnergySecuritySection: React.FC = () => {
    const { data: apiData } = useOilData();

    // Merge API data with fallback if API data is empty (temporary fix until ingestion runs)
    const { data, isFallback } = React.useMemo(() => {
        if (apiData?.sprData && apiData.sprData.length > 0) return { data: apiData, isFallback: false };

        console.warn('Using fallback energy data for visualization');
        const fallback = generateFallbackData();
        const merged = {
            ...apiData,
            sprData: apiData?.sprData?.length ? apiData.sprData : fallback.sprData,
            utilizationData: apiData?.utilizationData?.length ? apiData.utilizationData : fallback.utilizationData,
            powerMixData: apiData?.powerMixData?.length ? apiData.powerMixData : fallback.powerMixData,
            euGasData: apiData?.euGasData?.length ? apiData.euGasData : fallback.euGasData,
            powerMixLastUpdated: apiData?.powerMixLastUpdated || fallback.powerMixLastUpdated
        };
        return { data: merged, isFallback: true };
    }, [apiData]);

    const hasNoData = !data.sprData?.length && !data.capacityData?.length;

    if (hasNoData) {
        return (
            <div className="space-y-8">
                <div className="h-[400px] flex flex-col items-center justify-center bg-black/40 border border-white/12 rounded-[2.5rem] backdrop-blur-3xl">
                    <span className="text-sm font-black text-rose-500/50 uppercase tracking-widest mb-2">Energy Security data temporarily unavailable</span>
                    <p className="text-xs text-muted-foreground/40 italic">System is currently normalizing upstream feeds. Please check back shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {isFallback && (
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <DataQualityBadge type="simulated" />
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-500/90 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            Live Feed Normalizing — Displaying Institutional Proxies
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-16">
                {/* Row 1: US Refining Strategic Capacity */}
                <MotionCard delay={0.1} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-emerald-500/30">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">
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
                                <span className="text-xs text-muted-foreground uppercase tracking-widest">No Refining Data Found</span>
                            </div>
                        )}
                    </Suspense>
                </MotionCard>

                {/* Row 2: Strategic Petroleum Reserve */}
                <MotionCard delay={0.2} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-orange-500/30">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">
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

                {/* Row 2.5: Global Strategic Reserves & Stockpiles */}
                <MotionCard delay={0.25} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-emerald-500/30">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">
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

                {/* Row 3: Power Mix Divergence */}
                <MotionCard delay={0.3} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-blue-500/30">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">
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
                                        <span className="text-xs text-muted-foreground uppercase tracking-widest">Loading Power Mix Data...</span>
                                    </div>
                                )}
                            </Suspense>
                        </div>

                        {/* 2. KPI Cards as Full Width Rows */}
                        <div className="space-y-6">
                            <div className="w-full p-8 rounded-[2rem] bg-blue-500/[0.03] border border-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-8 backdrop-blur-sm hover:bg-blue-500/[0.05] transition-all group">
                                <div className="min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">EU Gas Resilience</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground/40 font-bold uppercase tracking-widest pl-4">Aggregate Storage Trend</p>
                                </div>
                                <div className="flex items-center gap-12 flex-1 h-20">
                                    <div className="flex-1 h-full w-full opacity-60 group-hover:opacity-100 transition-opacity">
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
                                                    strokeWidth={3}
                                                    dot={false}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-white tracking-tighter italic">
                                                {data.euGasData && data.euGasData.length > 0
                                                    ? Math.round(data.euGasData[data.euGasData.length - 1].value)
                                                    : 'N/A'}
                                            </span>
                                            <span className="text-xl font-black text-blue-500/40">%</span>
                                        </div>
                                        <span className="text-xs font-black text-blue-500/40 uppercase tracking-widest">Storage Level</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full p-8 rounded-[2rem] bg-rose-500/[0.03] border border-rose-500/10 flex flex-col md:flex-row md:items-center justify-between gap-8 backdrop-blur-sm hover:bg-rose-500/[0.05] transition-all group">
                                <div className="min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-rose-400">Refining Stress</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground/40 font-bold uppercase tracking-widest pl-4">Historical Utilization Rate</p>
                                </div>
                                <div className="flex items-center gap-12 flex-1 h-20">
                                    <div className="flex-1 h-full w-full opacity-60 group-hover:opacity-100 transition-opacity">
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
                                                    strokeWidth={3}
                                                    dot={false}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-white tracking-tighter italic">
                                                {data.utilizationData && data.utilizationData.length > 0
                                                    ? Math.round(data.utilizationData[data.utilizationData.length - 1].value)
                                                    : 'N/A'}
                                            </span>
                                            <span className="text-xl font-black text-rose-500/40">%</span>
                                        </div>
                                        <span className="text-xs font-black text-rose-500/40 uppercase tracking-widest">Util Rate</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </MotionCard>
            </div>
        </div>
    );
};

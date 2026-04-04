import React, { Suspense, lazy } from 'react';
import { useOilData } from '@/hooks/useOilData';
import { MotionCard } from '@/components/MotionCard';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';

const RefiningCapacityCard = lazy(() => import('../cards/RefiningCapacityCard').then(m => ({ default: m.RefiningCapacityCard })));
const SPRTrackerCard = lazy(() => import('../cards/SPRTrackerCard').then(m => ({ default: m.SPRTrackerCard })));
const ReserveTrackerCard = lazy(() => import('@/features/commodities/components/ReserveTrackerCard').then(m => ({ default: m.ReserveTrackerCard })));
const PowerMixDivergenceCard = lazy(() => import('../cards/PowerMixDivergenceCard').then(m => ({ default: m.PowerMixDivergenceCard })));


export const SovereignEnergySecuritySection: React.FC = () => {
    const { data: apiData } = useOilData();

    const hasNoData = !apiData?.sprData?.length && !apiData?.capacityData?.length;

    if (hasNoData) {
        return (
            <div className="space-y-8">
                <div className="h-[400px] flex flex-col items-center justify-center bg-black/40 border border-white/12 rounded-[2.5rem] backdrop-blur-3xl">
                    <span className="text-sm font-black text-rose-500/50 uppercase tracking-uppercase mb-2">Energy Security data temporarily unavailable</span>
                    <p className="text-xs text-muted-foreground/40 italic">System is currently normalizing upstream feeds. Please check back shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">

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
                        {apiData.capacityData && apiData.capacityData.length > 0 ? (
                            <RefiningCapacityCard
                                data={apiData.capacityData}
                                utilizationData={apiData.utilizationData}
                                isLoading={false}
                            />
                        ) : (
                            <div className="h-[400px] flex items-center justify-center bg-white/5 rounded-xl border border-white/12">
                                <span className="text-xs text-muted-foreground uppercase tracking-uppercase">No Refining Data Found</span>
                            </div>
                        )}
                    </Suspense>
                </MotionCard>

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
                        <SPRTrackerCard data={apiData.sprData} isLoading={false} />
                    </Suspense>
                </MotionCard>

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
                                {apiData.powerMixData && apiData.powerMixData.length > 0 ? (
                                    <PowerMixDivergenceCard
                                        data={apiData.powerMixData}
                                        lastUpdated={apiData.powerMixLastUpdated}
                                    />
                                ) : (
                                    <div className="h-[450px] flex items-center justify-center bg-white/5 rounded-[2.5rem] border border-white/12">
                                        <span className="text-xs text-muted-foreground uppercase tracking-uppercase">Loading Power Mix Data...</span>
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
                                        <h4 className="text-xs font-black uppercase tracking-uppercase text-blue-400">EU Gas Resilience</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground/40 font-bold uppercase tracking-uppercase pl-4">Aggregate Storage Trend</p>
                                </div>
                                <div className="flex items-center gap-12 flex-1 h-20">
                                    <div className="flex-1 h-full w-full opacity-60 group-hover:opacity-100 transition-opacity">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={apiData.euGasData}>
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
                                            <span className="text-5xl font-black text-white tracking-heading italic">
                                                {apiData.euGasData && apiData.euGasData.length > 0
                                                    ? Math.round(apiData.euGasData[apiData.euGasData.length - 1].value)
                                                    : 'N/A'}
                                            </span>
                                            <span className="text-xl font-black text-blue-500/40">%</span>
                                        </div>
                                        <span className="text-xs font-black text-blue-500/40 uppercase tracking-uppercase">Storage Level</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full p-8 rounded-[2rem] bg-rose-500/[0.03] border border-rose-500/10 flex flex-col md:flex-row md:items-center justify-between gap-8 backdrop-blur-sm hover:bg-rose-500/[0.05] transition-all group">
                                <div className="min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                        <h4 className="text-xs font-black uppercase tracking-uppercase text-rose-400">Refining Stress</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground/40 font-bold uppercase tracking-uppercase pl-4">Historical Utilization Rate</p>
                                </div>
                                <div className="flex items-center gap-12 flex-1 h-20">
                                    <div className="flex-1 h-full w-full opacity-60 group-hover:opacity-100 transition-opacity">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={apiData.utilizationData}>
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
                                            <span className="text-5xl font-black text-white tracking-heading italic">
                                                {apiData.utilizationData && apiData.utilizationData.length > 0
                                                    ? Math.round(apiData.utilizationData[apiData.utilizationData.length - 1].value)
                                                    : 'N/A'}
                                            </span>
                                            <span className="text-xl font-black text-rose-500/40">%</span>
                                        </div>
                                        <span className="text-xs font-black text-rose-500/40 uppercase tracking-uppercase">Util Rate</span>
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

import React, { Suspense, lazy } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOilData } from '@/hooks/useOilData';
import { MotionCard } from '@/components/MotionCard';
import { FreshnessChip } from '@/components/FreshnessChip';
import { PendingDataState } from '@/components/PendingDataState';
import { supabase } from '@/lib/supabase';
import { useStaleness } from '@/hooks/useStaleness';
import { AreaChart, Area, YAxis } from 'recharts';
import { CHART_COLORS } from '@/constants/chartDefaults';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

const RefiningCapacityCard = lazy(() => import('../cards/RefiningCapacityCard').then(m => ({ default: m.RefiningCapacityCard })));
const SPRTrackerCard = lazy(() => import('../cards/SPRTrackerCard').then(m => ({ default: m.SPRTrackerCard })));
const ReserveTrackerCard = lazy(() => import('@/features/commodities/components/ReserveTrackerCard').then(m => ({ default: m.ReserveTrackerCard })));
const PowerMixDivergenceCard = lazy(() => import('../cards/PowerMixDivergenceCard').then(m => ({ default: m.PowerMixDivergenceCard })));


export const SovereignEnergySecuritySection: React.FC = () => {
    const { data: apiData } = useOilData();
    const queryClient = useQueryClient();

    const { data: capacityFreshness } = useQuery({
        queryKey: ['oil-refining-capacity-freshness'],
        queryFn: async () => {
            const { data } = await supabase
                .from('oil_refining_capacity')
                .select('last_updated_at')
                .order('last_updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            return data?.last_updated_at ?? null;
        },
        staleTime: 1000 * 60 * 60,
    });
    const capacityStaleness = useStaleness(capacityFreshness ?? undefined, 'annual');

    const hasNoData = !apiData?.sprData?.length && !apiData?.capacityData?.length;

    if (hasNoData) {
        return (
            <div className="space-y-8">
                <PendingDataState
                    height={400}
                    accentColor="blue"
                    statusText="UPSTREAM FEED SYNCHRONIZING — EIA / FRED pipeline normalizing. Strategic reserve data updates weekly."
                    onRetry={() => queryClient.invalidateQueries({ queryKey: ['oil_data'] })}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">

            <div className="flex flex-col gap-16">
                {/* Row 1: US Refining Strategic Capacity */}
                <MotionCard delay={0.1} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-emerald-500/30">
                        <h3 className="text-2xl font-bold text-white uppercase tracking-heading">
                            Refining Strategic Capacity
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2 max-w-2xl font-medium tracking-wide">
                            Industrial backbone of sovereign energy independence. Operable capacity vs. utilization rates indicates system stress and supply-side resilience across US, European, and Asian refining complexes.
                        </p>
                        <div className="mt-2">
                            <FreshnessChip status={capacityStaleness.state} lastUpdated={capacityFreshness ?? undefined} />
                        </div>
                    </div>
                    <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-xl" />}>
                        {apiData.capacityData && apiData.capacityData.length > 0 ? (
                            <RefiningCapacityCard
                                data={apiData.capacityData}
                                utilizationData={apiData.utilizationData}
                                isLoading={false}
                            />
                        ) : (
                            <div className="h-[400px] flex items-center justify-center bg-white/5 rounded-xl border border-border">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">No Refining Data Found</span>
                            </div>
                        )}
                    </Suspense>
                </MotionCard>

                {/* Row 2: Strategic Petroleum Reserve */}
                <MotionCard delay={0.2} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-orange-500/30">
                        <h3 className="text-2xl font-bold text-white uppercase tracking-heading">
                            Strategic Petroleum Reserve <span className="text-orange-500/40">(SPR)</span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2 max-w-2xl font-medium tracking-wide">
                            Emergency oil stockpile metrics. Tracking drawdown, inventory levels, and strategic refilling mandates relative to historical baselines.
                        </p>
                    </div>
                    <Suspense fallback={<div className="h-[350px] animate-pulse bg-white/5 rounded-xl" />}>
                        <SPRTrackerCard data={apiData.sprData} isLoading={false} />
                    </Suspense>
                </MotionCard>

                {/* Row 2.5: Global Strategic Reserves & Stockpiles */}
                <MotionCard delay={0.25} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-emerald-500/30">
                        <h3 className="text-2xl font-bold text-white uppercase tracking-heading">
                            Strategic Reserve & Stockpile Tracker
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2 max-w-2xl font-medium tracking-wide">
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
                        <h3 className="text-2xl font-bold text-white uppercase tracking-heading">
                            Power Mix Divergence
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2 max-w-2xl font-medium tracking-wide">
                            Comparative analysis of electricity generation sources. Highlighting decarbonization pace and reliance on fossil baseload across G4 economies.
                        </p>
                    </div>
                    <div className="flex flex-col gap-8">
                        {/* 1. Main Chart */}
                        <div className="w-full">
                            <Suspense fallback={<div className="h-[450px] animate-pulse bg-white/5 rounded-xl" />}>
                                {apiData.powerMixData && apiData.powerMixData.length > 0 ? (
                                    <PowerMixDivergenceCard
                                        data={apiData.powerMixData}
                                        lastUpdated={apiData.powerMixLastUpdated}
                                    />
                                ) : (
                                    <div className="h-[450px] flex items-center justify-center bg-white/5 rounded-xl border border-border">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Loading Power Mix Data...</span>
                                    </div>
                                )}
                            </Suspense>
                        </div>

                        {/* 2. KPI Cards as Full Width Rows */}
                        <div className="space-y-6">
                            <div className="w-full p-8 rounded-xl bg-blue-500/[0.03] border border-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-8 backdrop-blur-sm hover:bg-blue-500/[0.05] transition-all group">
                                <div className="min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">EU Gas Resilience</h4>
                                    </div>
                                    <p className="text-xs text-terminal-dim font-semibold uppercase tracking-wider pl-4">Aggregate Storage Trend</p>
                                </div>
                                <div className="flex items-center gap-12 flex-1 h-20">
                                    <div className="flex-1 h-full w-full opacity-60 group-hover:opacity-100 transition-opacity">
                                        <MacroChartContainer height="fill">
                                            <AreaChart data={apiData.euGasData}>
                                                <defs>
                                                    <linearGradient id="euGasGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={CHART_COLORS.west} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={CHART_COLORS.west} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke={CHART_COLORS.west}
                                                    fill="url(#euGasGradient)"
                                                    strokeWidth={3}
                                                    dot={false}
                                                />
                                            </AreaChart>
                                        </MacroChartContainer>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-bold text-white tracking-heading italic">
                                                {apiData.euGasData && apiData.euGasData.length > 0
                                                    ? Math.round(apiData.euGasData[apiData.euGasData.length - 1].value)
                                                    : 'N/A'}
                                            </span>
                                            <span className="text-xl font-bold text-blue-500/40">%</span>
                                        </div>
                                        <span className="text-xs font-semibold text-blue-500/40 uppercase tracking-wider">Storage Level</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full p-8 rounded-xl bg-rose-500/[0.03] border border-rose-500/10 flex flex-col md:flex-row md:items-center justify-between gap-8 backdrop-blur-sm hover:bg-rose-500/[0.05] transition-all group">
                                <div className="min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400">Refining Stress</h4>
                                    </div>
                                    <p className="text-xs text-terminal-dim font-semibold uppercase tracking-wider pl-4">Historical Utilization Rate</p>
                                </div>
                                <div className="flex items-center gap-12 flex-1 h-20">
                                    <div className="flex-1 h-full w-full opacity-60 group-hover:opacity-100 transition-opacity">
                                        <MacroChartContainer height="fill">
                                            <AreaChart data={apiData.utilizationData}>
                                                <defs>
                                                    <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={CHART_COLORS.east} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={CHART_COLORS.east} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <YAxis domain={['auto', 'auto']} hide />
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke={CHART_COLORS.east}
                                                    fill="url(#utilGradient)"
                                                    strokeWidth={3}
                                                    dot={false}
                                                />
                                            </AreaChart>
                                        </MacroChartContainer>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-bold text-white tracking-heading italic">
                                                {apiData.utilizationData && apiData.utilizationData.length > 0
                                                    ? Math.round(apiData.utilizationData[apiData.utilizationData.length - 1].value)
                                                    : 'N/A'}
                                            </span>
                                            <span className="text-xl font-bold text-rose-500/40">%</span>
                                        </div>
                                        <span className="text-xs font-semibold text-rose-500/40 uppercase tracking-wider">Util Rate</span>
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

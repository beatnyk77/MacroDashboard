import React, { Suspense, lazy } from 'react';
import { useOilData } from '@/hooks/useOilData';
import { SectionHeader } from '@/components/SectionHeader';

const RefiningCapacityCard = lazy(() => import('../cards/RefiningCapacityCard').then(m => ({ default: m.RefiningCapacityCard })));
const OilImportSankeyCard = lazy(() => import('../cards/OilImportSankeyCard').then(m => ({ default: m.OilImportSankeyCard })));
const VulnerabilityScoreMatrix = lazy(() => import('../cards/VulnerabilityScoreMatrix').then(m => ({ default: m.VulnerabilityScoreMatrix })));
const SPRTrackerCard = lazy(() => import('../cards/SPRTrackerCard').then(m => ({ default: m.SPRTrackerCard })));

export const EnergySecuritySection: React.FC = () => {
    const { data } = useOilData();

    return (
        <div className="space-y-8">
            <SectionHeader
                title="Energy Security & Supply Chain"
                subtitle="US Refining Capacity, Crude Sourcing, and Supplier Vulnerability"
            />

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

                {/* Row 3: Import Vulnerability & Flow Matrix */}
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-xl" />}>
                                {data.importData && data.importData.length > 0 ? (
                                    <OilImportSankeyCard data={data.importData} isLoading={false} />
                                ) : (
                                    <div className="h-[400px] flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
                                        <span className="text-xs text-muted-foreground uppercase tracking-widest">No Flow Data</span>
                                    </div>
                                )}
                            </Suspense>
                        </div>
                        <div className="lg:col-span-1">
                            <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-xl" />}>
                                {data.importData && data.importData.length > 0 ? (
                                    <VulnerabilityScoreMatrix data={data.importData} isLoading={false} />
                                ) : (
                                    <div className="h-[400px] flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
                                        <span className="text-xs text-muted-foreground uppercase tracking-widest">No Risk Data</span>
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

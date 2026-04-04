import React, { Suspense, lazy } from 'react';
import { useOilData } from '@/hooks/useOilData';
import { MotionCard } from '@/components/MotionCard';

const OilImportVulnerabilityCard = lazy(() => import('../cards/OilImportVulnerabilityCard').then(m => ({ default: m.OilImportVulnerabilityCard })));
const OilFlowsSankey = lazy(() => import('../cards/OilFlowsSankey').then(m => ({ default: m.OilFlowsSankey })));
const VulnerabilityScoreMatrix = lazy(() => import('../cards/VulnerabilityScoreMatrix').then(m => ({ default: m.VulnerabilityScoreMatrix })));
const OilImportCostCard = lazy(() => import('../cards/OilImportCostCard').then(m => ({ default: m.OilImportCostCard })));

export const AsiaCommodityFlowsSection: React.FC = () => {
    const { data: apiData } = useOilData();

    const hasNoData = !apiData?.importData?.length;

    if (hasNoData) {
        return (
            <div className="space-y-8">
                <div className="h-[400px] flex flex-col items-center justify-center bg-black/40 border border-white/12 rounded-[2.5rem] backdrop-blur-3xl">
                    <span className="text-sm font-black text-rose-500/50 uppercase tracking-uppercase mb-2">Flows Data Not Available</span>
                    <p className="text-xs text-muted-foreground/40 italic">Oil import data ingestion has not yet completed. Please check back later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-16">
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
                        <OilFlowsSankey data={apiData.importData} isLoading={false} />
                    </Suspense>
                </MotionCard>

                {/* Row 3.6: Import Dependency Monitor */}
                <MotionCard delay={0.45} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-rose-500/30">
                        <h3 className="text-2xl font-black text-white uppercase tracking-heading">
                            Import Dependency Monitor
                        </h3>
                        <p className="text-xs text-muted-foreground/60 mt-2 max-w-2xl font-medium tracking-wide">
                            Economic impact of energy sourcing. Weighted average costs in local currency (INR/CNY) highlights the intersection of commodity cycles and FX volatility.
                        </p>
                    </div>
                    <Suspense fallback={<div className="h-[520px] animate-pulse bg-white/5 rounded-xl" />}>
                        <OilImportCostCard
                            importData={apiData.importData}
                            brentPriceData={apiData.brentPriceData || []}
                            isLoading={false}
                        />
                    </Suspense>
                </MotionCard>

                {/* Row 4: Import Vulnerability & Flow Matrix */}
                <MotionCard delay={0.5} className="w-full">
                    <div className="mb-8 pl-4 border-l-4 border-blue-500/30">
                        <h3 className="text-2xl font-black text-white uppercase tracking-heading">
                            Supplier Concentration Matrix
                        </h3>
                        <p className="text-xs text-muted-foreground/60 mt-2 max-w-2xl font-medium tracking-wide">
                            Mapping energy import concentration. Higher reliance on volatile regions directly impacts the national risk profile.
                        </p>
                    </div>

                    <div className="flex flex-col gap-12">
                        {/* 1. Sankey Diagram */}
                        <div className="w-full">
                            <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-xl" />}>
                                {apiData.importData && apiData.importData.length > 0 ? (
                                    <OilImportVulnerabilityCard data={apiData.importData} isLoading={false} />
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/12 p-8 text-center">
                                        <span className="text-xs text-muted-foreground uppercase tracking-uppercase mb-2 font-black">Data loading...</span>
                                    </div>
                                )}
                            </Suspense>
                        </div>

                        {/* 2. Matrix Table - Full Width */}
                        <div className="w-full h-[500px]">
                            <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-xl" />}>
                                {apiData.importData && apiData.importData.length > 0 ? (
                                    <VulnerabilityScoreMatrix data={apiData.importData} isLoading={false} />
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/12 p-8 text-center">
                                        <span className="text-xs text-rose-500/50 uppercase tracking-uppercase mb-2 font-black">Analysis Pending</span>
                                    </div>
                                )}
                            </Suspense>
                        </div>
                    </div>
                </MotionCard>
            </div>
        </div>
    );
};

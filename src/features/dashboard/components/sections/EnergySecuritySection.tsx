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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Suspense fallback={<div className="h-[300px] animate-pulse bg-white/5 rounded-xl" />}>
                        <RefiningCapacityCard data={data.capacityData} isLoading={false} />
                    </Suspense>
                </div>
                <div className="lg:col-span-2">
                    <Suspense fallback={<div className="h-[300px] animate-pulse bg-white/5 rounded-xl" />}>
                        <OilImportSankeyCard data={data.importData} isLoading={false} />
                    </Suspense>
                </div>
                <div className="lg:col-span-1">
                    <Suspense fallback={<div className="h-[300px] animate-pulse bg-white/5 rounded-xl" />}>
                        <VulnerabilityScoreMatrix data={data.importData} isLoading={false} />
                    </Suspense>
                </div>
                <div className="lg:col-span-1">
                    <Suspense fallback={<div className="h-[300px] animate-pulse bg-white/5 rounded-xl" />}>
                        <SPRTrackerCard data={data.sprData} isLoading={false} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
};

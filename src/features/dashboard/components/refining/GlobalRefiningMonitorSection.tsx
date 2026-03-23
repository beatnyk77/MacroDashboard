import React, { Suspense } from 'react';
import { GlobalRefiningMap } from './GlobalRefiningMap';
import { RegionalImbalanceGauge } from './RegionalImbalanceGauge';
import { TopRefinersTable } from './TopRefinersTable';
import { RefiningFocusCards } from './RefiningFocusCards';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardSkeleton = () => (
    <div className="w-full space-y-6">
        <Skeleton className="w-full h-[650px] rounded-[2rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[400px] rounded-[2rem]" />
            <Skeleton className="h-[400px] rounded-[1.5rem]" />
            <Skeleton className="h-[400px] rounded-[2rem]" />
        </div>
    </div>
);

export const GlobalRefiningMonitorSection: React.FC = () => {
    return (
        <section className="w-full space-y-6">
            <Suspense fallback={<DashboardSkeleton />}>
                <div className="w-full">
                    <GlobalRefiningMap />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left & Middle Column (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        <RefiningFocusCards />
                        <TopRefinersTable className="h-[450px]" />
                    </div>

                    {/* Right Column (4 cols) */}
                    <div className="lg:col-span-4 h-full">
                        <RegionalImbalanceGauge className="h-full" />
                    </div>
                </div>
            </Suspense>
        </section>
    );
};

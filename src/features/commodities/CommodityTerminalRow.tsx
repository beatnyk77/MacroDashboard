import React, { Suspense, lazy } from 'react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { useCommodityImports } from '@/hooks/useCommodityImports';

const PhysicalFlowNetwork = lazy(() => import('./components/PhysicalFlowNetwork').then(m => ({ default: m.PhysicalFlowNetwork })));
const MetalImportCard = lazy(() => import('./components/MetalImportCard').then(m => ({ default: m.MetalImportCard })));

const LoadingFallback = () => (
    <div className="w-full h-48 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-uppercase">Loading Commodity Data...</span>
    </div>
);

export const CommodityTerminalRow: React.FC = () => {
    const { data: importData } = useCommodityImports();

    return (
        <div className="flex flex-col gap-12">
            <SectionErrorBoundary name="Physical Flow Network">
                <div className="w-full">
                    <Suspense fallback={<LoadingFallback />}>
                        <PhysicalFlowNetwork />
                    </Suspense>
                </div>
            </SectionErrorBoundary>

            <SectionErrorBoundary name="Gold Import Terminal">
                <div className="w-full">
                    <Suspense fallback={<LoadingFallback />}>
                        <MetalImportCard
                            metal="Gold"
                            data={importData || []}
                            accentColor="gold"
                        />
                    </Suspense>
                </div>
            </SectionErrorBoundary>

            <SectionErrorBoundary name="Silver Import Terminal">
                <div className="w-full">
                    <Suspense fallback={<LoadingFallback />}>
                        <MetalImportCard
                            metal="Silver"
                            data={importData || []}
                            accentColor="slate"
                        />
                    </Suspense>
                </div>
            </SectionErrorBoundary>

            <SectionErrorBoundary name="REM Import Terminal">
                <div className="w-full">
                    <Suspense fallback={<LoadingFallback />}>
                        <MetalImportCard
                            metal="Rare Earth Metals"
                            data={importData || []}
                            accentColor="emerald"
                        />
                    </Suspense>
                </div>
            </SectionErrorBoundary>
        </div>
    );
};
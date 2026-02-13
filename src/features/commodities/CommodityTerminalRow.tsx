import React, { Suspense, lazy } from 'react';
import { Fuel } from 'lucide-react';
import { SPAAccordion } from '@/components/spa';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

const PriceTerminalCard = lazy(() => import('./components/PriceTerminalCard').then(m => ({ default: m.PriceTerminalCard })));
const FlowsSankeyCard = lazy(() => import('./components/FlowsSankeyCard').then(m => ({ default: m.FlowsSankeyCard })));
const ReserveTrackerCard = lazy(() => import('./components/ReserveTrackerCard').then(m => ({ default: m.ReserveTrackerCard })));
const DisruptionMapCard = lazy(() => import('./components/DisruptionMapCard').then(m => ({ default: m.DisruptionMapCard })));

const LoadingFallback = () => (
    <div className="w-full h-48 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading Commodity Data...</span>
    </div>
);

export const CommodityTerminalRow: React.FC = () => {
    return (
        <SPAAccordion
            id="commodity-terminal"
            title="Commodity Terminal"
            subtitle="Institutional macro observatory for physical flows, reserves, and disruptions"
            icon={<Fuel />}
            accentColor="emerald"
            interpretations={[
                "Copper/Gold Ratio: Bottoming",
                "SPR Liquidity: Critical",
                "Flow Disruption: Elevated"
            ]}
        >
            <div className="flex flex-col gap-12">
                <SectionErrorBoundary name="Price Terminal & Forward Signals">
                    <div className="w-full">
                        <Suspense fallback={<LoadingFallback />}>
                            <PriceTerminalCard />
                        </Suspense>
                    </div>
                </SectionErrorBoundary>

                <SectionErrorBoundary name="Physical Flow Network">
                    <div className="w-full">
                        <Suspense fallback={<LoadingFallback />}>
                            <FlowsSankeyCard />
                        </Suspense>
                    </div>
                </SectionErrorBoundary>

                <SectionErrorBoundary name="Reserve Tracker">
                    <div className="w-full">
                        <Suspense fallback={<LoadingFallback />}>
                            <ReserveTrackerCard />
                        </Suspense>
                    </div>
                </SectionErrorBoundary>

                <SectionErrorBoundary name="Disruption Map">
                    <div className="w-full">
                        <Suspense fallback={<LoadingFallback />}>
                            <DisruptionMapCard />
                        </Suspense>
                    </div>
                </SectionErrorBoundary>
            </div>
        </SPAAccordion>
    );
};

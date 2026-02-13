import React, { Suspense, lazy } from 'react';
import { Container } from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { DataHealthTicker } from '@/components/DataHealthTicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

// Lazy load heavy sections
const CockpitKPIGrid = lazy(() => import('../components/CockpitKPIGrid').then(m => ({ default: m.CockpitKPIGrid })));
const NetLiquidityCard = lazy(() => import('../components/cards/NetLiquidityCard').then(m => ({ default: m.NetLiquidityCard })));
const MacroOrientationSection = lazy(() => import('@/features/dashboard/components/sections/MacroOrientationSection').then(m => ({ default: m.MacroOrientationSection })));
const GlobalLiquiditySection = lazy(() => import('@/features/dashboard/components/sections/GlobalLiquiditySection').then(m => ({ default: m.GlobalLiquiditySection })));
const USMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/USMacroPulseSection').then(m => ({ default: m.USMacroPulseSection })));
const CommodityTerminal = lazy(() => import('@/features/dashboard/components/sections/CommodityTerminal').then(m => ({ default: m.CommodityTerminal })));

const LoadingFallback = () => (
    <div className="w-full h-48 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Initializing Data Stream...</span>
    </div>
);

export const DashboardView: React.FC = () => {
    return (
        <Container maxWidth="xl" sx={{ py: 6 }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <DataHealthTicker />
            </div>

            <Tabs defaultValue="heartbeat" className="space-y-8">
                <TabsList className="bg-muted/20 border border-border/40 p-1 rounded-lg">
                    <TabsTrigger value="heartbeat" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Macro Heartbeat</TabsTrigger>
                    <TabsTrigger value="flow-map" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">US Macro Pulse</TabsTrigger>
                </TabsList>

                <TabsContent value="heartbeat" className="space-y-16 outline-none">
                    <section id="heartbeat-hero" className="mt-8 mb-12">
                        <SectionHeader
                            title="Macro Heartbeat"
                            subtitle="High-frequency liquidity and regime signals"
                            sectionId="heartbeat"
                        />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                            <SectionErrorBoundary name="KPI Grid">
                                <Suspense fallback={<LoadingFallback />}>
                                    <div className="space-y-6">
                                        <CockpitKPIGrid />
                                    </div>
                                </Suspense>
                            </SectionErrorBoundary>

                            <SectionErrorBoundary name="Liquidity Terminal">
                                <Suspense fallback={<LoadingFallback />}>
                                    <div className="space-y-6">
                                        <NetLiquidityCard />
                                        <div className="p-6 rounded-xl bg-blue-500/[0.03] border border-blue-500/10 italic text-xs text-muted-foreground/60 leading-relaxed">
                                            <span className="font-semibold text-blue-500">Institutional Note:</span> The Heartbeat suite monitors 48+ data points across G7 and EM markets to detect regime shifts in real-time.
                                        </div>
                                    </div>
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </section>

                    <section id="regime-context" className="shaded-band py-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-black/20">
                        <div className="max-w-[1920px] mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <SectionErrorBoundary name="Macro Orientation">
                                <Suspense fallback={<LoadingFallback />}>
                                    <MacroOrientationSection />
                                </Suspense>
                            </SectionErrorBoundary>

                            <SectionErrorBoundary name="Global Liquidity">
                                <Suspense fallback={<LoadingFallback />}>
                                    <GlobalLiquiditySection />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="flow-map" className="space-y-12 outline-none">
                    <section id="flow-map-container">
                        <SectionHeader
                            title="US Macro Pulse"
                            subtitle="Systemic capital flows and risk appetite"
                            interpretations={[
                                "Cross-border capital flows into Emerging Markets are stabilizing.",
                                "Risk appetite currently in 'Cautious' zone despite liquidity expansion."
                            ]}
                        />
                        <div className="mt-12">
                            <SectionErrorBoundary name="Macro Pulse">
                                <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
                                    <USMacroPulseSection />
                                </Suspense>
                            </SectionErrorBoundary>

                            <SectionErrorBoundary name="Commodities Terminal">
                                <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
                                    <CommodityTerminal />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </section>
                </TabsContent>
            </Tabs>
        </Container>
    );
};

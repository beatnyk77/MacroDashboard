import React, { Suspense, lazy } from 'react';
import { Container, Box } from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { DataHealthTicker } from '@/components/DataHealthTicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

// Lazy load heavy sections
const CockpitKPIGrid = lazy(() => import('../components/CockpitKPIGrid').then(m => ({ default: m.CockpitKPIGrid })));
const NetLiquidityCard = lazy(() => import('../components/cards/NetLiquidityCard').then(m => ({ default: m.NetLiquidityCard })));
const MacroOrientationSection = lazy(() => import('@/features/dashboard/components/sections/MacroOrientationSection').then(m => ({ default: m.MacroOrientationSection })));
const GlobalLiquiditySection = lazy(() => import('@/features/dashboard/components/sections/GlobalLiquiditySection').then(m => ({ default: m.GlobalLiquiditySection })));

const LoadingFallback = () => (
    <div className="w-full h-48 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Initializing Data Stream...</span>
    </div>
);

export const DashboardView: React.FC = () => {
    return (
        <Container maxWidth="xl" sx={{ py: 8 }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <DataHealthTicker />
            </div>

            <Tabs defaultValue="heartbeat" className="space-y-12">
                <TabsList className="bg-background/5 border border-border/40 p-1">
                    <TabsTrigger value="heartbeat">Macro Heartbeat</TabsTrigger>
                    <TabsTrigger value="flow-map">Interstate Flow Map</TabsTrigger>
                </TabsList>

                <TabsContent value="heartbeat" className="space-y-32 outline-none">
                    <section id="heartbeat-hero" className="my-16">
                        <SectionHeader
                            title="Macro Heartbeat"
                            subtitle="High-frequency liquidity and regime signals"
                            sectionId="heartbeat"
                        />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
                            <SectionErrorBoundary name="KPI Grid">
                                <Suspense fallback={<LoadingFallback />}>
                                    <div className="space-y-8">
                                        <CockpitKPIGrid />
                                    </div>
                                </Suspense>
                            </SectionErrorBoundary>

                            <SectionErrorBoundary name="Liquidity Terminal">
                                <Suspense fallback={<LoadingFallback />}>
                                    <div className="space-y-8">
                                        <NetLiquidityCard />
                                        <div className="p-8 rounded-2xl bg-blue-500/[0.02] border border-blue-500/10 italic text-xs text-muted-foreground/40 leading-relaxed">
                                            Institutional Note: The Heartbeat suite monitors 48+ data points across G7 and EM markets to detect regime shifts in real-time.
                                        </div>
                                    </div>
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </section>

                    <section id="regime-context" className="shaded-band py-24 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
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
                            title="Macro Flow Map"
                            subtitle="Systemic capital flows and risk appetite"
                            interpretations={[
                                "Cross-border capital flows into Emerging Markets are stabilizing.",
                                "Risk appetite currently in 'Cautious' zone despite liquidity expansion."
                            ]}
                        />
                        <Box sx={{
                            height: 700,
                            width: '100%',
                            mt: 8,
                            bgcolor: 'rgba(255,255,255,0.01)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 6,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s',
                            position: 'relative',
                            overflow: 'hidden'
                        }} className="hover:border-blue-500/10 group">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent opacity-50" />
                            <span className="text-muted-foreground/20 text-sm tracking-[0.4em] uppercase font-black mb-4">Capital Flow Visualization</span>
                            <span className="text-muted-foreground/10 text-[0.65rem] italic">Sankey Engine Initializing...</span>
                        </Box>
                    </section>
                </TabsContent>
            </Tabs>
        </Container>
    );
};

import React, { Suspense, lazy } from 'react';
import { Container, Box } from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

// Lazy load heavy sections
const IndiaMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/IndiaMacroPulseSection').then(m => ({ default: m.IndiaMacroPulseSection })));
const ChinaMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/ChinaMacroPulseSection').then(m => ({ default: m.ChinaMacroPulseSection })));
const ScenarioStudio = lazy(() => import('@/features/dashboard/components/sections/ScenarioStudio').then(m => ({ default: m.ScenarioStudio })));

const LoadingFallback = () => (
    <div className="w-full h-48 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Downloading Regional Signals...</span>
    </div>
);

export const CountryPulsesView: React.FC = () => {
    return (
        <Container maxWidth="xl" sx={{ py: 8 }}>
            <SectionHeader
                title="Country Pulses"
                subtitle="Institutional coverage of India and China regional macro"
            />

            <Tabs defaultValue="india" className="space-y-12 mt-8">
                <TabsList className="bg-background/5 border border-border/40 p-1">
                    <TabsTrigger value="india">India Pulse</TabsTrigger>
                    <TabsTrigger value="china">China Pulse</TabsTrigger>
                </TabsList>

                <TabsContent value="india" className="space-y-32 outline-none">
                    <section id="india-focus" className="my-16">
                        <SectionErrorBoundary name="India Pulse">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaMacroPulseSection />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>

                    <section id="scenario-studio" className="shaded-band py-24 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-[1400px] mx-auto">
                            <CollapsibleSection
                                title="Scenario Studio"
                                subtitle="Impact assessment for major policy shifts"
                                defaultOpen={false}
                            >
                                <SectionErrorBoundary name="Scenario Studio">
                                    <Suspense fallback={<LoadingFallback />}>
                                        <ScenarioStudio />
                                    </Suspense>
                                </SectionErrorBoundary>
                            </CollapsibleSection>
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="china" className="space-y-12 outline-none">
                    <section id="china-focus">
                        <SectionErrorBoundary name="China Pulse">
                            <Suspense fallback={<LoadingFallback />}>
                                <ChinaMacroPulseSection />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>

                    <section id="china-intervention" className="mt-12">
                        <Box sx={{
                            height: 400,
                            bgcolor: 'rgba(255,255,255,0.01)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 6,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span className="text-rose-500/20 text-sm tracking-[0.4em] uppercase font-black mb-4">PBoC Liquidity Tracker</span>
                            <span className="text-rose-500/10 text-[0.65rem] italic">Tracking capital flight and intervention signals...</span>
                        </Box>
                    </section>
                </TabsContent>
            </Tabs>
        </Container>
    );
};

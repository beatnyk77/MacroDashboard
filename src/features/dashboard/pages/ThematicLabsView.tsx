import React, { Suspense, lazy } from 'react';
import { Container, Box } from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

// Lazy load heavy sections
const HardAssetValuationSection = lazy(() => import('../components/sections/HardAssetValuationSection').then(m => ({ default: m.HardAssetValuationSection })));
const GoldValuationStrip = lazy(() => import('../components/sections/GoldValuationStrip').then(m => ({ default: m.GoldValuationStrip })));
const GoldReturnsSection = lazy(() => import('../components/sections/GoldReturnsSection'));
const BRICSTrackerSection = lazy(() => import('../components/sections/BRICSTrackerSection').then(m => ({ default: m.BRICSTrackerSection })));
const DeDollarizationSection = lazy(() => import('../components/sections/DeDollarizationSection').then(m => ({ default: m.DeDollarizationSection })));
const InstitutionalInfluenceSection = lazy(() => import('../components/sections/InstitutionalInfluenceSection').then(m => ({ default: m.InstitutionalInfluenceSection })));
const TradeSettlementFlows = lazy(() => import('../components/sections/TradeSettlementFlows').then(m => ({ default: m.TradeSettlementFlows })));
const SovereignRiskMatrix = lazy(() => import('../components/sections/SovereignRiskMatrix').then(m => ({ default: m.SovereignRiskMatrix })));

const LoadingFallback = () => (
    <div className="w-full h-48 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Analyzing Thematic Data...</span>
    </div>
);

export const ThematicLabsView: React.FC = () => {
    return (
        <Container maxWidth="xl" sx={{ py: 8 }}>
            <SectionHeader
                title="Thematic Labs"
                subtitle="Deep-dive signals for Gold, BRICS, and Global Sovereign Stress"
            />

            <Tabs defaultValue="gold" className="space-y-12 mt-8">
                <TabsList className="bg-background/5 border border-border/40 p-1">
                    <TabsTrigger value="gold">Gold Anchor</TabsTrigger>
                    <TabsTrigger value="brics">BRICS & De-Dollarization</TabsTrigger>
                    <TabsTrigger value="boj">BoJ & Yen Pivot</TabsTrigger>
                    <TabsTrigger value="sovereign">Sovereign Debt Stress</TabsTrigger>
                </TabsList>

                <TabsContent value="gold" className="space-y-32 outline-none">
                    <section id="gold-valuation-suite" className="my-16">
                        <SectionHeader
                            title="Gold Valuation & Real Rates"
                            subtitle="Tracking the decoupling of precious metals from US Treasury yields"
                        />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-12">
                            <SectionErrorBoundary name="Hard Assets">
                                <Suspense fallback={<LoadingFallback />}>
                                    <HardAssetValuationSection />
                                </Suspense>
                            </SectionErrorBoundary>

                            <SectionErrorBoundary name="Gold Returns">
                                <Suspense fallback={<LoadingFallback />}>
                                    <GoldReturnsSection />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </section>

                    <section id="gold-ribbon" className="shaded-band py-24 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-[1400px] mx-auto">
                            <SectionErrorBoundary name="Gold Ribbon">
                                <Suspense fallback={<LoadingFallback />}>
                                    <GoldValuationStrip />
                                </Suspense>
                            </SectionErrorBoundary>
                            <Box sx={{
                                height: 500,
                                width: '100%',
                                mt: 12,
                                bgcolor: 'rgba(255,200,0,0.02)',
                                border: '1px solid rgba(255,200,0,0.1)',
                                borderRadius: 6,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'hidden'
                            }} className="group">
                                <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 via-transparent to-transparent opacity-30" />
                                <span className="text-yellow-500/20 text-sm tracking-[0.4em] uppercase font-black mb-4 group-hover:text-yellow-500/40 transition-colors">Gold Ribbon Signal Engine</span>
                                <span className="text-yellow-500/10 text-[0.65rem] italic">Multi-variable divergence model in preview...</span>
                            </Box>
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="brics" className="space-y-32 outline-none">
                    <section id="brics-alignment" className="my-16">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            <SectionErrorBoundary name="De-Dollarization">
                                <Suspense fallback={<LoadingFallback />}>
                                    <DeDollarizationSection />
                                </Suspense>
                            </SectionErrorBoundary>

                            <SectionErrorBoundary name="BRICS Tracker">
                                <Suspense fallback={<LoadingFallback />}>
                                    <BRICSTrackerSection />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </section>

                    <section id="institutional-influence" className="shaded-band py-24 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-[1400px] mx-auto">
                            <SectionErrorBoundary name="Money Wars">
                                <Suspense fallback={<LoadingFallback />}>
                                    <InstitutionalInfluenceSection />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </section>

                    <section id="trade-settlement" className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-[1400px] mx-auto">
                            <SectionErrorBoundary name="Trade Flows">
                                <Suspense fallback={<LoadingFallback />}>
                                    <TradeSettlementFlows />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="boj" className="space-y-12 outline-none">
                    <section id="boj-pivot">
                        <SectionHeader
                            title="Japanese Monetary Policy"
                            subtitle="BoJ yield curve control and Yen carry trade risk"
                        />
                        <Box sx={{
                            height: 600,
                            bgcolor: 'rgba(255,255,255,0.01)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span className="text-muted-foreground/20 text-sm tracking-[0.4em] uppercase font-black">BoJ Pivot Tracker Terminal</span>
                        </Box>
                    </section>
                </TabsContent>

                <TabsContent value="sovereign" className="space-y-12 outline-none">
                    <section id="risk-matrix">
                        <SectionErrorBoundary name="Sovereign Risk">
                            <Suspense fallback={<LoadingFallback />}>
                                <SovereignRiskMatrix />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>
                </TabsContent>
            </Tabs>
        </Container>
    );
};

import React, { Suspense, lazy } from 'react';
import { Container, Typography, Box, Button, Breadcrumbs, Link, Grid } from '@mui/material';
import {
    ChevronRight,
    ArrowLeft,
    TrendingUp,
    Coins,
    Zap,
    Globe,
    Lock
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';

// Lazy loaded components
const USDebtGoldBackingCard = lazy(() => import('@/features/dashboard/components/cards/USDebtGoldBackingCard').then(m => ({ default: m.USDebtGoldBackingCard })));
const GoldRatioRibbon = lazy(() => import('@/features/dashboard/components/sections/GoldRatioRibbon').then(m => ({ default: m.GoldRatioRibbon })));
const CentralBankGoldNet = lazy(() => import('@/features/dashboard/components/rows/CentralBankGoldNet').then(m => ({ default: m.CentralBankGoldNet })));
const GlobalFinancialHubsGoldGateways = lazy(() => import('@/features/dashboard/components/rows/GlobalFinancialHubsGoldGateways').then(m => ({ default: m.GlobalFinancialHubsGoldGateways })));
const GlobalReserveTracker = lazy(() => import('@/features/dashboard/components/sections/GlobalReserveTracker').then(m => ({ default: m.GlobalReserveTracker })));
const TradeFlowsCard = lazy(() => import('@/features/dashboard/components/cards/TradeFlowsCard').then(m => ({ default: m.TradeFlowsCard })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading Gold Signal...</span>
    </div>
);

export const DeDollarizationGoldLab: React.FC = () => {
    return (
        <Container maxWidth={false} sx={{ py: 6 }}>
            {/* Breadcrumbs */}
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs
                    separator={<ChevronRight size={14} className="text-muted-foreground/50" />}
                    aria-label="breadcrumb"
                >
                    <Link underline="hover" color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', tracking: '0.1em' }}>
                        Home
                    </Link>
                    <Link underline="hover" color="inherit" href="/macro-observatory" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', tracking: '0.1em' }}>
                        Observatory
                    </Link>
                    <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', tracking: '0.1em' }}>
                        De-Dollarization & Gold
                    </Typography>
                </Breadcrumbs>
            </Box>

            <Box sx={{ mb: 8 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[0.65rem] font-black uppercase tracking-widest mb-4">
                    <Coins size={12} /> Hard Money Telemetry
                </div>
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 2 }}>
                    De-Dollarization & <span className="text-amber-500">Gold</span>
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '800px', fontSize: '1.2rem', fontWeight: 500 }}>
                    Monitoring the systemic shift from fiat-centric reserves to hard-asset anchors and the fragmentation of global settlement networks.
                </Typography>
            </Box>

            <div className="space-y-24">
                {/* 1. Gold Anchor Ratios */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <TrendingUp className="text-amber-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Gold Anchor Ratios</h2>
                    </div>
                    <Grid container spacing={6}>
                        <Grid item xs={12} lg={4}>
                            <SectionErrorBoundary name="US Debt Gold Backing">
                                <Suspense fallback={<LoadingFallback />}>
                                    <USDebtGoldBackingCard />
                                </Suspense>
                            </SectionErrorBoundary>
                        </Grid>
                        <Grid item xs={12} lg={8}>
                            <SectionErrorBoundary name="Gold Ratio Ribbon">
                                <Suspense fallback={<LoadingFallback />}>
                                    <GoldRatioRibbon />
                                </Suspense>
                            </SectionErrorBoundary>
                        </Grid>
                    </Grid>
                    <ChartInsightSummary id="lab-gold-ratios" insight="The M2/Gold ratio tracks the relative debasement of the monetary supply against the hard asset anchor. Structurally rising ratios indicate a regime change in sovereign preference for physical liquidity." />
                </section>

                {/* 2. Global Reserve Composition */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Globe className="text-blue-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Global Reserve Composition</h2>
                    </div>
                    <SectionErrorBoundary name="Global Reserve Tracker">
                        <Suspense fallback={<LoadingFallback />}>
                            <GlobalReserveTracker />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 3. Central Bank & Hubs */}
                <div className="space-y-12">
                    <section>
                        <div className="flex items-center gap-3 mb-10">
                            <Zap className="text-amber-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Central Bank Gold Net Purchases</h2>
                        </div>
                        <SectionErrorBoundary name="Gold Net Purchases">
                            <Suspense fallback={<LoadingFallback />}>
                                <CentralBankGoldNet />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-10">
                            <Lock className="text-blue-400" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Financial Hubs & Gold Gateways</h2>
                        </div>
                        <SectionErrorBoundary name="Financial Hubs">
                            <Suspense fallback={<LoadingFallback />}>
                                <GlobalFinancialHubsGoldGateways />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>
                </div>

                {/* 4. Trade Flows & Misinvoicing */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <TrendingUp className="text-rose-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Trade Settlement & Misinvoicing</h2>
                    </div>
                    <SectionErrorBoundary name="Trade Flows">
                        <Suspense fallback={<LoadingFallback />}>
                            <TradeFlowsCard />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-trade-flows" insight="Analyzing de-dollarization through the lens of trade settlement and illicit flow metrics reveals the true speed of the structural decoupling between G7 and BRICS+ networks." />
                </section>
            </div>

            <Box sx={{ mt: 12, pt: 8, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <Button
                    variant="text"
                    startIcon={<ArrowLeft size={18} />}
                    href="/macro-observatory"
                    sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 900, '&:hover': { color: 'white' } }}
                >
                    Back to Observatory
                </Button>
            </Box>
        </Container>
    );
};

export default DeDollarizationGoldLab;

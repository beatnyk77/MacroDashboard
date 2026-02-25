import React, { Suspense, lazy } from 'react';
import { Container, Box, Button } from '@mui/material';
import {
    ShieldAlert,
    Globe,
    Zap,
    TrendingUp,
    ChevronRight,
    Lock
} from 'lucide-react';
import { SPASection } from '@/components/spa';
import { SectionHeader } from '@/components/SectionHeader';
import { DataHealthTicker } from '@/components/DataHealthTicker';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { SEOManager } from '@/components/SEOManager';
import { USDebtMaturityWall } from '@/components/USDebtMaturityWall';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';

// Row Components
import { NetLiquidityRow } from '@/features/dashboard/components/rows/NetLiquidityRow';

// Lazy load key components for the homepage
const CockpitKPIGrid = lazy(() => import('@/features/dashboard/components/CockpitKPIGrid').then(m => ({ default: m.CockpitKPIGrid })));
const USTreasuryDemandGauge = lazy(() => import('@/features/dashboard/components/rows/USTreasuryDemandGauge').then(m => ({ default: m.USTreasuryDemandGauge })));
const IndiaMarketPulseRow = lazy(() => import('@/features/dashboard/components/rows/IndiaMarketPulseRow').then(m => ({ default: m.IndiaMarketPulseRow })));
const GoldRatioRibbon = lazy(() => import('@/features/dashboard/components/sections/GoldRatioRibbon').then(m => ({ default: m.GoldRatioRibbon })));
const SovereignRiskMatrix = lazy(() => import('@/features/dashboard/components/sections/SovereignRiskMatrix').then(m => ({ default: m.SovereignRiskMatrix })));
const CommodityTerminalRow = lazy(() => import('@/features/commodities/CommodityTerminalRow').then(m => ({ default: m.CommodityTerminalRow })));
const BlogSection = lazy(() => import('@/features/dashboard/components/sections/BlogSection').then(m => ({ default: m.BlogSection })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading Signal...</span>
    </div>
);

export const Dashboard: React.FC = () => {
    return (
        <Container maxWidth={false} disableGutters sx={{ py: 4 }}>
            <SEOManager
                title="Macro Research Hub | Sovereign Intelligence"
                description="Narrative-first macro research platform tracking Debt, Liquidity, and Sovereign Risk for institutional investors."
                keywords={['Macro Research', 'Institutional Intelligence', 'Sovereign Debt', 'Liquidity Signal']}
                isApp={true}
            />

            <div className="space-y-32">
                {/* 1. HERO SECTION */}
                <SPASection id="hero" variant="hero" disableAnimation className="pt-12">
                    <div className="max-w-4xl mx-auto text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[0.65rem] font-black uppercase tracking-widest mb-8">
                            <Zap size={12} /> Institutional Intelligence Console
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase leading-none mb-6">
                            The Sovereignty<br />
                            <span className="text-blue-500">Narrative</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto uppercase font-bold tracking-tight opacity-70 mb-10">
                            Navigating the transition from fiat-monopoly to hard-money telemetry and sovereign multi-polarity.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => window.location.href = '/macro-observatory'}
                                sx={{
                                    bgcolor: '#3b82f6',
                                    fontWeight: 900,
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: '12px',
                                    '&:hover': { bgcolor: '#2563eb' }
                                }}
                            >
                                Enter The Labs
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={() => window.location.href = '/institutional'}
                                sx={{
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontWeight: 900,
                                    px: 4,
                                    borderRadius: '12px',
                                    backdropFilter: 'blur(10px)',
                                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
                                }}
                            >
                                Institutional Solutions
                            </Button>
                        </div>
                    </div>

                    <SectionErrorBoundary name="Hero Metrics">
                        <Suspense fallback={<LoadingFallback />}>
                            <USDebtMaturityWall />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="hero-insight" insight="US Debt rollover remains the primary gravitational force in global markets. Tracking the $9.2T maturity wall is essential for regime identification." />
                </SPASection>

                {/* 2. MACRO HEARTBEAT */}
                <SPASection id="heartbeat">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <SectionHeader
                            title="Macro Heartbeat"
                            subtitle="High-frequency liquidity and regime signals"
                            sectionId="heartbeat"
                        />
                        <DataHealthTicker />
                    </div>

                    <div className="space-y-12">
                        <SectionErrorBoundary name="Net Liquidity">
                            <NetLiquidityRow />
                        </SectionErrorBoundary>

                        <SectionErrorBoundary name="Cockpit KPI">
                            <Suspense fallback={<LoadingFallback />}>
                                <CockpitKPIGrid />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </SPASection>

                {/* 3. US FISCAL & MACRO STRESS */}
                <SPASection id="us-fiscal">
                    <SectionHeader
                        title="US Fiscal & Macro Stress"
                        subtitle="Treasury demand dynamics and auction stress levels"
                    />
                    <div className="mt-12 grid grid-cols-1 gap-12">
                        <SectionErrorBoundary name="Treasury Demand">
                            <Suspense fallback={<LoadingFallback />}>
                                <USTreasuryDemandGauge />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                    <div className="mt-8 text-center">
                        <Button
                            variant="text"
                            href="/labs/us-macro-fiscal"
                            endIcon={<ChevronRight size={16} />}
                            sx={{ color: '#3b82f6', fontWeight: 700 }}
                        >
                            View Full US Macro Lab
                        </Button>
                    </div>
                </SPASection>

                {/* 4. INDIA & CHINA MACRO PULSE */}
                <SPASection id="asia-pulse">
                    <SectionHeader
                        title="Emerging Giants"
                        subtitle="Counter-cyclical telemetry for India and China"
                    />
                    <div className="mt-12 space-y-12">
                        <SectionErrorBoundary name="India Market Pulse">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaMarketPulseRow />
                            </Suspense>
                        </SectionErrorBoundary>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Box
                                onClick={() => window.location.href = '/labs/india'}
                                className="group cursor-pointer p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-black uppercase text-white">India Lab</h3>
                                    <TrendingUp className="text-emerald-500" />
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">Deep dive into MoSPI telemetry, credit cycles, and RBI defense mechanisms.</p>
                                <span className="text-blue-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    Analyze India <ChevronRight size={14} />
                                </span>
                            </Box>
                            <Box
                                onClick={() => window.location.href = '/labs/china'}
                                className="group cursor-pointer p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-black uppercase text-white">China Lab</h3>
                                    <Globe className="text-rose-500" />
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">Tracking PBoC liquidity, credit impulse, and the Yuan internationalization curve.</p>
                                <span className="text-blue-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    Analyze China <ChevronRight size={14} />
                                </span>
                            </Box>
                        </div>
                    </div>
                </SPASection>

                {/* 5. HARD MONEY & RESERVE SHIFT */}
                <SPASection id="hard-money">
                    <SectionHeader
                        title="Hard Money & Reserve Shift"
                        subtitle="Gold anchor ratios and the de-dollarization vector"
                    />
                    <div className="mt-12 space-y-12">
                        <SectionErrorBoundary name="Gold Ratio">
                            <Suspense fallback={<LoadingFallback />}>
                                <GoldRatioRibbon />
                            </Suspense>
                        </SectionErrorBoundary>

                        <Box className="p-12 rounded-3xl border border-amber-500/20 bg-amber-500/[0.02] text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Lock size={120} />
                            </div>
                            <h3 className="text-2xl font-black text-amber-500 uppercase mb-4">Sovereign De-Dollarization</h3>
                            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                                Detailed tracking of G20 central bank gold net purchases and the structural shift in global reserve compositions.
                            </p>
                            <Button
                                variant="contained"
                                href="/labs/de-dollarization-gold"
                                sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 900, px: 4, '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.2)' } }}
                            >
                                Access De-Dollarization Lab
                            </Button>
                        </Box>
                    </div>
                </SPASection>

                {/* 6. ENERGY & COMMODITY SECURITY */}
                <SPASection id="commodities">
                    <SectionHeader
                        title="Resource Security"
                        subtitle="Geopolitical chokepoints and physical flow dynamics"
                    />
                    <div className="mt-12">
                        <SectionErrorBoundary name="Commodity Terminal">
                            <Suspense fallback={<LoadingFallback />}>
                                <CommodityTerminalRow />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                    <div className="mt-8 text-center">
                        <Button
                            variant="text"
                            href="/labs/energy-commodities"
                            endIcon={<ChevronRight size={16} />}
                            sx={{ color: '#3b82f6', fontWeight: 700 }}
                        >
                            Explore Commodity Labs
                        </Button>
                    </div>
                </SPASection>

                {/* 7. SOVEREIGN STRESS & INEQUALITY */}
                <SPASection id="sovereign-stress">
                    <SectionHeader
                        title="Sovereign Fragility"
                        subtitle="Debt sustainability and global convergence tracking"
                    />
                    <div className="mt-12">
                        <SectionErrorBoundary name="Risk Matrix">
                            <Suspense fallback={<LoadingFallback />}>
                                <SovereignRiskMatrix />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-xl border border-white/5 bg-white/[0.01]">
                            <h4 className="text-white font-bold mb-2">Shadow System</h4>
                            <p className="text-xs text-muted-foreground mb-4">Offshore wealth flight and illicit flow telemetry.</p>
                            <Button size="small" href="/labs/shadow-system" sx={{ fontSize: '0.65rem', fontWeight: 900 }}>Enter Lab</Button>
                        </div>
                        <div className="p-6 rounded-xl border border-white/5 bg-white/[0.01]">
                            <h4 className="text-white font-bold mb-2">Sovereign Stress</h4>
                            <p className="text-xs text-muted-foreground mb-4">G20 debt maturity walls and CDS spread matrix.</p>
                            <Button size="small" href="/labs/sovereign-stress" sx={{ fontSize: '0.65rem', fontWeight: 900 }}>Enter Lab</Button>
                        </div>
                        <div className="p-6 rounded-xl border border-white/5 bg-white/[0.01]">
                            <h4 className="text-white font-bold mb-2">Observatory</h4>
                            <p className="text-xs text-muted-foreground mb-4">Unified index of all thematic signal monitors.</p>
                            <Button size="small" href="/macro-observatory" sx={{ fontSize: '0.65rem', fontWeight: 900 }}>Explore All</Button>
                        </div>
                    </div>
                </SPASection>

                {/* 8. RESEARCH & DIGEST TEASER */}
                <SPASection id="research">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-blue-600/5 rounded-3xl p-12 border border-blue-500/10">
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase mb-6">Regime Digest</h2>
                            <p className="text-muted-foreground mb-8 text-lg">
                                Weekly synthesis of global liquidity cycles, geopolitical escalation, and proprietary signal shifts.
                            </p>
                            <Button
                                variant="contained"
                                href="/regime-digest"
                                sx={{ bgcolor: '#3b82f6', fontWeight: 900, px: 4 }}
                            >
                                Read Latest Digest
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <SectionErrorBoundary name="Blog Feed">
                                <Suspense fallback={<LoadingFallback />}>
                                    <BlogSection />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </div>
                </SPASection>

                {/* 9. FOR FUNDS & FAMILY OFFICES TEASER */}
                <SPASection id="institutional-teaser" className="pb-24">
                    <div className="text-center max-w-3xl mx-auto">
                        <ShieldAlert className="mx-auto mb-6 text-blue-500" size={48} />
                        <h2 className="text-4xl font-black text-white uppercase mb-6">Institutional Solutions</h2>
                        <p className="text-muted-foreground text-lg mb-10">
                            Custom data pipelines, white-labeled research hubs, and private telemetry for family offices and sovereign funds.
                        </p>
                        <Button
                            variant="outlined"
                            size="large"
                            href="/institutional"
                            sx={{
                                borderColor: '#3b82f6',
                                color: '#3b82f6',
                                fontWeight: 900,
                                px: 6,
                                py: 1.5,
                                borderRadius: '14px',
                                borderHeight: 2,
                                '&:hover': { borderColor: '#2563eb', bgcolor: 'rgba(59, 130, 246, 0.05)' }
                            }}
                        >
                            Request Access <ChevronRight size={18} />
                        </Button>
                    </div>
                </SPASection>
            </div>
        </Container>
    );
};

export default Dashboard;

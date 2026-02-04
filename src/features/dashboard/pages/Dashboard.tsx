import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { MacroOrientationSection } from '@/features/dashboard/components/sections/MacroOrientationSection';
import { HardAssetValuationSection } from '@/features/dashboard/components/sections/HardAssetValuationSection';
import { GlobalLiquiditySection } from '@/features/dashboard/components/sections/GlobalLiquiditySection';
import { DeDollarizationSection } from '@/features/dashboard/components/sections/DeDollarizationSection';
import { BRICSTrackerSection } from '@/features/dashboard/components/sections/BRICSTrackerSection';
import { IndiaMacroPulseSection } from '@/features/dashboard/components/sections/IndiaMacroPulseSection';
import { ChinaMacroPulseSection } from '@/components/ChinaMacroPulseSection';
import { TreasurySnapshotSection } from '@/features/dashboard/components/sections/TreasurySnapshotSection';
import { GoldValuationStrip } from '@/features/dashboard/components/sections/GoldValuationStrip';
import { MarketPulseTicker } from '@/features/dashboard/components/MarketPulseTicker';
import { MajorEconomiesTable } from '@/features/dashboard/components/sections/MajorEconomiesTable';
import { SovereignRiskMatrix } from '@/features/dashboard/components/sections/SovereignRiskMatrix';
import { TradeSettlementFlows } from '@/features/dashboard/components/sections/TradeSettlementFlows';
import { ScenarioStudio } from '@/features/dashboard/components/sections/ScenarioStudio';
import { SovereignHealthRadar } from '@/features/dashboard/components/sections/SovereignHealthRadar';
import GoldReturnsSection from '@/features/dashboard/components/sections/GoldReturnsSection';
import { TodaysBriefPanel } from '@/features/dashboard/components/sections/TodaysBriefPanel';
import { LatestMacroHeadlinesCard } from '@/features/dashboard/components/cards/LatestMacroHeadlinesCard';
import { CockpitKPIGrid } from '@/features/dashboard/components/CockpitKPIGrid';
import { SEOFAQSection } from '@/features/dashboard/components/sections/SEOFAQSection';

// Lazy load non-critical bottom sections
const TreasuryHoldersSection = React.lazy(() => import('@/features/dashboard/components/sections/TreasuryHoldersSection').then(m => ({ default: m.TreasuryHoldersSection })));
const HowToUseCard = React.lazy(() => import('@/features/dashboard/components/sections/HowToUseCard').then(m => ({ default: m.HowToUseCard })));

export const Dashboard: React.FC = () => {
    return (
        <Box sx={{ pb: 8, pt: 0 }}>
            {/* 1. Market Pulse Ticker (Top Anchor - Full Width) */}
            <Box id="top" sx={{ mb: 4 }}>
                <MarketPulseTicker />
            </Box>

            {/* SEO H1 - Visually Hidden for Screen Readers & Crawlers */}
            <Typography
                variant="h1"
                sx={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0
                }}
            >
                Macro Liquidity Dashboard & Global Macro Observatory
            </Typography>

            {/* SEO Intro Paragraph */}
            <Box sx={{
                mb: 4,
                px: 3,
                py: 2.5,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.015)',
                border: '1px solid',
                borderColor: 'divider'
            }}>
                <Typography variant="body2" sx={{
                    color: 'text.secondary',
                    lineHeight: 1.7,
                    fontSize: '0.875rem'
                }}>
                    GraphiQuestor is an institutional-grade <strong>macro liquidity dashboard</strong> and <strong>global macro observatory</strong> designed for professional researchers and portfolio managers. Our platform provides real-time <strong>macro regime analysis</strong> by tracking the <strong>global liquidity cycle</strong>, <strong>gold valuation vs real rates</strong>, and <strong>sovereign bond stress indicators</strong>. By monitoring critical signals such as <strong>BRICS de-dollarization</strong>, <strong>BRICS gold accumulation</strong>, and <strong>foreign holders of US Treasuries</strong>, GraphiQuestor offers a comprehensive <strong>macro risk dashboard</strong> to navigate complex market cycles. Our <strong>global liquidity monitor</strong> utilizes 25-year historical z-scores to provide deep institutional memory, helping users identify shifts in the <strong>sovereign risk monitor</strong> and evaluate <strong>gold macro valuation</strong> in a shifting multi-polar world. Whether managing a global macro portfolio or tracking systemic stress, GraphiQuestor is the definitive <strong>macroeconomic dashboard</strong> for modern institutional macro research.
                </Typography>
            </Box>

            <Grid container spacing={2.5}>
                {/* LEFT COLUMN (Main Content) - Occupies 70% on large desktops */}
                <Grid item xs={12} lg={8.5} xl={9}>
                    <Box sx={{ maxWidth: '1600px' }}>
                        {/* 2. Cockpit KPI Grid (Stage 2.1) */}
                        <Box id="cockpit-section" sx={{ mb: 4 }}>
                            <CockpitKPIGrid />
                        </Box>

                        <Box sx={{ mt: 2 }}>
                            {/* 3. Macro Orientation */}
                            <Box id="macro-orientation-section" sx={{ mb: 4 }}>
                                <MacroOrientationSection />
                            </Box>

                            <Grid container spacing={2.5}>
                                {/* Mid-size cards can now be side-by-side on desktop */}
                                <Grid item xs={12} md={6}>
                                    <Box id="hard-asset-valuation-section" sx={{ height: '100%', mb: 2.5 }}>
                                        <HardAssetValuationSection />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box id="global-liquidity-section" sx={{ height: '100%', mb: 2.5 }}>
                                        <GlobalLiquiditySection />
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* 6. De-Dollarization Tracker */}
                            <Box id="de-dollarization-section" sx={{ mb: 4 }}>
                                <DeDollarizationSection />
                            </Box>

                            {/* 6.1 Trade Settlement & BRICS+ Momentum */}
                            <Box id="trade-settlement-section" sx={{ mb: 4 }}>
                                <TradeSettlementFlows />
                            </Box>

                            <Grid container spacing={2.5}>
                                <Grid item xs={12} md={6}>
                                    <Box id="gold-returns-section" sx={{ mb: 4 }}>
                                        <GoldReturnsSection />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box id="brics-tracker-section" sx={{ mb: 4 }}>
                                        <BRICSTrackerSection />
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Pulse Pulse Sections */}
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} md={6}>
                                    <Box id="china-macro-section" sx={{ mb: 4 }}>
                                        <ChinaMacroPulseSection />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box id="india-macro-section" sx={{ mb: 4 }}>
                                        <IndiaMacroPulseSection />
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Large Data Tables */}
                            <Box id="major-economies-section" sx={{ mb: 4 }}>
                                <MajorEconomiesTable />
                            </Box>

                            <Box id="sovereign-risk-matrix" sx={{ mb: 4 }}>
                                <SovereignRiskMatrix />
                            </Box>

                            {/* Sovereign & Treasury Stress */}
                            <Box id="treasury-snapshot-section" sx={{ mb: 4 }}>
                                <TreasurySnapshotSection />
                            </Box>

                            <Box id="sovereign-health-radar" sx={{ mb: 4 }}>
                                <SovereignHealthRadar />
                            </Box>

                            {/* Major Foreign Holders */}
                            <Box id="treasury-holders-section" sx={{ mb: 4 }}>
                                <React.Suspense fallback={<Box sx={{ height: 200, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2 }} />}>
                                    <TreasuryHoldersSection />
                                </React.Suspense>
                            </Box>

                            <ScenarioStudio />

                            <Box id="gold-valuation-strip" sx={{ mt: 2 }}>
                                <GoldValuationStrip />
                            </Box>
                        </Box>
                    </Box>
                </Grid>

                {/* RIGHT COLUMN (Intel Sidebar) - Occupies 30% or 3/12 on large screens */}
                <Grid item xs={12} lg={3.5} xl={3}>
                    <Box sx={{
                        position: { lg: 'sticky' },
                        top: { lg: 88 },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5
                    }}>
                        <Box id="todays-brief">
                            <TodaysBriefPanel sx={{ mb: 0 }} />
                        </Box>
                        <LatestMacroHeadlinesCard />

                        {/* Navigation Context Card */}
                        <Box sx={{
                            p: 2.5,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.02)',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                            <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: '0.1em' }}>
                                Navigation Context
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, fontSize: '0.8rem', lineHeight: 1.5 }}>
                                Use the left sidebar to jump between macroeconomic themes. This sidebar follows your focus.
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* 15. FAQ Section for SEO/GEO */}
            <SEOFAQSection />

            {/* 16. How to Use GraphiQuestor (Relocated to bottom) */}
            <Box id="how-to-use" sx={{ mt: 8 }}>
                <React.Suspense fallback={null}>
                    <HowToUseCard />
                </React.Suspense>
            </Box>
        </Box>
    );
};


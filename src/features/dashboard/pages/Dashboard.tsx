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

            <Grid container spacing={4}>
                {/* LEFT COLUMN (70%) - Main Analysis & Data */}
                <Grid item xs={12} lg={8.5}>
                    {/* 2. Cockpit KPI Grid (Stage 2.1) */}
                    <Box id="cockpit-section" sx={{ mb: 6 }}>
                        <CockpitKPIGrid />
                    </Box>

                    <Box sx={{ mt: 4 }}>
                        {/* 3. Macro Orientation */}
                        <Box id="macro-orientation-section">
                            <MacroOrientationSection />
                        </Box>

                        {/* 4. Hard Asset Valuation (Paper vs Hard Money) */}
                        <Box id="hard-asset-valuation-section">
                            <HardAssetValuationSection />
                        </Box>

                        {/* 5. Global Liquidity */}
                        <Box id="global-liquidity-section">
                            <GlobalLiquiditySection />
                        </Box>

                        {/* 6. De-Dollarization Tracker */}
                        <Box id="de-dollarization-section">
                            <DeDollarizationSection />
                        </Box>

                        {/* 6.1 Trade Settlement & BRICS+ Momentum (New Stage 5) */}
                        <Box id="trade-settlement-section" sx={{ mb: 6 }}>
                            <TradeSettlementFlows />
                        </Box>

                        {/* 7. Historical Chart of Gold */}
                        <Box id="gold-returns-section">
                            <GoldReturnsSection />
                        </Box>

                        {/* 8. BRICS+ Tracker */}
                        <Box id="brics-tracker-section">
                            <BRICSTrackerSection />
                        </Box>

                        {/* 9. China Macro Pulse */}
                        <Box id="china-macro-section">
                            <ChinaMacroPulseSection />
                        </Box>

                        {/* 10. India Macro Pulse */}
                        <Box id="india-macro-section">
                            <IndiaMacroPulseSection />
                        </Box>

                        {/* 11. Major Economies Overview */}
                        <Box id="major-economies-section">
                            <MajorEconomiesTable />
                        </Box>

                        {/* 11.1 Sovereign Risk Matrix (New Stage 4) */}
                        <Box id="sovereign-risk-matrix" sx={{ mb: 6 }}>
                            <SovereignRiskMatrix />
                        </Box>

                        {/* 12. Sovereign & Treasury Stress */}
                        <Box id="treasury-snapshot-section">
                            <TreasurySnapshotSection />
                        </Box>

                        {/* 13. G20 Sovereign Aggregate */}
                        <Box id="sovereign-health-radar">
                            <SovereignHealthRadar />
                        </Box>

                        {/* 14. Major Foreign Holders */}
                        <Box id="treasury-holders-section">
                            <React.Suspense fallback={<Box sx={{ height: 200, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2 }} />}>
                                <TreasuryHoldersSection />
                            </React.Suspense>
                        </Box>

                        {/* Additional context components */}
                        <ScenarioStudio />

                        <Box id="gold-valuation-strip" sx={{ mt: 4 }}>
                            <GoldValuationStrip />
                        </Box>
                    </Box>
                </Grid>

                {/* RIGHT COLUMN (30%) - Sticky Intel Sidebar (Stage 2.2) */}
                <Grid item xs={12} lg={3.5}>
                    <Box sx={{
                        position: { lg: 'sticky' },
                        top: { lg: 88 }, // Header height + spacing
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3
                    }}>
                        <Box id="todays-brief">
                            <TodaysBriefPanel sx={{ mb: 0 }} />
                        </Box>
                        <LatestMacroHeadlinesCard />

                        {/* Summary of what they're looking at */}
                        <Box sx={{
                            p: 3,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.02)',
                            border: '1px solid',
                            borderColor: 'divider',
                            mt: 2
                        }}>
                            <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: '0.1em' }}>
                                Navigation Context
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, fontSize: '0.8rem' }}>
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


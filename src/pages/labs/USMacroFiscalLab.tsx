import React, { Suspense, lazy } from 'react';
import { Container, Typography, Box, Button, Breadcrumbs, Link } from '@mui/material';
import {
    ChevronRight,
    ArrowLeft,
    ShieldAlert,
    TrendingUp,
    Zap
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';

// Components
import { USDebtMaturityWall } from '@/components/USDebtMaturityWall';

// Lazy loaded components
const USTreasuryDemandGauge = lazy(() => import('@/features/dashboard/components/rows/USTreasuryDemandGauge').then(m => ({ default: m.USTreasuryDemandGauge })));
const TopTreasuryHoldersTable = lazy(() => import('@/features/dashboard/components/tables/TopTreasuryHoldersTable').then(m => ({ default: m.TopTreasuryHoldersTable })));
const USMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/USMacroPulseSection').then(m => ({ default: m.USMacroPulseSection })));
const PresidentialPolicyTracker = lazy(() => import('@/features/dashboard/components/sections/PresidentialPolicyTracker').then(m => ({ default: m.PresidentialPolicyTracker })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading Signal...</span>
    </div>
);

export const USMacroFiscalLab: React.FC = () => {
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
                        US Macro & Fiscal
                    </Typography>
                </Breadcrumbs>
            </Box>

            <Box sx={{ mb: 8 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[0.65rem] font-black uppercase tracking-widest mb-4">
                    <Zap size={12} /> Core Sovereign Telemetry
                </div>
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 2 }}>
                    US Macro & Fiscal <span className="text-blue-500">Lab</span>
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '800px', fontSize: '1.1rem', fontWeight: 500 }}>
                    Tracking the structural debt dynamics, treasury demand vectors, and fiscal policy impact of the world's reserve currency issuer.
                </Typography>
            </Box>

            <div className="space-y-24">
                {/* Section 1: Debt Maturity Wall */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <TrendingUp className="text-blue-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">US Debt Maturity Wall</h2>
                    </div>
                    <SectionErrorBoundary name="US Debt Maturity Wall">
                        <Suspense fallback={<LoadingFallback />}>
                            <USDebtMaturityWall />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-us-debt-maturity" insight="The maturity wall tracks $9.2T in rolling securities. The 2025-2027 window represents a critical refinancing regime where low-coupon pandemic-era debt is re-priced at structurally higher market yields." />
                </section>

                {/* Section 2: Treasury Demand & Holders */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <Zap className="text-amber-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Auction Demand</h2>
                        </div>
                        <SectionErrorBoundary name="Treasury Demand Gauge">
                            <Suspense fallback={<LoadingFallback />}>
                                <USTreasuryDemandGauge />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <ShieldAlert className="text-emerald-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Foreign Holders</h2>
                        </div>
                        <SectionErrorBoundary name="Top Treasury Holders">
                            <Suspense fallback={<LoadingFallback />}>
                                <TopTreasuryHoldersTable />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>
                </div>

                {/* Section 3: US Macro Pulse (Sankey) */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="text-blue-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Capital & Energy Liquidity Flows</h2>
                        </div>
                    </div>
                    <SectionErrorBoundary name="US Macro Pulse">
                        <Suspense fallback={<LoadingFallback />}>
                            <USMacroPulseSection />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* Section 4: Policy Tracker */}
                <section className="pt-12 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-8">
                        <ShieldAlert className="text-rose-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Trump Action Monitor</h2>
                    </div>
                    <SectionErrorBoundary name="Policy Tracker">
                        <Suspense fallback={<LoadingFallback />}>
                            <PresidentialPolicyTracker />
                        </Suspense>
                    </SectionErrorBoundary>
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

export default USMacroFiscalLab;

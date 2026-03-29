import React, { Suspense, lazy } from 'react';
import { Container, Typography, Box, Button, Breadcrumbs, Link } from '@mui/material';
import {
    ChevronRight,
    ArrowLeft,
    ShieldAlert,
    ShieldCheck,
    TrendingUp,
    Zap,
    BarChart3
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';

// Components
import { USDebtMaturityWall } from '@/components/USDebtMaturityWall';
import { LazyRender } from '@/components/LazyRender';

// Lazy loaded components
const USTreasuryDemandGauge = lazy(() => import('@/features/dashboard/components/rows/USTreasuryDemandGauge').then(m => ({ default: m.USTreasuryDemandGauge })));
const TreasuryHoldersSection = lazy(() => import('@/features/dashboard/components/sections/TreasuryHoldersSection').then(m => ({ default: m.TreasuryHoldersSection })));
const USMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/USMacroPulseSection').then(m => ({ default: m.USMacroPulseSection })));
const CorporateTreasuryHedgingSection = lazy(() => import('@/features/dashboard/components/sections/CorporateTreasuryHedgingSection').then(m => ({ default: m.CorporateTreasuryHedgingSection })));
const USFiscalComparisonChart = lazy(() => import('@/features/dashboard/components/rows/USFiscalComparisonChart'));
const PresidentialPolicyTracker = lazy(() => import('@/features/dashboard/components/sections/PresidentialPolicyTracker').then(m => ({ default: m.PresidentialPolicyTracker })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading Signal...</span>
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

            <div className="space-y-32">
                {/* Section 1: Debt Maturity Wall */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <TrendingUp className="text-blue-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">US Debt Maturity Wall</h2>
                    </div>
                    <SectionErrorBoundary name="US Debt Maturity Wall">
                        <LazyRender minHeight="500px">
                            <Suspense fallback={<LoadingFallback />}>
                                <USDebtMaturityWall />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-us-debt-maturity" insight="The maturity wall tracks $9.2T in rolling securities. The 2025-2027 window represents a critical refinancing regime where low-coupon pandemic-era debt is re-priced at structurally higher market yields." />
                </section>

                {/* Section 2: Treasury Demand */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Zap className="text-amber-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Auction Demand</h2>
                    </div>
                    <SectionErrorBoundary name="Treasury Demand Gauge">
                        <LazyRender minHeight="300px">
                            <Suspense fallback={<LoadingFallback />}>
                                <USTreasuryDemandGauge />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 3: Foreign Holders */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <ShieldAlert className="text-emerald-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Foreign Holders</h2>
                    </div>
                    <SectionErrorBoundary name="Top Treasury Holders">
                        <LazyRender minHeight="700px">
                            <Suspense fallback={<LoadingFallback />}>
                                <TreasuryHoldersSection />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 4: US Fiscal Comparison */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <TrendingUp className="text-indigo-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Defense vs Interest</h2>
                    </div>
                    <SectionErrorBoundary name="US Fiscal Comparison">
                        <LazyRender minHeight="400px">
                            <Suspense fallback={<LoadingFallback />}>
                                <USFiscalComparisonChart />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-us-fiscal-comp" insight="Net interest payments on US federal debt have risen from $250B to over $1T annually, now rivaling the total national defense budget – a structural shift with profound implications for fiscal policy flexibilty." />
                </section>

                {/* Section 5: US Macro Pulse (Sankey) */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="text-blue-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Capital & Energy Liquidity Flows</h2>
                        </div>
                    </div>
                    <SectionErrorBoundary name="US Macro Pulse">
                        <LazyRender minHeight="500px">
                            <Suspense fallback={<LoadingFallback />}>
                                <USMacroPulseSection />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 6: Corporate Treasury Hedging (New) */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <ShieldCheck className="text-emerald-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Hedging Opportunities</h2>
                    </div>
                    <SectionErrorBoundary name="Corporate Hedging monitor">
                        <LazyRender minHeight="400px">
                            <Suspense fallback={<LoadingFallback />}>
                                <CorporateTreasuryHedgingSection />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 6: Policy Tracker */}
                <section className="pt-12 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-8">
                        <ShieldAlert className="text-rose-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Trump Action Monitor</h2>
                    </div>
                    <SectionErrorBoundary name="Policy Tracker">
                        <LazyRender minHeight="300px">
                            <Suspense fallback={<LoadingFallback />}>
                                <PresidentialPolicyTracker />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 7: Equity Fundamental Pulse (New) */}
                <section className="pt-12 border-t border-white/5">
                    <Box sx={{
                        p: 8,
                        borderRadius: '40px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(0, 0, 0, 0) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 6
                    }}>
                        <Box sx={{ flex: 1 }}>
                            <div className="flex items-center gap-3 mb-4">
                                <BarChart3 className="text-blue-400" size={24} />
                                <h2 className="text-2xl font-black uppercase tracking-tight text-white">US Equity Fundamental Pulse</h2>
                            </div>
                            <Typography variant="body1" sx={{ color: 'white/60', mb: 6, fontWeight: 500, lineHeight: 1.6 }}>
                                Deep macro-to-corporate correlation engine. Analyze how sovereign debt dynamics and policy shifts impact US corporate margins, valuation tiers, and institutional positioning through official SEC EDGAR telemetry.
                            </Typography>
                            <Button
                                variant="contained"
                                endIcon={<ChevronRight size={16} />}
                                href="/us-equities"
                                sx={{
                                    bgcolor: '#3b82f6',
                                    fontWeight: 900,
                                    fontSize: '0.75rem',
                                    borderRadius: '12px',
                                    px: 4,
                                    py: 1.5,
                                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                                    '&:hover': { bgcolor: '#2563eb' }
                                }}
                            >
                                Launch Equities Terminal
                            </Button>
                        </Box>
                        <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, width: '100%' }}>
                            {[
                                { label: 'Valuation Tiers', sub: 'P/E Heatmaps' },
                                { label: 'Insider Ops', sub: 'Conviction Feed' },
                                { label: 'Leverage Pulse', sub: 'Debt/Equity' },
                                { label: 'Whale Tracking', sub: '13F Holdings' }
                            ].map((item, i) => (
                                <Box key={i} sx={{ p: 4, borderRadius: '24px', bgcolor: 'white/[0.03]', border: '1px solid white/5' }}>
                                    <Typography variant="caption" sx={{ display: 'block', color: 'blue.400', fontWeight: 900, mb: 0.5, textTransform: 'uppercase' }}>{item.label}</Typography>
                                    <Typography variant="body2" sx={{ color: 'white/40', fontWeight: 700 }}>{item.sub}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </section>
            </div>

            {/* SEO Structural Analysis Text Block */}
            <article className="mt-32 p-12 bg-white/[0.02] border border-white/5 rounded-3xl" aria-label="Structural Analysis of US Fiscal Trajectory">
                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-6">Structural Analysis: The US Fiscal Trajectory & Sovereign Debt</h3>
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
                    <p>
                        The <strong>US Macro & Fiscal Lab</strong> provides high-frequency telemetry on the structural constraints facing the United States Treasury and the Federal Reserve. Over the past decade, the reliance on short-term debt issuance (Treasury Bills) has created a significant <em>maturity wall</em>, forcing the sovereign to constantly refinance obligations rather than lock in long-term capital.
                    </p>
                    <p>
                        Our predictive telemetry indicates that as interest expense on the national debt supersedes major discretionary categories (such as defense spending), the likelihood of <strong>fiscal dominance</strong> increases. Fiscal dominance occurs when the central bank is forced to subordinate its inflation target to maintain the solvency of the government, often leading to <a href="/glossary/stealth-qe" className="text-blue-400 hover:underline">Stealth QE</a> or Yield Curve Control (YCC). By tracking <em>Treasury Auction Demand Metrics</em> natively through GraphiQuestor, institutional participants can monitor the exact inflection point of buyer exhaustion.
                    </p>
                    <p>
                        Simultaneously, the <a href="/glossary/tga" className="text-blue-400 hover:underline">Treasury General Account (TGA)</a> and the Overnight Reverse Repo Facility (RRP) act as critical hydraulic valves for global liquidity. By synthesizing direct data feeds from the Federal Reserve Economic Data (FRED) API with our custom capital flow Sankey architectures, analysts can isolate the precise velocity at which liquidity is injected or drained from risk assets.
                    </p>
                </div>
            </article>

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

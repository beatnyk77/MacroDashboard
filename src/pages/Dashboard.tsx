import React, { Suspense, lazy } from 'react';
import { Container, Box, Button } from '@mui/material';
import {
    ShieldAlert,
    Zap,
    ChevronRight,
    Lock
} from 'lucide-react';
import { SPASection } from '@/components/spa';
import { SectionHeader } from '@/components/SectionHeader';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { SEOManager } from '@/components/SEOManager';
import { USDebtMaturityWall } from '@/components/USDebtMaturityWall';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';

// Row Components
import { NetLiquidityRow } from '@/features/dashboard/components/rows/NetLiquidityRow';

// Lazy load key components for the homepage
const CockpitKPIGrid = lazy(() => import('@/features/dashboard/components/CockpitKPIGrid').then(m => ({ default: m.CockpitKPIGrid })));
const USTreasuryDemandGauge = lazy(() => import('@/features/dashboard/components/rows/USTreasuryDemandGauge').then(m => ({ default: m.USTreasuryDemandGauge })));
const CompactIndiaCard = lazy(() => import('@/features/dashboard/components/cards/CompactIndiaCard').then(m => ({ default: m.CompactIndiaCard })));
const CompactChinaCard = lazy(() => import('@/features/dashboard/components/cards/CompactChinaCard').then(m => ({ default: m.CompactChinaCard })));
const GoldRatioRibbon = lazy(() => import('@/features/dashboard/components/sections/GoldRatioRibbon').then(m => ({ default: m.GoldRatioRibbon })));
const SovereignRiskMatrix = lazy(() => import('@/features/dashboard/components/sections/SovereignRiskMatrix').then(m => ({ default: m.SovereignRiskMatrix })));
const CompactCommodityCard = lazy(() => import('@/features/commodities/components/CompactCommodityCard').then(m => ({ default: m.CompactCommodityCard })));
const BlogSection = lazy(() => import('@/features/dashboard/components/sections/BlogSection').then(m => ({ default: m.BlogSection })));
const WeeklyNarrativeSection = lazy(() => import('@/features/dashboard/components/sections/WeeklyNarrativeSection').then(m => ({ default: m.WeeklyNarrativeSection })));
const CapitalFlowsTerminal = lazy(() => import('@/features/dashboard/components/rows/CapitalFlowsTerminal').then(m => ({ default: m.CapitalFlowsTerminal })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading Signal...</span>
    </div>
);

export const Dashboard: React.FC = () => {
    return (
        <Container maxWidth={false} disableGutters sx={{ py: 4 }}>
            <SEOManager
                title="Institutional Macro & Sovereign Debt Terminal"
                description="Institutional-grade macro telemetry tracking Global Net Liquidity, Debt maturity, and BRICS de-dollarization. Access proprietary hard-money signals."
                keywords={['Macro Research', 'Institutional Intelligence', 'Sovereign Debt', 'Liquidity Signal']}
                isApp={true}
                jsonLd={[
                    {
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "GraphiQuestor",
                        "url": "https://graphiquestor.com",
                        "logo": "https://graphiquestor.com/logo.png",
                        "sameAs": [
                            "https://twitter.com/GraphiQuestor",
                            "https://linkedin.com/company/graphiquestor"
                        ]
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "GraphiQuestor",
                        "url": "https://graphiquestor.com",
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": "https://graphiquestor.com/?q={search_term_string}",
                            "query-input": "required name=search_term_string"
                        }
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": [
                            {
                                "@type": "Question",
                                "name": "What is the Sovereign Debt to Gold ratio?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "The Sovereign Debt to Gold (SDG) ratio is a mathematical gauge used to track fiscal dominance and currency debasement by comparing total sovereign liabilities to physical gold reserves."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "How does GraphiQuestor track Global Net Liquidity?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "GraphiQuestor synthesizes real-time balance sheet data from the Federal Reserve, TGA, and Reverse Repo facilities to identify liquidity regime shifts."
                                }
                            }
                        ]
                    }
                ]}
            />

            <main className="space-y-32">
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
                    </div>

                    <div className="space-y-12">
                        <SectionErrorBoundary name="Net Liquidity">
                            <NetLiquidityRow />
                        </SectionErrorBoundary>

                        <SectionErrorBoundary name="Capital Flows Terminal">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="pt-12 border-t border-white/5">
                                    <CapitalFlowsTerminal />
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>

                        <SectionErrorBoundary name="Cockpit KPI">
                            <Suspense fallback={<LoadingFallback />}>
                                <CockpitKPIGrid simplified={true} />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </SPASection>

                {/* 2.5 WEEKLY MACRO NARRATIVE */}
                <SPASection id="weekly-narrative">
                    <SectionErrorBoundary name="Weekly Narrative">
                        <Suspense fallback={<LoadingFallback />}>
                            <WeeklyNarrativeSection />
                        </Suspense>
                    </SectionErrorBoundary>
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
                    <div className="mt-12 space-y-6">
                        <SectionErrorBoundary name="India Market Pulse">
                            <Suspense fallback={<LoadingFallback />}>
                                <CompactIndiaCard />
                            </Suspense>
                        </SectionErrorBoundary>

                        <SectionErrorBoundary name="China Market Pulse">
                            <Suspense fallback={<LoadingFallback />}>
                                <CompactChinaCard />
                            </Suspense>
                        </SectionErrorBoundary>
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

                {/* 10. METHODOLOGY & NETWORK (SEO/AEO Text Expansion) */}
                <SPASection id="methodology" className="pt-24 pb-32 border-t border-white/5">
                    <div className="max-w-4xl mx-auto space-y-12">
                        <header className="space-y-4">
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Institutional Intelligence Methodology</h2>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                GraphiQuestor operates as a sovereign intelligence console, specializing in the transition from debt-monopoly systems to hard-money telemetry. Our methodology integrates three core signal layers to provide capital allocators with structural alpha.
                            </p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <article className="space-y-4">
                                <h3 className="text-lg font-bold text-blue-400 uppercase tracking-tight">I. The Liquidity Plumbing</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    We track global net liquidity by synthesizing balance sheet data from the <a href="https://www.federalreserve.gov" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Federal Reserve</a>, <a href="https://www.ecb.europa.eu" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">ECB</a>, and <a href="https://www.pboc.gov.cn" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">PBoC</a>. By monitoring the Treasury General Account (TGA) and Reverse Repo (RRP) facilities, GraphiQuestor identifies stealth QE and liquidity drain cycles before they manifest in spot markets.
                                </p>
                            </article>
                            <article className="space-y-4">
                                <h3 className="text-lg font-bold text-amber-500 uppercase tracking-tight">II. The Hard Money Anchor</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Our "Sovereign Debt to Gold" (SDG) ratio provides a mathematical gauge of fiscal dominance. As G20 nations navigate the <a href="/labs/de-dollarization-gold" className="text-amber-500 hover:underline">De-Dollarization</a> vector, we track central bank gold accumulation (CBGA) as the ultimate hedge against paper claim inflation.
                                </p>
                            </article>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl space-y-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Global Intelligence Nodes</h3>
                            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[0.6rem] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> <a href="/labs/india" className="hover:text-white">India Hub</a></li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> <a href="/labs/china" className="hover:text-white">China Pulse</a></li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> <a href="/labs/energy" className="hover:text-white">Energy Security</a></li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> <a href="/api-access" className="hover:text-white">API Access</a></li>
                            </ul>
                            <p className="text-[0.65rem] text-muted-foreground/40 leading-relaxed font-medium pt-4 border-t border-white/5">
                                Data for GraphiQuestor is autonomously ingested from authoritative sources including the <a href="https://www.imf.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">IMF</a>, <a href="https://www.bis.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">BIS</a>, and <a href="https://www.mospi.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">MoSPI</a>. Our 25-year historical pipeline ensures all regime signals are grounded in structural reality.
                            </p>
                        </div>
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
                                <CompactCommodityCard />
                            </Suspense>
                        </SectionErrorBoundary>
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
            </main>
        </Container>
    );
};

export default Dashboard;

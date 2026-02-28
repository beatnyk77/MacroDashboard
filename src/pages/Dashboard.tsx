import React, { Suspense, lazy } from 'react';
import { Container, Box, Button } from '@mui/material';
import {
    Zap,
    ChevronRight,
    Lock,
    Building2
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
                <SPASection id="hero" variant="hero" disableAnimation className="pt-20">
                    <div className="max-w-5xl mx-auto text-center mb-16 px-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[0.65rem] font-black uppercase tracking-widest mb-10 animate-fade-in">
                            <Zap size={12} /> Institutional Intelligence Console
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase leading-[0.9] mb-8">
                            MACRO<br />
                            <span className="text-blue-500">SOVEREIGNTY</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto uppercase font-bold tracking-tight opacity-70 mb-12 leading-tight">
                            Navigating the transition from fiat-monopoly to hard-money telemetry and sovereign multi-polarity.
                        </p>

                        <div className="flex flex-wrap justify-center gap-6 mb-20">
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => window.location.href = '#weekly-narrative'}
                                sx={{
                                    bgcolor: '#3b82f6',
                                    fontWeight: 900,
                                    px: 6,
                                    py: 2,
                                    borderRadius: '16px',
                                    fontSize: '1rem',
                                    '&:hover': { bgcolor: '#2563eb' }
                                }}
                            >
                                Read Weekly Narrative
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={() => window.location.href = '/institutional'}
                                sx={{
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontWeight: 900,
                                    px: 6,
                                    py: 2,
                                    borderRadius: '16px',
                                    fontSize: '1rem',
                                    backdropFilter: 'blur(10px)',
                                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
                                }}
                            >
                                Institutional $28/mo API
                            </Button>
                        </div>

                        {/* Curated Hero Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            <SectionErrorBoundary name="Hero Metrics">
                                <Suspense fallback={<LoadingFallback />}>
                                    <CockpitKPIGrid simplified={true} />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </div>

                    <SectionErrorBoundary name="Maturity Wall">
                        <Suspense fallback={<LoadingFallback />}>
                            <div className="mt-20 pt-20 border-t border-white/5">
                                <USDebtMaturityWall />
                            </div>
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="hero-insight" insight="US Debt rollover remains the primary gravitational force in global markets. Tracking the $9.2T maturity wall is essential for regime identification." />
                </SPASection>

                {/* 2. WEEKLY MACRO NARRATIVE - Moved Higher */}
                <SPASection id="weekly-narrative">
                    <SectionHeader
                        title="Weekly Narrative"
                        subtitle="What changed in the macro structure this week?"
                    />
                    <SectionErrorBoundary name="Weekly Narrative">
                        <Suspense fallback={<LoadingFallback />}>
                            <WeeklyNarrativeSection />
                        </Suspense>
                    </SectionErrorBoundary>
                </SPASection>

                {/* 3. MACRO HEARTBEAT (Simplified) */}
                <SPASection id="heartbeat">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <SectionHeader
                            title="Macro Heartbeat"
                            subtitle="High-frequency liquidity and regime signals"
                            sectionId="heartbeat"
                        />
                    </div>

                    <div className="space-y-24">
                        <SectionErrorBoundary name="Net Liquidity">
                            <div className="space-y-8 max-w-6xl mx-auto">
                                <NetLiquidityRow />
                                <div className="p-6 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10">
                                    <p className="text-base text-muted-foreground/80 leading-relaxed font-medium">
                                        <span className="text-blue-400 font-black uppercase mr-3 tracking-widest text-xs">Regime Insight:</span>
                                        Net liquidity dictates the short-term path of risk assets. We monitor the TGA and RRP to detect stealth-QE before it manifests in broader market pricing.
                                    </p>
                                </div>
                            </div>
                        </SectionErrorBoundary>

                        <SectionErrorBoundary name="Capital Flows Terminal">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="space-y-8 max-w-6xl mx-auto pt-16 border-t border-white/5">
                                    <CapitalFlowsTerminal hideHeader />
                                    <div className="p-6 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10">
                                        <p className="text-base text-muted-foreground/80 leading-relaxed font-medium">
                                            <span className="text-blue-400 font-black uppercase mr-3 tracking-widest text-xs">Flow Context:</span>
                                            Relative capital velocity between USD, Gold, and Emerging Markets reveals the current regime's destination. Structural shifts in offshore US dollar availability often precede Treasury auction stress.
                                        </p>
                                    </div>
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </SPASection>

                {/* 4. US FISCAL & MACRO STRESS */}
                <SPASection id="us-fiscal">
                    <SectionHeader
                        title="US Fiscal & Macro Stress"
                        subtitle="Treasury demand dynamics and auction stress levels"
                    />
                    <div className="mt-16 space-y-12 max-w-6xl mx-auto">
                        <SectionErrorBoundary name="Treasury Demand">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="p-12 rounded-[32px] bg-white/[0.02] border border-white/5">
                                    <USTreasuryDemandGauge />
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                        <div className="p-10 rounded-3xl bg-blue-500/[0.03] border border-blue-500/10 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-2xl text-white font-black uppercase tracking-tighter mb-6 underline decoration-blue-500/30 decoration-4 underline-offset-8">The US Maturity Wall is now a structural issue.</p>
                                <p className="text-muted-foreground leading-relaxed text-lg mb-10 max-w-4xl">
                                    <span className="text-blue-400 font-black uppercase mr-3 tracking-widest text-xs">Sovereign Thesis:</span>
                                    As US interest expense exceeds defense spending, the "Auction Stress" signal becomes the primary driver for yields. We monitor primary dealer absorption and indirect-bid ratios to detect when the market stops absorbing the supply.
                                </p>
                                <Button
                                    variant="contained"
                                    href="/labs/us-macro-fiscal"
                                    endIcon={<ChevronRight size={16} />}
                                    sx={{
                                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                                        color: '#3b82f6',
                                        fontWeight: 900,
                                        fontSize: '0.75rem',
                                        px: 4,
                                        py: 1.5,
                                        borderRadius: '12px',
                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                        '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' }
                                    }}
                                >
                                    Detailed US Fiscal Intelligence
                                </Button>
                            </div>
                        </div>
                    </div>
                </SPASection>

                {/* 5. INDIA EQUITIES ENGINE TEASER - Flagship Section */}
                <SPASection id="india-equities">
                    <div className="p-12 md:p-16 rounded-[40px] border border-blue-500/20 bg-blue-500/[0.02] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse" />

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[0.65rem] font-black uppercase tracking-widest mb-6">
                                    <Building2 size={12} /> Flagship Equities Lab
                                </div>
                                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase leading-none mb-8">
                                    Corporate India<br />
                                    <span className="text-blue-500">Engine</span>
                                </h1>
                                <p className="text-xl text-muted-foreground leading-snug font-bold mb-10 max-w-lg">
                                    The first fundamental terminal for Indian equities with a proprietary Macro Overlay.
                                </p>
                                <ul className="space-y-4 mb-12">
                                    {[
                                        'Deep-dive Fundamental Analytics',
                                        'Macro-Overlay Signal Testing',
                                        'Institutional Block/Bulk flow telemetry',
                                        'Governance & Promoter Risk Heatmaps'
                                    ].map(item => (
                                        <li key={item} className="flex items-center gap-3 text-sm font-black text-white/70 uppercase">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    variant="contained"
                                    href="/india-equities"
                                    sx={{
                                        bgcolor: '#3b82f6',
                                        fontWeight: 900,
                                        px: 6,
                                        py: 2,
                                        borderRadius: '16px',
                                        fontSize: '1rem',
                                        '&:hover': { bgcolor: '#2563eb' }
                                    }}
                                >
                                    Access Equity Lab
                                </Button>
                            </div>
                            <div className="relative">
                                <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-3xl transform group-hover:scale-[1.02] transition-transform duration-700">
                                    <SectionErrorBoundary name="India Teaser Card">
                                        <Suspense fallback={<LoadingFallback />}>
                                            <CompactIndiaCard />
                                        </Suspense>
                                    </SectionErrorBoundary>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
                            </div>
                        </div>
                    </div>
                </SPASection>

                {/* 6. CHINA PULSE */}
                <SPASection id="china-pulse">
                    <SectionHeader
                        title="The China Vector"
                        subtitle="Counter-cyclical telemetry for the world's second economy"
                    />
                    <div className="mt-16 space-y-16 max-w-6xl mx-auto">
                        <SectionErrorBoundary name="China Market Pulse">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="p-8 rounded-[32px] bg-white/[0.01] border border-white/5">
                                    <CompactChinaCard />
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                        <div className="p-10 rounded-3xl bg-blue-500/[0.03] border border-blue-500/10">
                            <p className="text-2xl text-white font-black uppercase tracking-tighter mb-6 underline decoration-blue-500/30 decoration-4 underline-offset-8">China is shifting from credit-growth to technology-sovereignty.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                                <p className="text-muted-foreground leading-relaxed text-lg">
                                    <span className="text-blue-400 font-black uppercase mr-3 tracking-widest text-xs">Macro Proxy:</span>
                                    As the PBoC maintains a divergence from the Fed, the China Pulse tracks domestic liquidity and deflationary export pressures affecting global EM portfolios.
                                </p>
                                <div className="flex justify-start md:justify-end">
                                    <Button
                                        variant="contained"
                                        href="/labs/china"
                                        endIcon={<ChevronRight size={16} />}
                                        sx={{
                                            bgcolor: 'rgba(59, 130, 246, 0.1)',
                                            color: '#3b82f6',
                                            fontWeight: 900,
                                            px: 4,
                                            py: 1.5,
                                            borderRadius: '12px',
                                            border: '1px solid rgba(59, 130, 246, 0.2)',
                                            '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' }
                                        }}
                                    >
                                        Detailed China Telemetry
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </SPASection>

                {/* 7. HARD MONEY & RESERVE SHIFT */}
                <SPASection id="hard-money">
                    <SectionHeader
                        title="Hard Money & Reserve Shift"
                        subtitle="Gold anchor ratios and the de-dollarization vector"
                    />
                    <div className="mt-16 space-y-16 max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 gap-12">
                            <div className="p-10 rounded-3xl bg-amber-500/[0.03] border border-amber-500/10">
                                <p className="text-2xl text-amber-400 font-black uppercase tracking-tighter mb-6 underline decoration-amber-400/30 decoration-4 underline-offset-8">The Sovereign Debt to Gold Ratio is the ultimate system-gauge.</p>
                                <p className="text-muted-foreground leading-relaxed text-lg mb-10">
                                    <span className="text-amber-500 font-black uppercase mr-3 tracking-widest text-xs">Reserve Thesis:</span>
                                    As central banks diversify away from USD-denominated paper, the "SDG Ratio" tracks the structural re-anchoring to physical reserves. Physical gold purchases by G20 central banks are now at 50-year highs.
                                </p>
                                <SectionErrorBoundary name="Gold Ratio">
                                    <Suspense fallback={<LoadingFallback />}>
                                        <div className="p-8 rounded-2xl bg-black/20 border border-white/5">
                                            <GoldRatioRibbon />
                                        </div>
                                    </Suspense>
                                </SectionErrorBoundary>
                            </div>

                            <Box className="p-16 rounded-[40px] border border-amber-500/20 bg-amber-500/[0.02] text-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                                    <Lock size={200} />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-4xl font-black text-amber-500 uppercase mb-6 tracking-tighter">Sovereign De-Dollarization</h3>
                                    <p className="text-muted-foreground max-w-2xl mx-auto mb-10 text-lg leading-relaxed font-medium">
                                        Detailed tracking of G20 central bank gold net purchases and the structural shift in global reserve compositions.
                                    </p>
                                    <Button
                                        variant="contained"
                                        href="/labs/de-dollarization-gold"
                                        size="large"
                                        sx={{
                                            bgcolor: 'rgba(245, 158, 11, 0.1)',
                                            color: '#f59e0b',
                                            fontWeight: 900,
                                            px: 6,
                                            py: 2,
                                            borderRadius: '20px',
                                            border: '1px solid rgba(245, 158, 11, 0.2)',
                                            fontSize: '1rem',
                                            '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.2)' }
                                        }}
                                    >
                                        Access De-Dollarization Lab
                                    </Button>
                                </div>
                            </Box>
                        </div>
                    </div>
                </SPASection>

                {/* 8. ENERGY & COMMODITY SECURITY */}
                <SPASection id="commodities">
                    <div className="space-y-24 max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 gap-16 items-start">
                            <div className="space-y-12">
                                <SectionHeader
                                    title="Resource Security"
                                    subtitle="Geopolitical chokepoints and physical flows"
                                    sectionId="commodities"
                                />
                                <div className="p-10 rounded-3xl bg-blue-500/[0.03] border border-blue-500/10">
                                    <p className="text-muted-foreground leading-relaxed text-lg mb-8">
                                        <span className="text-blue-400 font-black uppercase mr-3 tracking-widest text-xs">Physical Edge:</span>
                                        Physical flow dynamics and geopolitical chokepoints now dictate commodity pricing more than paper markets. We track 14 critical nodes from the Malacca Strait to the Suez Canal.
                                    </p>
                                    <Button
                                        variant="outlined"
                                        href="/labs/energy-commodities"
                                        sx={{
                                            borderColor: 'white/10',
                                            color: 'white',
                                            fontWeight: 900,
                                            px: 4,
                                            py: 1.5,
                                            borderRadius: '12px',
                                            '&:hover': { borderColor: 'white/30', bgcolor: 'white/5' }
                                        }}
                                    >
                                        Detailed Resource Analytics
                                    </Button>
                                </div>
                            </div>
                            <SectionErrorBoundary name="Commodity Terminal">
                                <Suspense fallback={<LoadingFallback />}>
                                    <div className="p-8 rounded-[32px] bg-white/[0.01] border border-white/5">
                                        <CompactCommodityCard />
                                    </div>
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </div>
                </SPASection>

                {/* 9. SOVEREIGN STRESS & FRAGILITY */}
                <SPASection id="sovereign-stress" className="pb-32">
                    <SectionHeader
                        title="Sovereign Fragility"
                        subtitle="Debt sustainability and global risk matrix"
                    />
                    <div className="space-y-12">
                        <SectionErrorBoundary name="Risk Matrix">
                            <Suspense fallback={<LoadingFallback />}>
                                <SovereignRiskMatrix />
                            </Suspense>
                        </SectionErrorBoundary>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { title: 'Shadow System', desc: 'Offshore wealth flight and illicit flow telemetry.', path: '/labs/shadow-system' },
                                { title: 'Sovereign Stress', desc: 'G20 debt maturity walls and CDS spread matrix.', path: '/labs/sovereign-stress' },
                                { title: 'Observatory', desc: 'Unified index of all thematic signal monitors.', path: '/macro-observatory' }
                            ].map(card => (
                                <div key={card.title} className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
                                    <h4 className="text-lg font-black text-white uppercase mb-3">{card.title}</h4>
                                    <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{card.desc}</p>
                                    <Button
                                        variant="text"
                                        href={card.path}
                                        sx={{
                                            fontSize: '0.65rem',
                                            fontWeight: 900,
                                            color: '#3b82f6',
                                            p: 0,
                                            '&:hover': { background: 'none', color: 'white' }
                                        }}
                                        endIcon={<ChevronRight size={14} />}
                                    >
                                        Access Data
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </SPASection>
            </main>
        </Container>
    );
};

export default Dashboard;

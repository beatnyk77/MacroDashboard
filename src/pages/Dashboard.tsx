import React, { Suspense, lazy } from 'react';
import { Container, Button, TextField, InputAdornment } from '@mui/material';
import {
    Zap,
    Lock,
    Building2,
    Globe,
    Shield,
    FlaskConical,
    Activity,
    Mail,
    ArrowRight,
    TrendingUp,
    Anchor,
    ShieldAlert
} from 'lucide-react';
import { SPASection } from '@/components/spa';
import { SectionHeader } from '@/components/SectionHeader';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { SEOManager } from '@/components/SEOManager';
import { USDebtMaturityWall } from '@/components/USDebtMaturityWall';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';

// Row Components
import { NetLiquidityRow } from '@/features/dashboard/components/rows/NetLiquidityRow';
import { GeopoliticalEventsRow } from '@/features/dashboard/components/rows/GeopoliticalEventsRow';

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
const PredictionMarketTerminal = lazy(() => import('@/features/dashboard/components/widgets/PredictionMarketTerminal').then(m => ({ default: m.PredictionMarketTerminal })));
const PredictionMarketHeatmap = lazy(() => import('@/features/dashboard/components/widgets/PredictionMarketHeatmap').then(m => ({ default: m.PredictionMarketHeatmap })));
const ArbitrageScanner = lazy(() => import('@/features/dashboard/components/widgets/ArbitrageScanner').then(m => ({ default: m.ArbitrageScanner })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading Signal...</span>
    </div>
);

export const Dashboard: React.FC = () => {
    return (
        <Container maxWidth={false} disableGutters sx={{ py: 0 }}>
            <SEOManager
                title="Macro Observatory for the Multipolar Era"
                description="Track global liquidity, sovereign stress, de-dollarization, and India/China macro in one live console. 25 years of data from BIS, IMF, FRED, MoSPI, and RBI — zero aggregator lag."
                keywords={[
                    'Macro Intelligence', 'Macro Research', 'Global Liquidity Tracking',
                    'Sovereign Debt Monitoring', 'De-Dollarization', 'Net Liquidity',
                    'India MoSPI Data', 'Central Bank Gold Reserves', 'Geopolitical Risk Intelligence'
                ]}
                isApp={true}
                jsonLd={[
                    {
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "GraphiQuestor",
                        "operatingSystem": "Web",
                        "applicationCategory": "FinancialApplication",
                        "offers": {
                            "@type": "Offer",
                            "price": "28.00",
                            "priceCurrency": "USD"
                        }
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": [
                            {
                                "@type": "Question",
                                "name": "What is the GRIT Index?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "The GRIT Index (Geopolitical Risk & Institutional Transition) is GraphiQuestor's proprietary composite tracking sovereign debt stress, reserve diversification velocity, and liquidity drain signals."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "Does GraphiQuestor have India MoSPI data?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Yes, we provide direct integration with MoSPI for state-level India fiscal and industrial data with zero aggregator lag."
                                }
                            }
                        ]
                    }
                ]}
            />

            <main className="space-y-32">
                {/* 1. HERO SECTION */}
                <SPASection id="hero" variant="hero" disableAnimation className="pt-24 pb-32">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[0.65rem] font-black uppercase tracking-widest mb-10 animate-fade-in">
                                    <Activity size={12} /> Independent Macro Observatory
                                </div>
                                <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white uppercase leading-[0.9] mb-8">
                                    MACRO OBSERVATORY FOR THE<br />
                                    <span className="text-blue-500">MULTIPOLAR ERA</span>
                                </h1>
                                <p className="text-lg md:text-xl text-muted-foreground max-w-xl uppercase font-bold tracking-tight opacity-70 mb-10 leading-tight">
                                    Track global liquidity, sovereign stress, and India/China regimes. Not a Sovereign AI product—pure analytical independence.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={() => {
                                            const el = document.getElementById('weekly-narrative');
                                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        sx={{
                                            bgcolor: '#3b82f6',
                                            fontWeight: 900,
                                            px: 4,
                                            py: 2,
                                            borderRadius: '14px',
                                            fontSize: '0.9rem',
                                            '&:hover': { bgcolor: '#2563eb' }
                                        }}
                                    >
                                        Subscribe to Regime Digest
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
                                            py: 2,
                                            borderRadius: '14px',
                                            fontSize: '0.9rem',
                                            backdropFilter: 'blur(10px)',
                                            '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
                                        }}
                                    >
                                        For Funds & Family Offices
                                    </Button>
                                </div>

                                <div className="email-capture-glass max-w-md">
                                    <TextField
                                        placeholder="Enter email for Weekly Regime Digest"
                                        variant="standard"
                                        InputProps={{
                                            disableUnderline: true,
                                            startAdornment: (
                                                <InputAdornment position="start" sx={{ pl: 2, color: 'rgba(255,255,255,0.3)' }}>
                                                    <Mail size={18} />
                                                </InputAdornment>
                                            ),
                                            sx: {
                                                color: 'white',
                                                fontSize: '0.85rem',
                                                fontWeight: 500,
                                                height: '48px'
                                            }
                                        }}
                                        sx={{ flex: 1 }}
                                    />
                                    <Button
                                        variant="contained"
                                        sx={{
                                            bgcolor: 'white',
                                            color: 'black',
                                            fontWeight: 900,
                                            borderRadius: '10px',
                                            px: 3,
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.8)' }
                                        }}
                                    >
                                        Join
                                    </Button>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="rounded-[32px] overflow-hidden border border-white/10 shadow-3xl bg-slate-900/50 backdrop-blur-3xl p-2 group">
                                    <img
                                        src="/hero-preview.png"
                                        alt="GraphiQuestor Terminal Interface"
                                        className="w-full rounded-[24px] transition-transform duration-700 group-hover:scale-[1.01]"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                                </div>

                                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
                                <div className="absolute -top-10 -left-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-24">
                            {[
                                { title: "25-YEAR LIQUIDITY MAP", desc: "Fed TGA/RRP regime patterns since 2000.", icon: <Activity className="text-blue-400" size={16} /> },
                                { title: "DIRECT MoSPI INTEGRATION", desc: "State-level India fiscal & industrial telemetry.", icon: <Globe className="text-emerald-400" size={16} /> },
                                { title: "DE-DOLLARIZATION VECTOR", desc: "Real-time G20 debt-to-gold stress ratios.", icon: <Anchor className="text-orange-400" size={16} /> },
                                { title: "SHADOW FLOW TRACKING", desc: "mBridge and BRICS+ parallel settlement flows.", icon: <Zap className="text-blue-500" size={16} /> }
                            ].map((cap, i) => (
                                <div key={i} className="hero-capability-bullet">
                                    <div className="mt-1">{cap.icon}</div>
                                    <div>
                                        <div className="text-[0.65rem] font-black text-white uppercase tracking-wider mb-1">{cap.title}</div>
                                        <div className="text-[0.7rem] text-muted-foreground leading-tight font-medium">{cap.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SPASection>

                {/* 2. WHY GRAPHIQUESTOR? */}
                <SPASection id="why-gq" className="py-24 border-t border-white/5">
                    <div className="max-w-6xl mx-auto px-4">
                        <SectionHeader
                            title="Why GraphiQuestor?"
                            subtitle="Built for the multipolar transition, not the pre-2008 consensus."
                        />

                        <div className="mt-16 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-xl">
                            <div className="grid grid-cols-2 bg-white/5 py-6 px-8 border-b border-white/10">
                                <div className="text-[0.65rem] font-black text-muted-foreground uppercase tracking-[0.2em]">Traditional Terminals</div>
                                <div className="text-[0.65rem] font-black text-blue-400 uppercase tracking-[0.2em]">GraphiQuestor</div>
                            </div>
                            <div className="px-8 flex flex-col">
                                {[
                                    { trad: "National-level GDP aggregates", gq: "State-level fiscal quality (India Capex vs. Freebies)" },
                                    { trad: "Lagged EM data (3–6 month delays)", gq: "Direct official source integration (Zero aggregator lag)" },
                                    { trad: "News-driven narratives", gq: "Structural regime precursors (Liquidity, Gold, Debt)" },
                                    { trad: "Optimized for dollar hegemony", gq: "Built for multipolar geopolitical transition" }
                                ].map((row, i) => (
                                    <div key={i} className="comparison-row">
                                        <div className="text-sm font-medium text-muted-foreground/60">{row.trad}</div>
                                        <div className="text-sm font-bold text-white">{row.gq}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-8 bg-blue-500/5 flex flex-wrap gap-x-8 gap-y-4 items-center justify-center border-t border-white/5">
                                {["25 Years of Data", "10+ Official Sources", "BIS, IMF, FRED, RBI, MoSPI", "Zero Aggregator Lag"].map((point, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-blue-500" />
                                        <span className="text-[0.6rem] font-black text-white/50 uppercase tracking-widest">{point}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </SPASection>

                {/* 3. USE CASES */}
                <SPASection id="use-cases" className="py-24">
                    <div className="max-w-6xl mx-auto px-4">
                        <SectionHeader
                            title="Engineered for Intent"
                            subtitle="Specialized telemetry for high-stakes macro positioning."
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
                            {[
                                { title: "Hedge Funds", desc: "Regime timing for EM allocation and FX tail-risk positioning.", icon: <TrendingUp className="text-blue-400" /> },
                                { title: "Family Offices", desc: "Hard money signals and de-dollarization transition planning.", icon: <Anchor className="text-emerald-400" /> },
                                { title: "India Allocators", desc: "State-level capex quality, MoSPI integration, and Equity Engine.", icon: <Building2 className="text-orange-400" /> },
                                { title: "Geopolitical Analysts", desc: "Shadow flows, mBridge, and BRICS+ parallel settlement tracking.", icon: <Globe className="text-blue-500" /> }
                            ].map((useCase, i) => (
                                <div key={i} className="p-8 rounded-[32px] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
                                    <div className="mb-6 p-4 rounded-2xl bg-white/5 w-fit group-hover:bg-blue-500/10 transition-colors">
                                        {useCase.icon}
                                    </div>
                                    <h4 className="text-lg font-black text-white uppercase mb-3 tracking-tight">{useCase.title}</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">{useCase.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </SPASection>

                {/* 4. PROPRIETARY EDGES */}
                <SPASection id="edges" className="py-24 bg-blue-500/[0.01] border-y border-white/5">
                    <div className="max-w-6xl mx-auto px-4">
                        <SectionHeader
                            title="Proprietary Edges"
                            subtitle="Data you won't find on a standard Bloomberg terminal."
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                            {[
                                { title: "Liquidity Regime Map", desc: "25-year database of Fed TGA/RRP patterns mapping to asset performance.", icon: <Activity /> },
                                { title: "MoSPI Direct Feed", desc: "Zero-lag integration with India's official MoSPI APIs for structural fiscal quality.", icon: <Globe /> },
                                { title: "Sovereign SDG Ratio", desc: "Proprietary Debt-to-Gold stress ratios for G20 nations tracking debasement.", icon: <Anchor /> },
                                { title: "Shadow System Telemetry", desc: "Tracking non-SWIFT settlement flows through mBridge and CBDC bridges.", icon: <Shield /> },
                                { title: "GRIT Index", desc: "Our composite score for Geopolitical Risk and Institutional Transition.", icon: <TrendingUp /> },
                                { title: "India Equity Engine", desc: "Fundamental equity terminal with a macro-regime signal overlay.", icon: <Building2 /> }
                            ].map((edge, i) => (
                                <div key={i} className="flex gap-6 items-start">
                                    <div className="mt-1 p-3 rounded-xl bg-white/5 text-blue-500">{edge.icon}</div>
                                    <div>
                                        <h5 className="text-sm font-black text-white uppercase mb-2">{edge.title}</h5>
                                        <p className="text-xs text-muted-foreground leading-snug">{edge.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SPASection>

                {/* 5. TRUST & CREDIBILITY */}
                <SPASection id="trust" className="py-24">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                            <div className="stat-block">
                                <div className="text-5xl font-black text-white mb-2 tracking-tighter">25Y</div>
                                <div className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest">Regime Data History</div>
                            </div>
                            <div className="stat-block">
                                <div className="text-5xl font-black text-white mb-2 tracking-tighter">10+</div>
                                <div className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest">Official API Sources</div>
                            </div>
                            <div className="stat-block">
                                <div className="text-5xl font-black text-white mb-2 tracking-tighter">ZERO</div>
                                <div className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest">Aggregator Lag</div>
                            </div>
                        </div>
                        <div className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                            {["BIS", "IMF", "FRED", "RBI", "MoSPI", "ECB", "World Bank"].map(logo => (
                                <span key={logo} className="text-sm font-black text-white tracking-widest uppercase">{logo}</span>
                            ))}
                        </div>
                    </div>
                </SPASection>

                {/* 6. GRIT INDEX INTRO */}
                <SPASection id="grit-index" className="py-24">
                    <div className="max-w-5xl mx-auto px-4">
                        <div className="p-12 md:p-16 rounded-[48px] border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="grit-badge mb-8">Proprietary Framework</div>
                                <a href="/labs/sovereign-stress#grit-monitor" className="block hover:opacity-80 transition-opacity">
                                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase leading-none mb-8">
                                        THE <span className="text-blue-500">GRIT</span> INDEX
                                    </h2>
                                    <p className="text-xl md:text-2xl text-white font-bold tracking-tight mb-8">
                                        Geopolitical Risk & Institutional Transition
                                    </p>
                                </a>
                                <blockquote className="text-lg text-muted-foreground italic border-l-4 border-blue-500 pl-8 mb-10 max-w-3xl">
                                    "Where Bloomberg has FLDS, BofA has the Bull & Bear, and Goldman has the FCI — GraphiQuestor tracks the **GRIT Index**, a real-time composite of sovereign debt stress and reserve velocity."
                                </blockquote>
                                <Button
                                    variant="outlined"
                                    href="/labs/sovereign-stress#grit-monitor"
                                    sx={{
                                        borderColor: 'white/10', color: 'white', fontWeight: 900, px: 6, py: 2, borderRadius: '16px',
                                        '&:hover': { borderColor: 'white', bg: 'white/5' }
                                    }}
                                >
                                    View Index Methodology
                                </Button>
                            </div>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-5 scale-150 rotate-12 pointer-events-none">
                                <TrendingUp size={400} />
                            </div>
                        </div>
                    </div>
                </SPASection>

                {/* 7. DATA GOVERNANCE */}
                <SPASection id="data-governance" className="py-24 border-t border-white/5">
                    <div className="max-w-6xl mx-auto px-4">
                        <SectionHeader
                            title="Data Governance"
                            subtitle="Transparency is the foundation of institutional trust."
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
                            {[
                                { title: "Source Integrity", desc: "No web scraping. We only use official API endpoints from BIS, IMF, FRED, and central banks.", icon: <Shield className="text-blue-400" /> },
                                { title: "Freshness Standards", desc: "Every signal carries a freshness ticker (Fresh, Lagged, Very Lagged) so you know exactly what you're seeing.", icon: <Activity className="text-emerald-400" /> },
                                { title: "Historical Context", desc: "25 years of standardized historical data ensures every current signal is viewed through a regime-aware lens.", icon: <Activity className="text-orange-400" /> },
                                { title: "Z-Score Framework", desc: "All complex telemetry is normalized using our Z-Score framework for institutional-grade comparisons.", icon: <FlaskConical className="text-blue-500" /> }
                            ].map((pillar, i) => (
                                <div key={i} className="p-8 rounded-3xl border border-white/5 bg-white/[0.01]">
                                    <div className="mb-4">{pillar.icon}</div>
                                    <h5 className="text-sm font-black text-white uppercase mb-2">{pillar.title}</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{pillar.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </SPASection>

                {/* 8. REGIME DIGEST TEASER (Enhanced) */}
                <SPASection id="weekly-narrative" className="py-24 bg-white/[0.01]">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                            <div>
                                <SectionHeader
                                    title="Weekly Regime Digest"
                                    subtitle="Structural summaries published every week for allocators."
                                />
                            </div>
                            <Button
                                variant="contained"
                                href="/regime-digest"
                                sx={{
                                    bgcolor: '#3b82f6', fontWeight: 900, px: 6, py: 2, borderRadius: '16px',
                                    '&:hover': { bgcolor: '#2563eb' }
                                }}
                            >
                                Read the Archive
                            </Button>
                        </div>
                        <SectionErrorBoundary name="Weekly Narrative">
                            <Suspense fallback={<LoadingFallback />}>
                                <WeeklyNarrativeSection />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </SPASection>

                {/* 8.5 GEOPOLITICAL EVENT MATRIX (GDELT) */}
                <SPASection id="geopolitical-map" className="py-24">
                    <div className="max-w-6xl mx-auto px-4">
                        <GeopoliticalEventsRow />
                    </div>
                </SPASection>

                {/* 8.6 PREDICTION MARKET TERMINAL (DOME API) */}
                <SPASection id="prediction-terminal" className="py-24 bg-blue-500/[0.01] border-y border-white/5">
                    <div className="max-w-7xl mx-auto px-4 space-y-16">
                        <SectionHeader
                            title="Prediction Market Terminal"
                            subtitle="Real-time multi-platform probability aggregation via DomeAPI"
                        />

                        <SectionErrorBoundary name="Prediction Markets">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="space-y-12">
                                    <PredictionMarketTerminal />
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <ArbitrageScanner />
                                        <PredictionMarketHeatmap />
                                    </div>
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </SPASection>

                {/* 9. THE MATURITY WALL */}
                <SPASection id="maturity-wall" className="py-24">
                    <div className="max-w-6xl mx-auto px-4">
                        <SectionHeader
                            title="Global Bond Maturity"
                            subtitle="Tracking the $9.2T structural gravitational force."
                        />
                        <SectionErrorBoundary name="Maturity Wall">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="mt-16 pt-16 border-t border-white/5">
                                    <USDebtMaturityWall />
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                        <ChartInsightSummary id="hero-insight" insight="US Debt rollover remains the primary gravitational force. The maturity wall dictates the floor for global yields." />
                    </div>
                </SPASection>

                {/* 10. MACRO HEARTBEAT (Enhanced with KPI Grid) */}
                <SPASection id="heartbeat" className="py-24">
                    <div className="max-w-6xl mx-auto px-4">
                        <SectionHeader
                            title="Macro Heartbeat"
                            subtitle="High-frequency liquidity and regime signals"
                        />

                        <div className="mt-16 space-y-24">
                            <SectionErrorBoundary name="KPI Grid">
                                <Suspense fallback={<LoadingFallback />}>
                                    <CockpitKPIGrid />
                                </Suspense>
                            </SectionErrorBoundary>

                            <SectionErrorBoundary name="Net Liquidity">
                                <div className="space-y-8">
                                    <NetLiquidityRow />
                                    <div className="p-8 rounded-3xl bg-blue-500/[0.03] border border-blue-500/10">
                                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                            <span className="text-blue-400 font-black uppercase mr-3 tracking-widest text-[0.65rem]">Regime Insight:</span>
                                            Net liquidity dictates the short-term path of risk assets. We monitor the TGA and RRP to detect shifts before they manifest in pricing.
                                        </p>
                                    </div>
                                </div>
                            </SectionErrorBoundary>

                            <SectionErrorBoundary name="Capital Flows Terminal">
                                <Suspense fallback={<LoadingFallback />}>
                                    <div className="space-y-8 pt-16 border-t border-white/5">
                                        <CapitalFlowsTerminal hideHeader />
                                        <div className="p-8 rounded-3xl bg-blue-500/[0.03] border border-blue-500/10">
                                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                                <span className="text-blue-400 font-black uppercase mr-3 tracking-widest text-[0.65rem]">Flow Context:</span>
                                                Structural shifts in offshore US dollar availability often precede Treasury auction stress and FX vol.
                                            </p>
                                        </div>
                                    </div>
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </div>
                </SPASection>

                {/* 11. US FISCAL & MACRO STRESS */}
                <SPASection id="us-fiscal" className="py-24">
                    <div className="max-w-6xl mx-auto px-4">
                        <SectionHeader
                            title="Sovereign Stress"
                            subtitle="Treasury demand dynamics and auction stress levels"
                        />
                        <div className="mt-16 space-y-12">
                            <SectionErrorBoundary name="Treasury Demand">
                                <Suspense fallback={<LoadingFallback />}>
                                    <div className="p-12 rounded-[40px] bg-white/[0.02] border border-white/5">
                                        <USTreasuryDemandGauge />
                                    </div>
                                </Suspense>
                            </SectionErrorBoundary>
                            <div className="p-12 rounded-[40px] bg-blue-500/[0.03] border border-blue-500/10 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-3xl text-white font-black uppercase tracking-tighter mb-6">The US Maturity Wall is now a structural issue.</p>
                                    <p className="text-muted-foreground leading-relaxed text-lg mb-10 max-w-4xl font-medium">
                                        As US interest expense exceeds defense spending, "Auction Stress" becomes the primary driver for yields. We monitor primary dealer absorption to detect when the market stops biting.
                                    </p>
                                    <Button
                                        variant="contained"
                                        href="/labs/us-macro-fiscal"
                                        endIcon={<ArrowRight size={16} />}
                                        sx={{
                                            bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 900, px: 4, py: 1.5, borderRadius: '12px',
                                            border: '1px solid rgba(59, 130, 246, 0.2)', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' }
                                        }}
                                    >
                                        Detailed US Fiscal Intelligence
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </SPASection>

                {/* 12. INSTITUTIONAL TEASER */}
                <SPASection id="institutional-teaser" className="py-24">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="p-16 rounded-[48px] border border-white/10 bg-slate-900/40 backdrop-blur-3xl relative overflow-hidden text-center">
                            <div className="relative z-10">
                                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase leading-none mb-6">
                                    FOR FUNDS & <span className="text-blue-500">FAMILY OFFICES</span>
                                </h2>
                                <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-bold uppercase tracking-tight opacity-70">
                                    Institutional-grade macro telemetry starting at $28/mo. Built for high-frequency regime timing and long-term transition planning.
                                </p>
                                <div className="flex flex-wrap justify-center gap-12 mb-12">
                                    <div className="flex items-center gap-3">
                                        <ShieldAlert className="text-blue-500" size={24} />
                                        <span className="text-sm font-black text-white uppercase">Sovereign Stress Matrix</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Lock className="text-blue-500" size={24} />
                                        <span className="text-sm font-black text-white uppercase">Quantum API Access</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Activity className="text-blue-500" size={24} />
                                        <span className="text-sm font-black text-white uppercase">Bespoke Research</span>
                                    </div>
                                </div>
                                <Button
                                    variant="contained"
                                    href="/institutional"
                                    size="large"
                                    sx={{
                                        bgcolor: '#3b82f6', fontWeight: 900, px: 8, py: 2.5, borderRadius: '20px', fontSize: '1.1rem',
                                        '&:hover': { bgcolor: '#2563eb' }
                                    }}
                                >
                                    Explore Institutional Plans
                                </Button>
                                <div className="mt-8 text-[0.6rem] font-black text-muted-foreground/50 uppercase tracking-[0.3em]">
                                    Starts at $28.00 / Month · Cancel Anytime
                                </div>
                            </div>
                        </div>
                    </div>
                </SPASection>

                {/* 13. RESOURCE SECURITY (Commodities) */}
                <SPASection id="commodities" className="py-24">
                    <div className="max-w-6xl mx-auto px-4">
                        <SectionHeader title="Resource Security" subtitle="Geopolitical chokepoints and physical flows" />
                        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                            <div className="space-y-8">
                                <div className="p-8 rounded-3xl bg-blue-500/[0.03] border border-blue-500/10">
                                    <p className="text-muted-foreground leading-relaxed text-lg">
                                        <span className="text-blue-400 font-black uppercase mr-3 tracking-widest text-[0.65rem]">Physical Edge:</span>
                                        Physical flow dynamics and geopolitical chokepoints now dictate commodity pricing more than paper markets. We track 14 critical nodes from the Malacca Strait to the Suez Canal.
                                    </p>
                                </div>
                                <Button
                                    variant="outlined"
                                    href="/labs/energy-commodities"
                                    sx={{
                                        borderColor: 'white/10', color: 'white', fontWeight: 900, px: 4, py: 1.5, borderRadius: '12px',
                                        '&:hover': { borderColor: 'white/30', bgcolor: 'white/5' }
                                    }}
                                >
                                    Detailed Resource Analytics
                                </Button>
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

                {/* 14. REGIONAL INTEL (India & China) */}
                <SPASection id="india-equities" className="py-24">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase leading-none mb-8">
                                    Corporate India<br />
                                    <span className="text-blue-500">Engine</span>
                                </h1>
                                <p className="text-lg text-muted-foreground leading-snug font-bold mb-10 max-w-lg">
                                    Fundamental terminal for Indian equities with a proprietary Macro Overlay. Direct MoSPI telemetry.
                                </p>
                                <Button variant="contained" href="/india-equities" sx={{ bgcolor: '#3b82f6', fontWeight: 900, px: 6, py: 2, borderRadius: '16px' }}>
                                    Access Equity Lab
                                </Button>
                            </div>
                            <SectionErrorBoundary name="India Teaser Card">
                                <Suspense fallback={<LoadingFallback />}>
                                    <div className="rounded-3xl border border-white/10 bg-black/40 overflow-hidden shadow-3xl">
                                        <CompactIndiaCard />
                                    </div>
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </div>
                </SPASection>

                <SPASection id="china-pulse" className="py-24">
                    <div className="max-w-6xl mx-auto px-4">
                        <SectionHeader title="The China Vector" subtitle="Counter-cyclical telemetry for the world's second economy" />
                        <SectionErrorBoundary name="China Market Pulse">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="mt-16 p-8 rounded-[32px] bg-white/[0.01] border border-white/5">
                                    <CompactChinaCard />
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </SPASection>

                {/* 15. HARD MONEY & DE-DOLLARIZATION */}
                <SPASection id="hard-money" className="py-24">
                    <div className="max-w-6xl mx-auto px-4">
                        <SectionHeader title="Hard Money" subtitle="Gold anchor ratios and the de-dollarization vector" />
                        <SectionErrorBoundary name="Gold Ratio">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="mt-16 p-12 rounded-[40px] bg-amber-500/[0.03] border border-amber-500/10">
                                    <GoldRatioRibbon />
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </SPASection>

                {/* 16. SOVEREIGN RISK MATRIX */}
                <SPASection id="sovereign-stress" className="py-32">
                    <div className="max-w-6xl mx-auto px-4">
                        <SectionHeader title="Sovereign Fragility" subtitle="Debt sustainability and global risk matrix" />
                        <SectionErrorBoundary name="Risk Matrix">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="mt-16">
                                    <SovereignRiskMatrix />
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </SPASection>

            </main>
        </Container>
    );
};

export default Dashboard;

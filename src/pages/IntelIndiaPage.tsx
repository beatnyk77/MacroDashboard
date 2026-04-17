import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { InstitutionalFooter } from '@/components/InstitutionalFooter';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Shield, Zap, ArrowRight, BarChart2, BarChart3, MapPin, Landmark } from 'lucide-react';

// Lazy-load heavy sub-sections
const IndiaMacroPulseSection = lazy(() =>
    import('@/features/dashboard/components/sections/IndiaMacroPulseSection').then(m => ({ default: m.IndiaMacroPulseSection }))
);

const IndiaInflationPulseMonitor = lazy(() =>
    import('@/features/dashboard/components/rows/IndiaInflationPulseMonitor').then(m => ({ default: m.IndiaInflationPulseMonitor }))
);
const IndiaFiscalStressMonitor = lazy(() =>
    import('@/features/dashboard/components/rows/IndiaFiscalStressMonitor').then(m => ({ default: m.IndiaFiscalStressMonitor }))
);
const IndiaLiquidityStressMonitor = lazy(() =>
    import('@/features/dashboard/components/rows/IndiaLiquidityStressMonitor').then(m => ({ default: m.IndiaLiquidityStressMonitor }))
);
const IndiaCreditCycleClock = lazy(() =>
    import('@/features/dashboard/components/rows/IndiaCreditCycleClock').then(m => ({ default: m.IndiaCreditCycleClock }))
);
const IndiaDebtMaturityWall = lazy(() =>
    import('@/features/dashboard/components/rows/IndiaDebtMaturityWall').then(m => ({ default: m.IndiaDebtMaturityWall }))
);
// Migrated from IndiaLab

const RBIFXDefenseMonitor = lazy(() =>
    import('@/features/dashboard/components/rows/RBIFXDefenseMonitor').then(m => ({ default: m.RBIFXDefenseMonitor }))
);
const RBIMoneyMarketMonitor = lazy(() =>
    import('@/features/dashboard/components/sections/RBIMoneyMarketMonitor').then(m => ({ default: m.RBIMoneyMarketMonitor }))
);
const IndiaDigitizationPremiumMonitor = lazy(() =>
    import('@/features/dashboard/components/rows/IndiaDigitizationPremiumMonitor').then(m => ({ default: m.IndiaDigitizationPremiumMonitor }))
);
const IndiaFiscalAllocationTracker = lazy(() =>
    import('@/features/dashboard/components/rows/IndiaFiscalAllocationTracker').then(m => ({ default: m.IndiaFiscalAllocationTracker }))
);
const StateFiscalHeatmap = lazy(() =>
    import('@/features/dashboard/components/rows/StateFiscalHeatmap').then(m => ({ default: m.StateFiscalHeatmap }))
);

const IndiaMacroDashboard = lazy(() =>
    import('@/features/dashboard/components/sections/IndiaMacroDashboard').then(m => ({ default: m.IndiaMacroDashboard }))
);

const SectionSkeleton = () => (
    <div className="h-[300px] w-full rounded-3xl bg-white/[0.02] animate-pulse" />
);

const SIGNAL_CARDS = [
    { icon: Activity,   label: 'Macro Pulse',    desc: 'IIP, WPI, gold accumulation & BOP stress',         color: 'blue',    anchor: '#macro' },
    { icon: BarChart2,  label: 'Credit Cycle',   desc: 'RBI credit impulse & banking stress clock',         color: 'amber',   anchor: '#credit' },
    { icon: TrendingUp, label: 'Fiscal Health',  desc: 'Interest payments / revenue receipts ratio',        color: 'emerald', anchor: '#fiscal' },
    { icon: Zap,        label: 'Liquidity',      desc: 'Rupee liquidity surplus/deficit & SOFR spread',     color: 'rose',    anchor: '#liquidity' },
    { icon: Shield,     label: 'Debt Wall',      desc: 'G-Sec rollover risk by coupon bucket',              color: 'purple',  anchor: '#debt' },
    { icon: BarChart3,  label: 'RBI FX Defense', desc: 'Forex reserves & RBI intervention posture',         color: 'blue',    anchor: '#monetary' },
    { icon: MapPin,     label: 'State Fiscal',   desc: 'Capex vs revenue expenditure by state',             color: 'emerald', anchor: '#state-fiscal' },
    { icon: Landmark,   label: 'Money Market',   desc: 'Daily RBI money market terminal',                   color: 'amber',   anchor: '#monetary' },
];

const colorMap: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
};

export const IntelIndiaPage: React.FC = () => {
    const placeSchema = {
        "@context": "https://schema.org",
        "@type": "Place",
        "name": "India",
        "description": "Institutional macro intelligence for India — covering RBI monetary policy, fiscal stress, sovereign debt rollover risk, credit cycle, and de-dollarization strategy.",
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 20.5937,
            "longitude": 78.9629
        }
    };

    const collectionSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "India Macro Intelligence Hub",
        "description": "Institutional-grade telemetry for India's macro economy: credit cycle, fiscal stress, sovereign debt maturity, RBI liquidity, inflation pulse, and market flows.",
        "url": "https://graphiquestor.com/intel/india",
        "about": {
            "@type": "Place",
            "name": "India"
        },
        "hasPart": [
            { "@type": "WebPage", "name": "India Macro Pulse", "url": "https://graphiquestor.com/#india-pulse" },
            { "@type": "WebPage", "name": "India Inflation Pulse Monitor", "url": "https://graphiquestor.com/intel/india#inflation" },
            { "@type": "WebPage", "name": "India Fiscal Stress Monitor", "url": "https://graphiquestor.com/intel/india#fiscal" },
            { "@type": "WebPage", "name": "India Liquidity Stress Monitor", "url": "https://graphiquestor.com/intel/india#liquidity" },
            { "@type": "WebPage", "name": "India Credit Cycle Clock", "url": "https://graphiquestor.com/intel/india#credit" },
            { "@type": "WebPage", "name": "India Debt Maturity Wall", "url": "https://graphiquestor.com/intel/india#debt" },
        ]
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://graphiquestor.com/" },
            { "@type": "ListItem", "position": 2, "name": "Intelligence", "item": "https://graphiquestor.com/intel/india" },
            { "@type": "ListItem", "position": 3, "name": "India", "item": "https://graphiquestor.com/intel/india" }
        ]
    };

    const datasetSchema = {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": "India Macroeconomic & Sovereign Debt Telemetry",
        "description": "High-frequency macro dataset for India, tracking the RBI credit cycle, fiscal stress ratios, sovereign debt maturity walls, and liquidity surplus/deficit. Includes MoSPI and RBI DBIE data integration.",
        "url": "https://graphiquestor.com/intel/india",
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "creator": {
            "@type": "Organization",
            "name": "GraphiQuestor Intelligence"
        },
        "keywords": ["India", "RBI", "Sovereign Debt", "Fiscal Stress", "MoSPI"]
    };

    return (
        <div className="min-h-screen bg-[#050810]">
            {/* Place Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />

            <SEOManager
                title="India Macro Intelligence Hub — RBI, Fiscal Stress & Credit Cycle"
                description="Institutional-grade macro telemetry for India: credit cycle clock, fiscal stress (interest payments/revenue), sovereign debt maturity wall, RBI liquidity surplus/deficit, and WPI/CPI inflation pulse."
                keywords={[
                    'India Macro Intelligence', 'RBI Monetary Policy', 'India Fiscal Stress',
                    'India Credit Cycle', 'India Sovereign Debt', 'India Inflation Monitor',
                    'India Liquidity', 'India G-Sec', 'MoSPI', 'India Institutional Macro'
                ]}
            />

            {/* Hero */}
            <section className="relative overflow-hidden pt-24 pb-16 border-b border-white/5">
                {/* Ambient glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-orange-500/5 rounded-full blur-[100px]" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-8">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-xs font-black uppercase tracking-uppercase text-muted-foreground/40 mb-12">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-blue-400">India Intelligence</span>
                    </nav>

                    {/* Flag + Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="flex items-start gap-6 mb-10"
                    >
                        <span className="text-6xl md:text-8xl select-none">🇮🇳</span>
                        <div className="flex-1">
                            <h1 className="text-4xl md:text-7xl font-black tracking-heading text-white leading-[0.9] mb-4">
                                India <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-orange-400">
                                    Intelligence
                                </span>
                            </h1>
                            <p className="max-w-xl text-muted-foreground text-sm md:text-base leading-relaxed font-medium">
                                Institutional-grade telemetry for the world's fastest-growing major economy.
                                Monitoring the RBI credit cycle, fiscal stress, and sovereign debt maturity walls in real-time.
                            </p>
                        </div>
                    </motion.div>


                    {/* Fast Signal Bar */}
                    <div className="flex flex-wrap gap-3 mt-6">
                        {[
                            { href: '#macro',        label: 'Macro Pulse',    active: true },

                            { href: '#fiscal',       label: 'Fiscal Stress' },
                            { href: '#credit',       label: 'Credit Cycle' },
                            { href: '#monetary',     label: 'RBI & FX' },
                            { href: '#state-fiscal', label: 'State Fiscal' },
                            { href: '#digital',      label: 'Digital Premium' },
                            { href: '#debt',         label: 'Debt Wall' },
                        ].map(({ href, label, active }) => (
                            <a
                                key={href}
                                href={href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-uppercase transition-colors ${
                                    active
                                        ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                                        : 'bg-white/5 border border-white/12 text-white/60 hover:bg-white/10'
                                }`}
                            >
                                {label} <ArrowRight size={10} />
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-8 relative z-20">
                {/* Signal Preview Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
                >
                    {SIGNAL_CARDS.map(({ icon: Icon, label, desc, color, anchor }) => (
                        <a key={label} href={anchor} className={`p-4 rounded-2xl border ${colorMap[color]} group cursor-pointer hover:scale-[1.02] transition-all duration-200`}>
                            <Icon size={18} className="mb-3 opacity-80" />
                            <p className="text-xs font-black uppercase tracking-uppercase mb-1">{label}</p>
                            <p className="text-xs text-muted-foreground/60 leading-relaxed">{desc}</p>
                        </a>
                    ))}
                </motion.div>
            </div>

            {/* Content Sections */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-20 space-y-32">
                {/* Monthly Snapshot Dashboard */}
                <section id="snapshot">
                    <SectionErrorBoundary name="India Macro Dashboard">
                        <Suspense fallback={<SectionSkeleton />}>
                            <IndiaMacroDashboard />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* India Macro Pulse */}
                <section id="macro">
                    <SectionErrorBoundary name="India Macro Pulse">
                        <Suspense fallback={<SectionSkeleton />}>
                            <IndiaMacroPulseSection />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />



                {/* India Inflation */}
                <section id="inflation">
                    <SectionErrorBoundary name="India Inflation Pulse">
                        <Suspense fallback={<SectionSkeleton />}>
                            <IndiaInflationPulseMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* Fiscal Stress */}
                <section id="fiscal">
                    <SectionErrorBoundary name="India Fiscal Stress Monitor">
                        <Suspense fallback={<SectionSkeleton />}>
                            <IndiaFiscalStressMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* Liquidity */}
                <section id="liquidity">
                    <SectionErrorBoundary name="India Liquidity Stress Monitor">
                        <Suspense fallback={<SectionSkeleton />}>
                            <IndiaLiquidityStressMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* Credit Cycle */}
                <section id="credit">
                    <SectionErrorBoundary name="India Credit Cycle Clock">
                        <Suspense fallback={<SectionSkeleton />}>
                            <IndiaCreditCycleClock />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* Debt Maturity Wall */}
                <section id="debt">
                    <SectionErrorBoundary name="India Debt Maturity Wall">
                        <Suspense fallback={<SectionSkeleton />}>
                            <IndiaDebtMaturityWall />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* RBI Monetary & FX Defense (from Lab) */}
                <section id="monetary">
                    <div className="space-y-16">
                        <div>
                            <div className="flex items-center gap-3 mb-10">
                                <BarChart3 className="text-emerald-500" size={24} />
                                <h2 className="text-xl font-black uppercase tracking-heading text-white">RBI FX Defense Monitor</h2>
                            </div>
                            <SectionErrorBoundary name="RBI FX Defense">
                                <Suspense fallback={<SectionSkeleton />}>
                                    <RBIFXDefenseMonitor />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <div className="pt-12 border-t border-white/5">
                            <div className="flex items-center gap-3 mb-10">
                                <Landmark className="text-blue-500" size={24} />
                                <h2 className="text-xl font-black uppercase tracking-heading text-white">Daily Money Market Terminal</h2>
                            </div>
                            <SectionErrorBoundary name="India Money Market">
                                <Suspense fallback={<SectionSkeleton />}>
                                    <RBIMoneyMarketMonitor />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </div>
                </section>

                <div className="border-t border-white/5" />

                {/* State-Level Fiscal (from Lab) */}
                <section id="state-fiscal">
                    <div className="flex items-center gap-3 mb-10">
                        <MapPin className="text-blue-500" size={24} />
                        <h2 className="text-xl font-black uppercase tracking-heading text-white">State-Level Fiscal Intelligence</h2>
                    </div>
                    <SectionErrorBoundary name="State Fiscal">
                        <Suspense fallback={<SectionSkeleton />}>
                            <div className="space-y-16">
                                <IndiaFiscalAllocationTracker />
                                <StateFiscalHeatmap />
                            </div>
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* Digitization Premium (from Lab) */}
                <section id="digital">
                    <div className="flex items-center gap-3 mb-10">
                        <Zap className="text-blue-400" size={24} />
                        <h2 className="text-xl font-black uppercase tracking-heading text-white">India Stack — Digitization Premium</h2>
                    </div>
                    <SectionErrorBoundary name="India Digitization Premium">
                        <Suspense fallback={<SectionSkeleton />}>
                            <IndiaDigitizationPremiumMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* Structural Analysis Article (from Lab) */}
                <article className="p-12 bg-white/[0.02] border border-white/5 rounded-[2.5rem]" aria-label="Structural Analysis of India Macro Resilience">
                    <h3 className="text-xl font-black text-white uppercase tracking-uppercase mb-6">Structural Analysis: India's Macro Resilience &amp; Fiscal Quality</h3>
                    <div className="space-y-6 text-sm text-muted-foreground/60 leading-relaxed font-medium">
                        <p>
                            The <strong>India Intelligence Hub</strong> monitors highly granular, state-level macroeconomic indicators to evaluate the fundamental structural transition of the Indian economy. Unlike traditional emerging market (EM) trackers that rely on lagging, aggregated national data, GraphiQuestor connects directly to the <a href="/glossary/mospi" className="text-blue-400 hover:underline transition-colors">Ministry of Statistics and Programme Implementation (MoSPI)</a>. This zero-lag integration enables real-time observation of the Index of Industrial Production (IIP), Consumer Price Index (CPI), and capital expenditure velocities across all 28 states.
                        </p>
                        <p>
                            A critical differentiator in India's sovereign health is the quality of its fiscal expenditure. The <em>State Fiscal Heatmap</em> tracks the ratio of productive capital expenditure (Capex) against recurring revenue expenditure (subsidies and freebies). States demonstrating high Capex velocity generally command a lower structural risk premium and drive the nation's broader industrial upgrading capacity.
                        </p>
                        <p>
                            Furthermore, the hub actively monitors the Reserve Bank of India's (RBI) FX defense posture. By combining Balance of Payments (BOP) pressure gauges with <a href="/glossary/stealth-qe" className="text-blue-400 hover:underline transition-colors">liquidity stress monitors</a>, institutional investors can pinpoint precise entry and exit windows for Indian equities and sovereign debt, insulated from short-term narrative noise.
                        </p>
                    </div>
                </article>
            </div>

            <InstitutionalFooter />
        </div>
    );
};

export default IntelIndiaPage;

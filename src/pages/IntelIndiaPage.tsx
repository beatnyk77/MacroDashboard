import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { InstitutionalFooter } from '@/components/InstitutionalFooter';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Shield, Zap, ArrowRight, BarChart2 } from 'lucide-react';

// Lazy-load heavy sub-sections
const IndiaMacroPulseSection = lazy(() =>
    import('@/features/dashboard/components/sections/IndiaMacroPulseSection').then(m => ({ default: m.IndiaMacroPulseSection }))
);
const IndiaMarketPulseRow = lazy(() =>
    import('@/features/dashboard/components/rows/IndiaMarketPulseRow').then(m => ({ default: m.IndiaMarketPulseRow }))
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

const SectionSkeleton = () => (
    <div className="h-[300px] w-full rounded-3xl bg-white/[0.02] animate-pulse" />
);

const SIGNAL_CARDS = [
    { icon: Activity, label: 'Macro Pulse', desc: 'IIP, WPI, gold accumulation & BOP stress', color: 'blue' },
    { icon: BarChart2, label: 'Credit Cycle', desc: 'RBI credit impulse & banking stress clock', color: 'amber' },
    { icon: TrendingUp, label: 'Fiscal Health', desc: 'Interest payments / revenue receipts ratio', color: 'emerald' },
    { icon: Zap, label: 'Liquidity Stress', desc: 'Rupee liquidity surplus/deficit & SOFR spread', color: 'rose' },
    { icon: Shield, label: 'Debt Maturity Wall', desc: 'G-Sec rollover risk by coupon bucket', color: 'purple' },
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

    return (
        <div className="min-h-screen bg-[#050810]">
            {/* Place Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

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
                    <nav className="flex items-center gap-2 text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground/40 mb-12">
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
                        <div>
                            <p className="text-[0.65rem] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">GraphiQuestor Intelligence Series</p>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-none">
                                India<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">
                                    Macro Hub
                                </span>
                            </h1>
                            <p className="mt-4 text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
                                Institutional-grade telemetry tracking India's credit cycle, fiscal stress, sovereign debt rollover risk, RBI liquidity dynamics, and de-dollarization strategy — sourced from MoSPI, RBI DBIE, and FRED.
                            </p>
                            <div className="flex flex-wrap gap-3 mt-6">
                                <a href="#macro" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[0.65rem] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-colors">
                                    Macro Pulse <ArrowRight size={12} />
                                </a>
                                <a href="#fiscal" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[0.65rem] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                                    Fiscal Stress <ArrowRight size={12} />
                                </a>
                                <a href="#credit" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[0.65rem] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                                    Credit Cycle <ArrowRight size={12} />
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    {/* Signal Preview Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
                    >
                        {SIGNAL_CARDS.map(({ icon: Icon, label, desc, color }) => (
                            <div key={label} className={`p-4 rounded-2xl border ${colorMap[color]} group cursor-default`}>
                                <Icon size={18} className="mb-3 opacity-80" />
                                <p className="text-[0.65rem] font-black uppercase tracking-widest mb-1">{label}</p>
                                <p className="text-[0.6rem] text-muted-foreground/60 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Content Sections */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-20 space-y-32">

                {/* India Macro Pulse */}
                <section id="macro">
                    <SectionErrorBoundary name="India Macro Pulse">
                        <Suspense fallback={<SectionSkeleton />}>
                            <IndiaMacroPulseSection />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* India Market Pulse */}
                <section id="market">
                    <SectionErrorBoundary name="India Market Pulse">
                        <Suspense fallback={<SectionSkeleton />}>
                            <IndiaMarketPulseRow />
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

            </div>

            <InstitutionalFooter />
        </div>
    );
};

export default IntelIndiaPage;

import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { InstitutionalFooter } from '@/components/InstitutionalFooter';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { motion } from 'framer-motion';
import { Globe, TrendingDown, ArrowRight, Package2, Leaf, Cpu } from 'lucide-react';

// Lazy-load all sections
const ChinaMacroPulseSection = lazy(() =>
    import('@/features/dashboard/components/sections/ChinaMacroPulseSection').then(m => ({ default: m.ChinaMacroPulseSection }))
);
const ChinaPBOCLiquidityMonitor = lazy(() =>
    import('@/features/dashboard/components/sections/ChinaPBOCLiquidityMonitor').then(m => ({ default: m.ChinaPBOCLiquidityMonitor }))
);
const ChinaRealEconomyPanel = lazy(() =>
    import('@/features/dashboard/components/sections/ChinaRealEconomyPanel').then(m => ({ default: m.ChinaRealEconomyPanel }))
);
const ChinaExternalSectorPanel = lazy(() =>
    import('@/features/dashboard/components/sections/ChinaExternalSectorPanel').then(m => ({ default: m.ChinaExternalSectorPanel }))
);
const ChinaEnergyGridPanel = lazy(() =>
    import('@/features/dashboard/components/sections/ChinaEnergyGridPanel').then(m => ({ default: m.ChinaEnergyGridPanel }))
);
const ChinaProprietarySignals = lazy(() =>
    import('@/features/dashboard/components/sections/ChinaProprietarySignals').then(m => ({ default: m.ChinaProprietarySignals }))
);
const InstitutionalInfluenceSection = lazy(() => 
    import('@/features/dashboard/components/sections/InstitutionalInfluenceSection').then(m => ({ default: m.InstitutionalInfluenceSection }))
);
const China15thFYPTeaserRow = lazy(() =>
    import('@/features/dashboard/components/rows/China15thFYP/China15thFYPTeaserRow').then(m => ({ default: m.China15thFYPTeaserRow }))
);

const SectionSkeleton = () => (
    <div className="h-[300px] w-full rounded-3xl bg-white/[0.02] animate-pulse" />
);

const SIGNAL_CARDS = [
    { icon: Globe,    label: 'PBOC Liquidity',   desc: 'MLF, reverse repo, M2 & regime',         color: 'red',    anchor: '#pboc' },
    { icon: TrendingDown, label: 'Real Economy', desc: 'NBS vs Caixin PMI, IP & retail',          color: 'orange', anchor: '#real-economy' },
    { icon: Package2, label: 'External Sector',  desc: 'Trade balance, FX reserves & exports',   color: 'blue',   anchor: '#external' },
    { icon: Leaf,     label: 'Energy & Carbon',  desc: 'Grid carbon intensity & transition risk', color: 'green',  anchor: '#energy' },
    { icon: Cpu,      label: 'Alpha Signals',    desc: 'Credit impulse, de-dollarization, distress', color: 'purple', anchor: '#signals' },
];

const colorMap: Record<string, string> = {
    red:    'text-red-500 bg-red-500/10 border-red-500/20',
    rose:   'text-rose-500 bg-rose-500/10 border-rose-500/20',
    amber:  'text-amber-500 bg-amber-500/10 border-amber-500/20',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green:  'text-green-400 bg-green-500/10 border-green-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

export const IntelChinaPage: React.FC = () => {
    const placeSchema = {
        "@context": "https://schema.org",
        "@type": "Place",
        "name": "China",
        "description": "Institutional macro intelligence for China — covering PBoC monetary policy, credit impulse, deflation risk, industrial production, and de-dollarization strategy.",
        "geo": { "@type": "GeoCoordinates", "latitude": 35.8617, "longitude": 104.1954 }
    };

    const collectionSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "China Macro Intelligence Hub",
        "description": "Institutional-grade macro telemetry for China: PBOC liquidity, PMI, trade balance, FX reserves, grid carbon intensity, credit impulse, and de-dollarization velocity.",
        "url": "https://graphiquestor.com/intel/china",
        "about": { "@type": "Place", "name": "China" },
        "hasPart": [
            { "@type": "WebPage", "name": "China Macro Pulse",         "url": "https://graphiquestor.com/intel/china#macro" },
            { "@type": "WebPage", "name": "PBOC Liquidity Monitor",   "url": "https://graphiquestor.com/intel/china#pboc" },
            { "@type": "WebPage", "name": "Real Economy Activity",    "url": "https://graphiquestor.com/intel/china#real-economy" },
            { "@type": "WebPage", "name": "External Sector & Trade",  "url": "https://graphiquestor.com/intel/china#external" },
            { "@type": "WebPage", "name": "Energy & Transition Risk", "url": "https://graphiquestor.com/intel/china#energy" },
            { "@type": "WebPage", "name": "Proprietary Alpha Signals","url": "https://graphiquestor.com/intel/china#signals" },
        ]
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home",         "item": "https://graphiquestor.com/" },
            { "@type": "ListItem", "position": 2, "name": "Intelligence", "item": "https://graphiquestor.com/intel/china" },
            { "@type": "ListItem", "position": 3, "name": "China",        "item": "https://graphiquestor.com/intel/china" }
        ]
    };

    const datasetSchema = {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": "China Macro-Activity, PBOC & Energy Telemetry",
        "description": "High-frequency activity monitor for China tracking credit impulse, deflation risk, industrial production velocity, PBoC monetary policy, gold and FX reserves, trade balance, and grid carbon intensity.",
        "url": "https://graphiquestor.com/intel/china",
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "creator": { "@type": "Organization", "name": "GraphiQuestor Intelligence" },
        "keywords": ["China", "PBoC", "Credit Impulse", "Deflation", "De-Dollarization", "China Energy Transition", "China PMI", "China Trade Balance"]
    };

    return (
        <div className="min-h-screen bg-[#050810]">
            {/* Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />

            <SEOManager
                title="China Macro Intelligence Hub — PBOC, PMI, Credit Impulse & Energy Transition"
                description="Institutional-grade macro telemetry for China: PBOC liquidity operations, NBS vs Caixin PMI, trade balance, FX reserves, grid carbon intensity, China credit impulse, de-dollarization velocity, and corporate distress score."
                keywords={[
                    'China Macro Intelligence', 'PBoC Monetary Policy', 'China Credit Impulse',
                    'China Deflation Risk', 'China Industrial Production', 'China FX Reserves',
                    'China Gold Reserves', 'China De-Dollarization', 'China PMI', 'China Trade Balance',
                    'China Carbon Intensity', 'China Energy Transition', 'China Institutional Macro'
                ]}
            />

            {/* Hero */}
            <section className="relative overflow-hidden pt-24 pb-16 border-b border-white/5">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-red-600/8 rounded-full blur-[140px]" />
                    <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-amber-500/5 rounded-full blur-[100px]" />
                    <div className="absolute top-1/2 left-0 w-[300px] h-[200px] bg-blue-500/5 rounded-full blur-[80px]" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-8">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-xs font-black uppercase tracking-uppercase text-muted-foreground/40 mb-12">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-red-400">China Intelligence</span>
                    </nav>

                    {/* Flag + Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="flex items-start gap-6 mb-10"
                    >
                        <span className="text-6xl md:text-8xl select-none">🇨🇳</span>
                        <div className="flex-1">
                            <p className="text-xs font-black text-red-400 uppercase tracking-uppercase mb-2">GraphiQuestor Intelligence Series</p>
                            <h1 className="text-4xl md:text-6xl font-black tracking-heading text-white leading-none mb-4">
                                China<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-300 to-amber-400">
                                    Macro Hub
                                </span>
                            </h1>
                            <p className="mt-2 text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
                                Institutional-grade macro intelligence for the world's second-largest economy.
                                Daily coverage of PBOC liquidity operations, PMI divergence, trade flows, energy transition,
                                and proprietary signals — designed for symmetric East vs West macro analysis.
                            </p>

                            {/* Nav Pills */}
                            <div className="flex flex-wrap gap-2 mt-6">
                                {[
                                    { href: '#macro',       label: 'Macro Pulse',     active: true },
                                    { href: '#pboc',        label: 'PBOC Liquidity' },
                                    { href: '#real-economy',label: 'Real Economy' },
                                    { href: '#external',    label: 'External Sector' },
                                    { href: '#energy',      label: 'Energy & Carbon' },
                                    { href: '#signals',     label: 'Alpha Signals' },
                                ].map(({ href, label, active }) => (
                                    <a
                                        key={href}
                                        href={href}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-uppercase transition-colors ${
                                            active
                                                ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                                                : 'bg-white/5 border border-white/12 text-white/60 hover:bg-white/10'
                                        }`}
                                    >
                                        {label} <ArrowRight size={10} />
                                    </a>
                                ))}
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
                        {SIGNAL_CARDS.map(({ icon: Icon, label, desc, color, anchor }) => (
                            <a
                                key={label}
                                href={anchor}
                                className={`p-4 rounded-2xl border ${colorMap[color]} group cursor-pointer hover:scale-[1.02] transition-all duration-200`}
                            >
                                <Icon size={18} className="mb-3 opacity-80" />
                                <p className="text-xs font-black uppercase tracking-uppercase mb-1">{label}</p>
                                <p className="text-xs text-muted-foreground/60 leading-relaxed">{desc}</p>
                            </a>
                        ))}
                    </motion.div>
                    {/* FYP Teaser Row */}
                    <div className="mt-12">
                        <SectionErrorBoundary name="China 15th FYP Teaser">
                            <Suspense fallback={<div className="h-24 rounded-2xl bg-white/[0.02] animate-pulse" />}>
                                <China15thFYPTeaserRow />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </div>
            </section>

            {/* Content Sections */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-20 space-y-32">

                {/* China Macro Pulse (existing) */}
                <section id="macro">
                    <SectionErrorBoundary name="China Macro Pulse">
                        <Suspense fallback={<SectionSkeleton />}>
                            <ChinaMacroPulseSection />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* PBOC Liquidity Monitor */}
                <section id="pboc">
                    <SectionErrorBoundary name="PBOC Liquidity Monitor">
                        <Suspense fallback={<SectionSkeleton />}>
                            <ChinaPBOCLiquidityMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* Real Economy */}
                <section id="real-economy">
                    <SectionErrorBoundary name="China Real Economy Panel">
                        <Suspense fallback={<SectionSkeleton />}>
                            <ChinaRealEconomyPanel />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* External Sector */}
                <section id="external">
                    <SectionErrorBoundary name="China External Sector Panel">
                        <Suspense fallback={<SectionSkeleton />}>
                            <ChinaExternalSectorPanel />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* Energy & Transition */}
                <section id="energy">
                    <SectionErrorBoundary name="China Energy Grid Panel">
                        <Suspense fallback={<SectionSkeleton />}>
                            <ChinaEnergyGridPanel />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* Proprietary Alpha Signals */}
                <section id="signals">
                    <SectionErrorBoundary name="China Proprietary Signals">
                        <Suspense fallback={<SectionSkeleton />}>
                            <ChinaProprietarySignals />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* Credit Impulse context (existing) */}
                <section id="credit">
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-[2px] w-8 bg-amber-500" />
                            <h2 className="text-xs font-black text-white/90 uppercase tracking-uppercase">Credit Impulse Deep Dive</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                                <p className="text-xs font-black text-amber-400 uppercase tracking-uppercase">What is China's Credit Impulse?</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    China's credit impulse measures the change in new credit issued as a percentage of GDP. It is one of the most powerful leading indicators for global economic activity, with a 9-12 month lead on commodity demand and EM asset prices.
                                </p>
                                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                                    A rising impulse signals accelerating credit growth, typically bullish for oil, copper, and EM equities. A falling impulse warns of demand contraction ahead.
                                </p>
                                <Link to="/glossary/de-dollarization" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-uppercase text-amber-400 hover:text-amber-300 transition-colors mt-2">
                                    Read: De-Dollarization →
                                </Link>
                            </div>
                            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                                <p className="text-xs font-black text-red-400 uppercase tracking-uppercase">Deflation Risk Monitor</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    China has been experiencing persistent PPI deflation since mid-2022, driven by a domestic demand shortfall and over-supply in industrial capacity. When PPI is deeply negative, it exports disinflationary pressure globally through cheaper manufactured goods.
                                </p>
                                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                                    CPI below zero would signal a deflationary trap, raising systemic risk for China's debt-laden property sector.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="border-t border-white/5" />

                {/* De-Dollarization Context */}
                <section id="dedollarization">
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-[2px] w-8 bg-red-500" />
                            <h2 className="text-xs font-black text-white/90 uppercase tracking-uppercase">China De-Dollarization Strategy</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { title: 'Gold Accumulation', body: 'PBoC has been a systematic buyer of gold since 2022, building reserves to reduce USD dependency. This directly reduces the share of USD in China\'s reserve portfolio.', color: 'yellow' },
                                { title: 'Bilateral CNY Trade', body: 'China has accelerated local-currency trade deals with Russia, Saudi Arabia, and ASEAN nations — denominating commodity purchases in CNY rather than USD.', color: 'red' },
                                { title: 'CIPS Infrastructure', body: 'China\'s Cross-Border Interbank Payment System (CIPS) now processes $400B+ yearly, providing a parallel settlement rail to SWIFT for CNY transactions.', color: 'orange' },
                            ].map(({ title, body, color }) => (
                                <div key={title} className={`p-5 rounded-2xl border ${colorMap[color]} space-y-3`}>
                                    <p className="text-xs font-black uppercase tracking-uppercase">{title}</p>
                                    <p className="text-xs text-muted-foreground/70 leading-relaxed">{body}</p>
                                </div>
                            ))}
                        </div>

                        {/* Added from Labs: Institutional Influence Section */}
                        <div className="mt-16">
                            <div className="flex items-center gap-3 mb-10">
                                <h2 className="text-xl font-black uppercase tracking-heading text-white">Spheres of Institutional Influence</h2>
                            </div>
                            <SectionErrorBoundary name="Institutional Influence">
                                <Suspense fallback={<SectionSkeleton />}>
                                    <InstitutionalInfluenceSection />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </div>
                </section>

                <div className="border-t border-white/5" />

                {/* Added from Labs: Structural Analysis Article */}
                <article className="p-12 bg-white/[0.02] border border-white/5 rounded-[2.5rem]" aria-label="Structural Analysis of China's Systemic Pivot">
                    <h3 className="text-xl font-black text-white uppercase tracking-uppercase mb-6">Structural Analysis: China's Economic Pivot & Global Influence</h3>
                    <div className="space-y-6 text-sm text-muted-foreground/60 leading-relaxed font-medium">
                        <p>
                            The <strong>China Macro Hub</strong> tracks the deliberate structural deceleration of China's property sector alongside the corresponding acceleration in high-quality manufacturing, green technology, and sovereign influence architecture. Analyzing the People's Bank of China (PBoC) monetary plumbing and credit impulse cycles provides leading indicators for global commodity demand and emerging market liquidity.
                        </p>
                        <p>
                            A key focus of this hub is the tracking of <a href="/glossary/de-dollarization" className="text-blue-400 hover:underline transition-colors">De-Dollarization</a> vectors and the expansion of parallel settlement infrastructure like the <a href="/glossary/mbridge" className="text-blue-400 hover:underline transition-colors">mBridge</a> network. By monitoring the spheres of institutional influence, including BRICS+ trade alignments and bilateral swap lines, the timeline for multi-polar reserve optionality becomes quantifiable.
                        </p>
                        <p>
                            The shift from export-led accumulation to domestic consumption and strategic industrial autonomy is modeled through our proprietary alpha signals, visualizing the long-term relative growth rate of the Chinese economy against developed market peers.
                        </p>
                    </div>
                </article>

            </div>

            <InstitutionalFooter />
        </div>
    );
};

export default IntelChinaPage;

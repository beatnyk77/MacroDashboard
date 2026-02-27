import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { InstitutionalFooter } from '@/components/InstitutionalFooter';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { motion } from 'framer-motion';
import { Globe, TrendingDown, Zap, BarChart2, Shield, ArrowRight } from 'lucide-react';

// Lazy-load heavy sub-sections
const ChinaMacroPulseSection = lazy(() =>
    import('@/features/dashboard/components/sections/ChinaMacroPulseSection').then(m => ({ default: m.ChinaMacroPulseSection }))
);

const SectionSkeleton = () => (
    <div className="h-[300px] w-full rounded-3xl bg-white/[0.02] animate-pulse" />
);

const SIGNAL_CARDS = [
    { icon: Globe, label: 'Macro Pulse', desc: 'GDP growth, credit impulse & PBoC policy', color: 'red' },
    { icon: TrendingDown, label: 'Deflation Risk', desc: 'CPI & PPI deflation pressure monitor', color: 'rose' },
    { icon: BarChart2, label: 'Credit Impulse', desc: 'New credit as % of GDP — leading indicator', color: 'amber' },
    { icon: Zap, label: 'Industrial Velocity', desc: 'Industrial production & retail sales YoY', color: 'orange' },
    { icon: Shield, label: 'FX & Gold Reserves', desc: 'PBoC USD reserves & gold accumulation', color: 'yellow' },
];

const colorMap: Record<string, string> = {
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
};

export const IntelChinaPage: React.FC = () => {
    const placeSchema = {
        "@context": "https://schema.org",
        "@type": "Place",
        "name": "China",
        "description": "Institutional macro intelligence for China — covering PBoC monetary policy, credit impulse, deflation risk, industrial production, and de-dollarization strategy.",
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 35.8617,
            "longitude": 104.1954
        }
    };

    const collectionSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "China Macro Intelligence Hub",
        "description": "Institutional-grade macro telemetry for China: credit impulse, deflation risk, industrial velocity, PBoC policy rates, FX reserves, and de-dollarization trends.",
        "url": "https://graphiquestor.com/intel/china",
        "about": {
            "@type": "Place",
            "name": "China"
        },
        "hasPart": [
            { "@type": "WebPage", "name": "China Macro Pulse", "url": "https://graphiquestor.com/intel/china#macro" },
            { "@type": "WebPage", "name": "China Credit Impulse", "url": "https://graphiquestor.com/intel/china#credit" },
            { "@type": "WebPage", "name": "China De-Dollarization", "url": "https://graphiquestor.com/intel/china#dedollarization" },
        ]
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://graphiquestor.com/" },
            { "@type": "ListItem", "position": 2, "name": "Intelligence", "item": "https://graphiquestor.com/intel/china" },
            { "@type": "ListItem", "position": 3, "name": "China", "item": "https://graphiquestor.com/intel/china" }
        ]
    };

    const datasetSchema = {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": "China Macro-Activity & De-Dollarization Telemetry",
        "description": "High-frequency activity monitor for China tracking credit impulse, deflation risk, industrial production velocity, PBoC monetary policy, and gold reserves accumulation.",
        "url": "https://graphiquestor.com/intel/china",
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "creator": {
            "@type": "Organization",
            "name": "GraphiQuestor Intelligence"
        },
        "keywords": ["China", "PBoC", "Credit Impulse", "Deflation", "De-Dollarization"]
    };

    return (
        <div className="min-h-screen bg-[#050810]">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />

            <SEOManager
                title="China Macro Intelligence Hub — PBoC, Credit Impulse & Deflation Risk"
                description="Institutional-grade macro telemetry for China: credit impulse (new credit/GDP), PBoC monetary policy, CPI/PPI deflation risk, industrial production velocity, FX reserves, and gold accumulation trends."
                keywords={[
                    'China Macro Intelligence', 'PBoC Monetary Policy', 'China Credit Impulse',
                    'China Deflation Risk', 'China Industrial Production', 'China FX Reserves',
                    'China Gold Reserves', 'China De-Dollarization', 'China GDP Growth',
                    'China Institutional Macro'
                ]}
            />

            {/* Hero */}
            <section className="relative overflow-hidden pt-24 pb-16 border-b border-white/5">
                {/* Ambient glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-600/8 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-amber-500/5 rounded-full blur-[100px]" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-8">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground/40 mb-12">
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
                        <div>
                            <p className="text-[0.65rem] font-black text-red-400 uppercase tracking-[0.3em] mb-2">GraphiQuestor Intelligence Series</p>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-none">
                                China<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">
                                    Macro Hub
                                </span>
                            </h1>
                            <p className="mt-4 text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
                                High-frequency activity monitor tracking China's credit impulse, deflation risk, industrial velocity, PBoC monetary stance, FX reserves, and de-dollarization momentum — sourced from NBS, PBoC, and IMF DOTS.
                            </p>
                            <div className="flex flex-wrap gap-3 mt-6">
                                <a href="#macro" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[0.65rem] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors">
                                    Macro Pulse <ArrowRight size={12} />
                                </a>
                                <a href="#credit" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[0.65rem] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                                    Credit Impulse <ArrowRight size={12} />
                                </a>
                                <a href="#dedollarization" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[0.65rem] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                                    De-Dollarization <ArrowRight size={12} />
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

                {/* China Macro Pulse */}
                <section id="macro">
                    <SectionErrorBoundary name="China Macro Pulse">
                        <Suspense fallback={<SectionSkeleton />}>
                            <ChinaMacroPulseSection />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                <div className="border-t border-white/5" />

                {/* Credit Impulse Explainer */}
                <section id="credit">
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-[2px] w-8 bg-amber-500" />
                            <h2 className="text-[0.7rem] font-black text-white/90 uppercase tracking-[0.3em]">Credit Impulse Deep Dive</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                                <p className="text-[0.6rem] font-black text-amber-400 uppercase tracking-widest">What is China's Credit Impulse?</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    China's credit impulse measures the change in new credit issued as a percentage of GDP. It is one of the most powerful leading indicators for global economic activity, with a 9-12 month lead on commodity demand and EM asset prices.
                                </p>
                                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                                    A rising impulse signals accelerating credit growth, typically bullish for oil, copper, and EM equities. A falling impulse warns of demand contraction ahead.
                                </p>
                                <Link to="/glossary/de-dollarization" className="inline-flex items-center gap-1.5 text-[0.6rem] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors mt-2">
                                    Read: De-Dollarization →
                                </Link>
                            </div>
                            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                                <p className="text-[0.6rem] font-black text-red-400 uppercase tracking-widest">Deflation Risk Monitor</p>
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
                            <h2 className="text-[0.7rem] font-black text-white/90 uppercase tracking-[0.3em]">China De-Dollarization Strategy</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { title: 'Gold Accumulation', body: 'PBoC has been a systematic buyer of gold since 2022, building reserves to reduce USD dependency. This directly reduces the share of USD in China\'s reserve portfolio.', color: 'yellow' },
                                { title: 'Bilateral CNY Trade', body: 'China has accelerated local-currency trade deals with Russia, Saudi Arabia, and ASEAN nations — denominating commodity purchases in CNY rather than USD.', color: 'red' },
                                { title: 'CIPS Infrastructure', body: 'China\'s Cross-Border Interbank Payment System (CIPS) now processes $400B+ yearly, providing a parallel settlement rail to SWIFT for CNY transactions.', color: 'orange' },
                            ].map(({ title, body, color }) => (
                                <div key={title} className={`p-5 rounded-2xl border ${colorMap[color]} space-y-3`}>
                                    <p className="text-[0.65rem] font-black uppercase tracking-widest">{title}</p>
                                    <p className="text-xs text-muted-foreground/70 leading-relaxed">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

            </div>

            <InstitutionalFooter />
        </div>
    );
};

export default IntelChinaPage;

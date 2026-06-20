import React from 'react';
import { TrailLink } from '@/components/TrailLink';
import { withTrailingSlash } from '@/lib/urlPath';
import { ArrowRight, ArrowRightLeft, BookOpen, FlaskConical, Globe, TrendingUp } from 'lucide-react';

type ExploreKind = 'glossary' | 'method' | 'lab' | 'intel' | 'trade';

interface ExploreCard {
    to: string;
    title: string;
    description: string;
    kind: ExploreKind;
    icon: React.ReactNode;
}

const kindStyles: Record<ExploreKind, { label: string; color: string }> = {
    glossary: { label: 'Glossary', color: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
    method: { label: 'Methodology', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
    lab: { label: 'Lab', color: 'text-purple-400 border-purple-400/30 bg-purple-400/5' },
    intel: { label: 'Intel Pulse', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
    trade: { label: 'Currency Intel', color: 'text-[#B8860B] border-[#B8860B]/30 bg-[#B8860B]/5' },
};

const exploreCards: ExploreCard[] = [
    {
        to: '/glossary/breakeven-inflation-rate',
        title: 'Breakeven Inflation',
        description: 'Market-implied inflation expectations from nominal vs TIPS yield spreads — the cleanest real-time signal for Fed credibility.',
        kind: 'glossary',
        icon: <BookOpen size={16} />,
    },
    {
        to: '/glossary/foreign-exchange-reserves',
        title: 'Foreign Exchange Reserves',
        description: 'Central bank reserve composition and drawdown trends — early warning for balance-of-payments stress and de-dollarization.',
        kind: 'glossary',
        icon: <BookOpen size={16} />,
    },
    {
        to: '/glossary/fiscal-dominance',
        title: 'Fiscal Dominance',
        description: 'When debt service constrains monetary policy independence — tracked via our proprietary Fiscal Dominance Meter.',
        kind: 'glossary',
        icon: <BookOpen size={16} />,
    },
    {
        to: '/glossary/tga',
        title: 'Treasury General Account (TGA)',
        description: 'The Fed\'s off-balance-sheet liquidity lever — TGA drawdowns mimic QE; rebuilds drain reserves mechanically.',
        kind: 'glossary',
        icon: <BookOpen size={16} />,
    },
    {
        to: '/methods/m2-gold-ratio',
        title: 'M2/Gold Ratio',
        description: 'Proprietary fiat debasement gauge comparing global M2 to above-ground gold — with live chart and historical episodes.',
        kind: 'method',
        icon: <FlaskConical size={16} />,
    },
    {
        to: '/labs/us-macro-fiscal',
        title: 'US Macro & Fiscal Lab',
        description: 'Net liquidity proxy, Fed monetization monitor, debt maturity wall, and auction demand — the US sovereign stress stack.',
        kind: 'lab',
        icon: <TrendingUp size={16} />,
    },
    {
        to: '/intel/india',
        title: 'India Macro Pulse',
        description: 'RBI credit cycle, loan-to-job efficiency, energy dependency, and trade flows — institutional India macro telemetry.',
        kind: 'intel',
        icon: <Globe size={16} />,
    },
    {
        to: '/intel/china',
        title: 'China Macro Pulse',
        description: 'PBOC liquidity, property sector stress, BRICS settlement dynamics, and petroyuan transition signals.',
        kind: 'intel',
        icon: <Globe size={16} />,
    },
    {
        to: '/trade-fx',
        title: 'TradeFx — Currency Intelligence',
        description: 'USD/INR regime telemetry, zero-cost collar payoff diagrams, and hedging archetype frameworks for Indian exporters and importers.',
        kind: 'trade',
        icon: <ArrowRightLeft size={16} />,
    },
];

export const StartExploringSection: React.FC = () => {
    return (
        <section id="start-exploring" className="mb-10 scroll-mt-24">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                        Start Exploring
                    </h2>
                    <p className="mt-1 text-sm text-white/50">
                        High-impression intelligence — glossary definitions, proprietary methodologies, thematic labs, and regional pulses.
                    </p>
                </div>
                <TrailLink
                    to="/glossary"
                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-uppercase text-emerald-400/80 no-underline transition-colors hover:text-emerald-400"
                >
                    Full Glossary
                    <ArrowRight size={12} />
                </TrailLink>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {exploreCards.map((card) => {
                    const style = kindStyles[card.kind];
                    return (
                        <TrailLink
                            key={card.to}
                            to={withTrailingSlash(card.to)}
                            className="group flex flex-col rounded-xl border border-white/[0.08] bg-slate-900/40 p-4 no-underline backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-blue-500/5"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <span className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${style.color}`}>
                                    {card.icon}
                                    {style.label}
                                </span>
                                <ArrowRight
                                    size={14}
                                    className="text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-white/60"
                                />
                            </div>
                            <h3 className="mb-1.5 text-sm font-extrabold text-white/90 transition-colors group-hover:text-white">
                                {card.title}
                            </h3>
                            <p className="flex-1 text-xs leading-relaxed text-white/40 transition-colors group-hover:text-white/55">
                                {card.description}
                            </p>
                        </TrailLink>
                    );
                })}
            </div>
        </section>
    );
};
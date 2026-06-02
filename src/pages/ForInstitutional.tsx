import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SEOManager } from '@/components/SEOManager';
import { SubscribeCard } from '@/components/SubscribeCard';

const ARC = [
    {
        n: '01',
        tag: 'Problem',
        title: 'Conventional macro data lags reality by quarters.',
        body: 'By the time a regime shift surfaces in headline indicators, the allocation decision is already late. Capital allocators are flying on instruments calibrated for the last cycle.',
    },
    {
        n: '02',
        tag: 'Edge',
        title: 'Direct pipelines to official infrastructure — plus signals nobody else computes.',
        moat: [
            "State/provincial-level access to India's MoSPI and China's NBS/PBOC, automated daily — hard to replicate.",
            'Proprietary regime metrics: Debt/Gold Z-Score, Loan-to-Job Efficiency, Energy Dependency Ratio.',
            'FRED · BIS · IMF COFER · EIA · RBI synthesized into one surveillance layer.',
        ],
    },
    {
        n: '03',
        tag: 'Proof',
        title: 'It runs itself — and we show our work.',
        body: '93 serverless pipelines ingest daily with provenance certificates and self-healing on API drift. Don’t take our word for it.',
        proof: true,
    },
    {
        n: '04',
        tag: 'Roadmap',
        title: 'Where this goes next.',
        body: 'A weekly Regime Digest, auto-published to subscribers from the same pipeline that feeds the terminal — closing the loop from raw official data to a synthesized signal in your inbox, every Sunday.',
    },
] as const;

export const ForInstitutional: React.FC = () => {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': 'https://graphiquestor.com/#organization',
        name: 'GraphiQuestor',
        url: 'https://graphiquestor.com/institutional',
        description:
            'Live telemetry on de-dollarization, liquidity regimes, and energy security — wired directly to 15+ official statistical sources.',
        sameAs: ['https://twitter.com/GraphiQuestor'],
    };

    return (
        <div className="mx-auto w-full max-w-[1080px] px-4 py-20 sm:px-6 lg:px-12">
            <SEOManager
                title="For Investors & Research Partners"
                description="The dollar's reserve share fell from 71% to 58%. GraphiQuestor tracks de-dollarization, liquidity regimes, and energy security — wired directly to 15+ official statistical sources."
                keywords={[
                    'De-dollarization research', 'Macro intelligence platform', 'Sovereign debt monitoring',
                    'Reserve currency tracker', 'Investor research data', 'Liquidity regime telemetry',
                ]}
                jsonLd={jsonLd}
            />

            {/* ===== Hero — thesis-led statement (D7) ===== */}
            <header className="pt-2 pb-2">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-400/80">
                    For Investors &amp; Research Partners
                </div>
                <h1 className="mb-4 mt-4 max-w-[680px] text-[34px] font-extrabold leading-[1.14] text-white md:text-[40px]">
                    The dollar&apos;s reserve share fell from 71% to 58%. We track the next 13 points — before they hit headlines.
                </h1>
                <p className="mb-7 max-w-[560px] text-[15px] leading-relaxed text-white/55">
                    Live telemetry on de-dollarization, liquidity regimes, and energy security — wired directly to 15+ official statistical sources, updated daily.
                </p>
                <a
                    href="#thesis"
                    className="inline-flex items-center gap-2 rounded-[10px] bg-blue-600 px-6 py-3 text-[11px] font-black uppercase tracking-uppercase text-white transition-colors hover:bg-blue-700"
                >
                    Read the Thesis <ArrowRight size={14} />
                </a>
            </header>

            {/* ===== Narrative arc — Problem → Edge → Proof → Roadmap (D8) ===== */}
            <div id="thesis" className="mt-10 grid scroll-mt-24 gap-3.5">
                {ARC.map((step) => (
                    <div
                        key={step.n}
                        className="rounded-[18px] border border-white/[0.08] bg-white/[0.02] p-[22px]"
                    >
                        <div className="mb-2.5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-uppercase text-white/40">
                            <span className="font-mono text-blue-400">{step.n}</span> · {step.tag}
                        </div>
                        <h3 className="mb-2 text-[18px] font-extrabold text-white">{step.title}</h3>

                        {'body' in step && step.body && (
                            <p className="m-0 text-[13.5px] leading-relaxed text-white/50">{step.body}</p>
                        )}

                        {'moat' in step && step.moat && (
                            <div className="mt-3.5 grid gap-2.5">
                                {step.moat.map((m) => (
                                    <div key={m} className="flex items-start gap-2.5 text-[13px] text-white/70">
                                        <span className="font-black text-emerald-400">→</span>
                                        <span>{m}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {'proof' in step && step.proof && (
                            <Link
                                to="/data-health"
                                className="mt-3.5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-uppercase text-blue-400 hover:text-blue-300"
                            >
                                <ArrowRight size={14} /> See the live data-health board
                            </Link>
                        )}
                    </div>
                ))}
            </div>

            {/* ===== Subscribe CTA — closes the page (D11) ===== */}
            <div className="mt-[42px]">
                <SubscribeCard source="investor-page" />
            </div>
        </div>
    );
};

export default ForInstitutional;

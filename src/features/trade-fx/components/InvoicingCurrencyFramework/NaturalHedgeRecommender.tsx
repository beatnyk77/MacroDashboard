import React from 'react';
import { TrailNavLink } from '@/components/TrailLink';
import { cn } from '@/lib/utils';
import { scrollToAffiliateCta } from '../../lib/hedgingArchetypes';
import type { NaturalHedgePathway } from '../../lib/invoicingTypes';
import type { MacroRegimeSignal } from '../../lib/tradeFxTypes';

const PATHWAYS: NaturalHedgePathway[] = [
    {
        id: 'inr_invoicing',
        title: 'INR Invoicing with Chinese Supplier',
        feasibility: 'low_medium',
        description:
            'Invoice the import contract in INR. Chinese supplier receives INR via an authorized INR Vostro account. Eliminates USD/INR and CNY/INR exposure entirely.',
        requirements: [
            "Chinese counterparty's bank must have an INR Vostro account with authorized Indian bank",
            'Supplier agreement to accept INR pricing (may require price negotiation)',
            'RBI authorization — check with your AD Category I bank',
        ],
        gqSignal: 'De-Dol Lab INR Settlement Feasibility',
        gqSignalLink: '/labs/de-dollarization-gold',
        cta: 'Explore INR settlement with Skydo →',
        ctaPartner: 'skydo',
    },
    {
        id: 'natural_offset',
        title: 'Natural Hedge — Match USD Payables with USD Receivables',
        feasibility: 'medium_high',
        description:
            'If your business also has USD receivables (exports or USD-denominated revenue), match the timing and amount of USD payables against those receivables. No hedging instruments needed.',
        requirements: [
            'Requires matching USD cash inflows and outflows by tenor',
            'Set up a USD current account with your bank (EEFC account)',
            'Works best if USD receivables and payables are within same quarter',
        ],
        gqSignal: 'India Pulse — EEFC Balance & Export Trends',
        gqSignalLink: '/intel/india',
        cta: 'Learn about EEFC accounts →',
        ctaPartner: null,
    },
    {
        id: 'supplier_diversification',
        title: 'Geographic Diversification to Reduce CNY Concentration',
        feasibility: 'medium',
        description:
            'Diversifying procurement to non-China suppliers reduces CNY/INR exposure structurally. The De-Dollarization Lab tracks trade route viability.',
        requirements: [
            'Requires supply chain flexibility',
            'Lead time and quality assessment for alternative suppliers',
            'Partial shift often sufficient to reduce concentration risk',
        ],
        gqSignal: 'De-Dol Lab — Trade Route Diversification Signals',
        gqSignalLink: '/labs/de-dollarization-gold',
        cta: 'Explore Trade Intelligence →',
        ctaPartner: null,
    },
];

const FEASIBILITY_STYLES: Record<NaturalHedgePathway['feasibility'], string> = {
    low_medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    medium_high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const FEASIBILITY_LABELS: Record<NaturalHedgePathway['feasibility'], string> = {
    low_medium: 'Low–Medium feasibility',
    medium: 'Medium feasibility',
    medium_high: 'Medium–High feasibility',
};

type Props = {
    dedolSignal?: MacroRegimeSignal;
};

export const NaturalHedgeRecommender: React.FC<Props> = ({ dedolSignal }) => {
    const inrFeasibility: NaturalHedgePathway['feasibility'] =
        dedolSignal?.sentiment === 'supportive' ? 'medium' : 'low_medium';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {PATHWAYS.map((path) => {
                const feasibility =
                    path.id === 'inr_invoicing' ? inrFeasibility : path.feasibility;

                return (
                    <article
                        key={path.id}
                        className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4 flex flex-col"
                    >
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="text-sm font-black text-white/85 m-0">{path.title}</h4>
                            <span
                                className={cn(
                                    'text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border',
                                    FEASIBILITY_STYLES[feasibility],
                                )}
                            >
                                {FEASIBILITY_LABELS[feasibility]}
                            </span>
                        </div>
                        <p className="text-[11px] text-white/50 m-0 mb-3 leading-relaxed flex-1">
                            {path.description}
                        </p>
                        <details className="mb-3">
                            <summary className="text-[10px] font-black uppercase tracking-wider text-white/35 cursor-pointer">
                                What it requires
                            </summary>
                            <ul className="text-[10px] text-white/40 mt-2 pl-4 list-disc space-y-1">
                                {path.requirements.map((r) => (
                                    <li key={r}>{r}</li>
                                ))}
                            </ul>
                        </details>
                        <TrailNavLink
                            to={path.gqSignalLink}
                            className="text-[10px] font-black uppercase tracking-wider text-[#B8860B]/80 hover:text-[#B8860B] mb-3 inline-block"
                        >
                            {path.gqSignal} →
                        </TrailNavLink>
                        {path.ctaPartner ? (
                            <button
                                type="button"
                                onClick={scrollToAffiliateCta}
                                className="text-xs text-amber-400 underline text-left bg-transparent border-0 p-0 cursor-pointer"
                            >
                                {path.cta}
                            </button>
                        ) : (
                            <TrailNavLink
                                to={path.gqSignalLink}
                                className="text-xs text-amber-400/80 underline"
                            >
                                {path.cta}
                            </TrailNavLink>
                        )}
                    </article>
                );
            })}
        </div>
    );
};
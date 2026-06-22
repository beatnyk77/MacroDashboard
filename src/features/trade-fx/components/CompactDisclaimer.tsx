import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type DisclaimerContext = 'simulator' | 'collar' | 'matrix' | 'regime' | 'page';

const CONTEXT_SENTENCES: Record<Exclude<DisclaimerContext, 'page'>, string> = {
    simulator: 'Calculations assume linear P&L; actual outcomes vary.',
    collar: 'Collar payoffs exclude bid/offer spreads and credit terms.',
    matrix: 'Strategy archetypes reflect common market practice, not personalised advice.',
    regime:
        'Regime verdicts reflect publicly available macro signals — not personalised treasury advice.',
};

interface CompactDisclaimerProps {
    context?: DisclaimerContext;
    className?: string;
}

export const CompactDisclaimer: React.FC<CompactDisclaimerProps> = ({
    context = 'page',
    className,
}) => (
    <p
        role="note"
        aria-label="Educational disclaimer"
        className={cn(
            'text-[11px] text-amber-400/80 leading-relaxed m-0',
            className,
        )}
    >
        Illustrative only — not investment advice or a product offer.
        {context !== 'page' && (
            <>
                {' '}
                {CONTEXT_SENTENCES[context]}
            </>
        )}{' '}
        <Link
            to="/terms"
            className="text-amber-400 underline hover:text-amber-300 transition-colors"
        >
            Full disclaimer →
        </Link>
    </p>
);
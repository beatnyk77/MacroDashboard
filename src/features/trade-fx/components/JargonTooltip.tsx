import React from 'react';
import { cn } from '@/lib/utils';

const JARGON_DEFINITIONS: Record<string, string> = {
    'hedging window':
        'A period when market conditions (low volatility, favorable macro signals) make cost-effective hedging relatively accessible.',
    'reserves buffer':
        "India's foreign exchange reserves held by RBI, providing capacity to intervene in currency markets. Currently ~$585B.",
    'de-dollarisation corridor':
        'An emerging trade route where settlement in non-USD currencies (e.g., INR, CNY) is becoming operationally viable.',
    'forward rate':
        'The exchange rate agreed today for delivery on a future date, typically reflecting the interest rate differential between two countries.',
    'zero-cost collar':
        'A hedging structure combining a bought put option and a sold call option, structured so the premium paid and received net to zero.',
    'participation zone':
        'The spot range within a collar structure where the hedger participates in market movements without hitting the floor or cap.',
    'volatility regime':
        'A classification of the current implied volatility environment (low / moderate / elevated / high) derived from option pricing signals.',
    'inr invoicing':
        'The practice of denominating and settling trade contracts in Indian Rupees rather than USD, eliminating direct USD/INR exposure.',
    'capital flow tension':
        'Pressure from cross-border capital moving into or out of India, which can drive INR volatility independent of trade flows.',
};

interface JargonTooltipProps {
    term: string;
    children: React.ReactNode;
    className?: string;
}

export const JargonTooltip: React.FC<JargonTooltipProps> = ({ term, children, className }) => {
    const definition = JARGON_DEFINITIONS[term.toLowerCase()];
    if (!definition) return <>{children}</>;

    return (
        <span
            className={cn(
                'border-b border-dashed border-amber-400/40 cursor-help',
                className,
            )}
            title={definition}
            aria-label={`${term}: ${definition}`}
        >
            {children}
        </span>
    );
};
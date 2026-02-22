import React from 'react';

interface ChartInsightSummaryProps {
    /** The static insight text — should be 50–100 words, plain language */
    insight: string;
    /** Optional: a unique id for the paragraph, useful for crawlability */
    id?: string;
}

/**
 * Crawlable textual summary rendered below major charts.
 * Uses a plain <p> tag so search engines can index the content immediately.
 * Styled as a subtle, muted summary that doesn't interfere with chart visuals.
 */
export const ChartInsightSummary: React.FC<ChartInsightSummaryProps> = ({ insight, id }) => (
    <p
        id={id}
        className="mt-4 px-4 py-3 text-[0.75rem] leading-relaxed text-muted-foreground/60 font-medium border-l-2 border-blue-500/20 bg-white/[0.01] rounded-r-lg max-w-3xl"
        style={{ fontStyle: 'normal' }}
    >
        {insight}
    </p>
);

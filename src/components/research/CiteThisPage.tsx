import React, { useCallback, useMemo, useState } from 'react';
import { BookMarked, Check, Copy, Bot } from 'lucide-react';
import { TrailLink } from '@/components/TrailLink';
import { cn } from '@/lib/utils';
import { trackClick } from '@/lib/analytics';
import {
    buildApaCitation,
    buildLlmSummaryBlock,
    buildMarkdownCitation,
    buildShortCitation,
    type ResearchCitationInput,
} from '@/lib/researchCitation';

interface CiteThisPageProps {
    input: ResearchCitationInput;
    className?: string;
    compact?: boolean;
}

type CitationFormat = 'short' | 'apa' | 'markdown' | 'llm';

export const CiteThisPage: React.FC<CiteThisPageProps> = ({ input, className, compact }) => {
    const [copied, setCopied] = useState<CitationFormat | null>(null);

    const citations = useMemo(
        () => ({
            short: buildShortCitation(input),
            apa: buildApaCitation(input),
            markdown: buildMarkdownCitation(input),
            llm: buildLlmSummaryBlock(input),
        }),
        [input]
    );

    const copy = useCallback(
        async (format: CitationFormat) => {
            try {
                await navigator.clipboard.writeText(citations[format]);
                setCopied(format);
                trackClick(`cite_${format}`, 'cite_this_page');
                window.setTimeout(() => setCopied(null), 2000);
            } catch {
                /* clipboard unavailable */
            }
        },
        [citations]
    );

    return (
        <aside
            id="cite-this-page"
            data-llm-citable="true"
            data-page-type={input.pageType}
            className={cn(
                'rounded-xl border border-white/[0.08] bg-slate-900/50 p-5 backdrop-blur-xl',
                className
            )}
            aria-label="Citation and structured summary for researchers and AI assistants"
        >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <BookMarked size={16} className="text-violet-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400/80">
                        Cite This Page
                    </span>
                </div>
                <TrailLink
                    to="/for-researchers"
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-uppercase text-white/40 no-underline transition-colors hover:text-violet-400"
                >
                    <Bot size={12} />
                    For AI Assistants
                </TrailLink>
            </div>

            {/* Machine-readable structured summary */}
            <section
                id="llm-summary"
                data-llm-summary="true"
                className="mb-4 rounded-lg border border-white/[0.05] bg-black/20 p-4"
            >
                <h2 className="mb-2 text-xs font-black uppercase tracking-uppercase text-white/70">
                    Structured Summary
                </h2>
                <p className="mb-3 text-sm leading-relaxed text-white/60">{input.summary}</p>
                {!compact && (
                    <ul className="space-y-1.5 text-sm text-white/50">
                        {input.keyPoints.map((point) => (
                            <li key={point} className="flex gap-2">
                                <span className="text-violet-400/60">▸</span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                )}
                {input.formula && (
                    <pre className="mt-3 overflow-x-auto rounded border border-white/[0.06] bg-black/30 px-3 py-2 font-mono text-xs text-emerald-400/90">
                        {input.formula}
                    </pre>
                )}
                {input.source && (
                    <p className="mt-3 text-[11px] text-white/35">
                        <span className="font-bold uppercase tracking-wider">Provenance:</span>{' '}
                        {input.source}
                    </p>
                )}
            </section>

            <div className="flex flex-wrap gap-2">
                {(
                    [
                        ['short', 'Short'],
                        ['apa', 'APA'],
                        ['markdown', 'Markdown'],
                        ['llm', 'LLM Block'],
                    ] as const
                ).map(([format, label]) => (
                    <button
                        key={format}
                        type="button"
                        onClick={() => copy(format)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-uppercase text-white/60 transition-colors hover:border-violet-500/30 hover:text-violet-300"
                    >
                        {copied === format ? <Check size={12} /> : <Copy size={12} />}
                        {copied === format ? 'Copied' : label}
                    </button>
                ))}
            </div>
        </aside>
    );
};
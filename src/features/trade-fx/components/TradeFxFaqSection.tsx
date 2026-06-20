import React from 'react';
import { cn } from '@/lib/utils';
import { TRADE_FX_FAQ_ENTRIES } from '../lib/tradeFxSeo';

interface TradeFxFaqSectionProps {
    className?: string;
}

export const TradeFxFaqSection: React.FC<TradeFxFaqSectionProps> = ({ className }) => (
    <section
        className={cn('border border-white/10 bg-white/[0.02] rounded-2xl p-4 md:p-6', className)}
        itemScope
        itemType="https://schema.org/FAQPage"
    >
        <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 m-0 mb-5">
            Frequently Asked Questions
        </h2>

        <div className="space-y-4">
            {TRADE_FX_FAQ_ENTRIES.map((entry) => (
                <article
                    key={entry.question}
                    className="border border-white/8 rounded-xl px-4 py-4 bg-white/[0.01]"
                    itemScope
                    itemProp="mainEntity"
                    itemType="https://schema.org/Question"
                >
                    <h3
                        className="text-sm font-black text-white/85 m-0 mb-2 leading-snug"
                        itemProp="name"
                    >
                        {entry.question}
                    </h3>
                    <div
                        itemScope
                        itemProp="acceptedAnswer"
                        itemType="https://schema.org/Answer"
                    >
                        <p
                            className="text-[11px] text-white/50 leading-relaxed m-0"
                            itemProp="text"
                        >
                            {entry.answer}
                        </p>
                    </div>
                </article>
            ))}
        </div>
    </section>
);
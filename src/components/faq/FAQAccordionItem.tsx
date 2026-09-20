import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Link as LinkIcon, Check, ArrowUpRight } from 'lucide-react';
import { TrailLink as Link } from '@/components/TrailLink';
import { FAQItem } from '@/types/faq';
import { StreamedMarkdownAnswer } from './StreamedMarkdownAnswer';

interface FAQAccordionItemProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

export const FAQAccordionItem: React.FC<FAQAccordionItemProps> = ({
  item,
  isOpen,
  onToggle,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#${item.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      id={item.id}
      className={`border rounded-md transition-colors duration-200 overflow-hidden ${
        isOpen
          ? 'bg-white dark:bg-[#080d1a] border-slate-300 dark:border-[#253852] shadow-sm shadow-sky-500/5 dark:shadow-[#38bdf8]/5'
          : 'bg-slate-50/50 dark:bg-[#070b14] border-slate-200 dark:border-[#182333] hover:border-slate-300 dark:hover:border-[#223147]'
      }`}
    >
      <div className="w-full px-4 py-3 flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`faq-answer-${item.id}`}
          className="flex-1 min-w-0 pr-2 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#38bdf8] rounded-sm"
        >
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {item.category && (
              <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-sky-50 dark:bg-[#0f1d33] text-sky-600 dark:text-[#38bdf8] border border-sky-200 dark:border-[#1e324f]">
                {item.category}
              </span>
            )}
            {item.tags?.map((t, idx) => (
              <span
                key={idx}
                className="font-mono text-[9px] text-slate-500 dark:text-[#64748b] bg-slate-100 dark:bg-[#0d1524] px-1 rounded-sm"
              >
                #{t}
              </span>
            ))}
          </div>
          <h4
            className={`font-['Space_Grotesk'] text-[13px] font-medium leading-snug transition-colors ${
              isOpen ? 'text-slate-900 dark:text-[#e2e8f0]' : 'text-slate-600 dark:text-[#cbd5e1] hover:text-slate-900 dark:hover:text-[#f1f5f9]'
            }`}
          >
            {item.question}
          </h4>
        </button>

        <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copy link to question"
            className="p-1 rounded-sm text-slate-500 dark:text-[#64748b] hover:text-slate-700 dark:hover:text-[#cbd5e1] hover:bg-slate-200 dark:hover:bg-[#111c2e] transition-colors"
            title="Copy question link"
          >
            {copiedLink ? (
              <Check className="w-3 h-3 text-emerald-500 dark:text-[#10b981]" />
            ) : (
              <LinkIcon className="w-3 h-3" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? 'Collapse answer' : 'Expand answer'}
            className="p-1 text-slate-500 dark:text-[#64748b] hover:text-slate-700 dark:hover:text-[#cbd5e1] focus:outline-none"
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-answer-${item.id}`}
            role="region"
            aria-labelledby={item.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden border-t border-slate-200 dark:border-[#1a2638]"
          >
            <div className="px-4 py-3.5 bg-slate-50/70 dark:bg-[#050810]/70 text-slate-700 dark:text-[#cbd5e1]">
              <StreamedMarkdownAnswer content={item.answer} />

              {item.citationUrl && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#182333] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748b]">
                    OFFICIAL METHODOLOGY
                  </span>
                  <Link
                    to={item.citationUrl}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-600 dark:text-[#38bdf8] hover:text-sky-700 dark:hover:text-[#7dd3fc] transition-colors"
                  >
                    <span>{item.citationLabel || 'View Document'}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

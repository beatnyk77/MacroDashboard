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
          ? ' bg-card border-border shadow-sm shadow-sky-400/5'
          : ' bg-card border-border hover:border-primary/40'
      }`}
    >
      <div className="w-full px-4 py-3 flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`faq-answer-${item.id}`}
          className="flex-1 min-w-0 pr-2 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 rounded-sm"
        >
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {item.category && (
              <span className="font-mono text-[11px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-card text-sky-400 border border-border">
                {item.category}
              </span>
            )}
            {item.tags?.map((t, idx) => (
              <span
                key={idx}
                className="font-mono text-[11px] text-terminal-dim bg-card px-1 rounded-sm"
              >
                #{t}
              </span>
            ))}
          </div>
          <h4
            className={`font-sans text-sm font-medium leading-snug transition-colors ${
              isOpen ? ' text-foreground' : ' text-foreground hover:text-foreground'
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
            className="p-1 rounded-sm text-terminal-dim hover:text-foreground hover:bg-secondary transition-colors"
            title="Copy question link"
          >
            {copiedLink ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <LinkIcon className="w-3 h-3" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? 'Collapse answer' : 'Expand answer'}
            className="p-1 text-terminal-dim hover:text-foreground focus:outline-none"
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
            className="overflow-hidden border-t border-border"
          >
            <div className="px-4 py-3.5 bg-background/70 text-foreground">
              <StreamedMarkdownAnswer content={item.answer} />

              {item.citationUrl && (
                <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] font-mono text-terminal-dim">
                    OFFICIAL METHODOLOGY
                  </span>
                  <Link
                    to={item.citationUrl}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 transition-colors"
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

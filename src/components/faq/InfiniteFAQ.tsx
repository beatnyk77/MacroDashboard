import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { DocScope, FAQItem } from '@/types/faq';
import { getFAQCatalogForPage } from '@/data/faqCatalog';
import { useRAGFAQ } from '@/hooks/useRAGFAQ';
import { CuratedFAQList } from './CuratedFAQList';
import { AIRAGTerminal } from './AIRAGTerminal';

export interface InfiniteFAQProps {
  /** Target desk or page identifier (e.g. 'terminal', 'energy', 'china-debt', 'india-macro', 'api-docs') */
  pageId?: string;
  /** Section heading title */
  title?: string;
  /** Subtitle narrative copy */
  subtitle?: string;
  /** Target documentation scope for RAG retrieval */
  docScope?: DocScope | string;
  /** Custom curated FAQ items (overrides or extends catalog defaults) */
  items?: FAQItem[];
  /** Suggested query prompts for the AI terminal */
  suggestedPrompts?: string[];
  /** Auto-focus the RAG terminal prompt input on mount */
  autoFocus?: boolean;
  /** Additional container styling */
  className?: string;
}

export const InfiniteFAQ: React.FC<InfiniteFAQProps> = ({
  pageId: propPageId,
  title,
  subtitle,
  docScope: propDocScope,
  items: customItems,
  suggestedPrompts: customPrompts,
  autoFocus = false,
  className = '',
}) => {
  const location = useLocation();

  // Deduce default pageId from route if not explicitly supplied
  const effectivePageId = useMemo(() => {
    if (propPageId) return propPageId;

    const path = location.pathname.toLowerCase();
    if (path.includes('energy')) return 'energy';
    if (path.includes('china')) return 'china-debt';
    if (path.includes('india')) return 'india-macro';
    if (path.includes('sovereign') || path.includes('fiscal') || path.includes('debt')) return 'sovereign';
    if (path.includes('api')) return 'api-docs';

    return 'terminal';
  }, [propPageId, location.pathname]);

  const catalogEntry = useMemo(
    () => getFAQCatalogForPage(effectivePageId),
    [effectivePageId]
  );

  const effectiveScope = propDocScope || catalogEntry.docScope;
  const effectiveItems = customItems || catalogEntry.items;
  const effectiveTitle = title || catalogEntry.deskTitle || 'Curated Desk Intelligence';
  const effectiveSubtitle =
    subtitle || catalogEntry.subtitle || 'Institutional answers to high-frequency domain questions.';
  const effectivePrompts = customPrompts || catalogEntry.suggestedPrompts || [];

  const {
    status,
    currentQuestion,
    currentAnswer,
    citations,
    history,
    activeSessionId,
    error,
    cooldown,
    askQuestion,
    selectSessionQuery,
    clearHistory,
  } = useRAGFAQ({
    pageId: effectivePageId,
    docScope: effectiveScope,
    items: effectiveItems,
  });

  const handleAskAIFromList = (query: string) => {
    askQuestion(query);
  };

  return (
    <section
      aria-label="Infinite FAQ Intelligence Module"
      className={`relative w-full rounded-md bg-[#0b0f19]/90 border border-[#1e293b] p-4 sm:p-6 backdrop-blur-md transition-all shadow-xl shadow-black/40 ${className}`}
    >
      {/* Decorative top hairline accent */}
      <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[#38bdf8]/40 to-transparent pointer-events-none" />

      {/* Grid: 5 cols Left (Curated FAQ) & 7 cols Right (AI RAG Terminal) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Curated Expandable FAQ */}
        <div className="lg:col-span-5 flex flex-col">
          <CuratedFAQList
            items={effectiveItems}
            deskTitle={effectiveTitle}
            subtitle={effectiveSubtitle}
            onAskAI={handleAskAIFromList}
          />
        </div>

        {/* Right Column: Active AI RAG Terminal */}
        <div className="lg:col-span-7 flex flex-col min-h-[380px]">
          <AIRAGTerminal
            status={status}
            currentQuestion={currentQuestion}
            currentAnswer={currentAnswer}
            citations={citations}
            history={history}
            activeSessionId={activeSessionId}
            error={error}
            cooldown={cooldown}
            suggestedPrompts={effectivePrompts}
            docScope={effectiveScope}
            autoFocus={autoFocus}
            onAsk={askQuestion}
            onSelectSession={selectSessionQuery}
            onClearHistory={clearHistory}
          />
        </div>
      </div>
    </section>
  );
};

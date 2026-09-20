import React, { useState, useMemo } from 'react';
import { Search, X, HelpCircle, ChevronsUpDown } from 'lucide-react';
import { FAQItem } from '@/types/faq';
import { FAQAccordionItem } from './FAQAccordionItem';

interface CuratedFAQListProps {
  items: FAQItem[];
  deskTitle?: string;
  subtitle?: string;
  onAskAI?: (query: string) => void;
  className?: string;
}

export const CuratedFAQList: React.FC<CuratedFAQListProps> = ({
  items,
  deskTitle = 'Curated Intelligence FAQ',
  subtitle = 'Institutional answers to high-frequency domain questions.',
  onAskAI,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    // Open first item by default if available
    return items.length > 0 ? new Set([items[0].id]) : new Set();
  });

  const toggleItem = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (openIds.size === items.length) {
      setOpenIds(new Set());
    } else {
      setOpenIds(new Set(items.map(i => i.id)));
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      item =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-sky-500 dark:bg-[#38bdf8]" />
            <h3 className="font-['Space_Grotesk'] text-[15px] font-semibold text-slate-900 dark:text-[#e2e8f0] tracking-tight">
              {deskTitle}
            </h3>
          </div>
          <span className="font-mono text-[10px] text-slate-500 dark:text-[#64748b] bg-slate-100 dark:bg-[#0c1424] px-1.5 py-0.5 rounded-sm border border-slate-300 dark:border-[#1b2638]">
            {filteredItems.length} {filteredItems.length === 1 ? 'ITEM' : 'ITEMS'}
          </span>
        </div>
        <p className="text-[12px] text-slate-600 dark:text-[#8c909f] font-['Inter'] leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 dark:text-[#64748b] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter curated questions..."
            className="w-full bg-white dark:bg-[#070b14] border border-slate-200 dark:border-[#182333] focus:border-sky-500/60 dark:focus:border-[#38bdf8]/60 rounded-md pl-8 pr-7 py-1.5 text-[12px] text-slate-800 dark:text-[#cbd5e1] placeholder-slate-400 dark:placeholder-[#475569] font-mono focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#64748b] hover:text-slate-700 dark:hover:text-[#94a3b8]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={toggleAll}
          title={openIds.size === items.length ? 'Collapse All' : 'Expand All'}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-white dark:bg-[#070b14] border border-slate-200 dark:border-[#182333] hover:border-slate-300 dark:hover:border-[#27364f] text-[11px] font-mono text-slate-600 dark:text-[#8c909f] hover:text-slate-900 dark:hover:text-[#cbd5e1] transition-colors"
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {openIds.size === items.length ? 'Collapse' : 'Expand'}
          </span>
        </button>
      </div>

      {/* Accordion List */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <FAQAccordionItem
              key={item.id}
              item={item}
              isOpen={openIds.has(item.id)}
              onToggle={() => toggleItem(item.id)}
            />
          ))
        ) : (
          <div className="p-6 text-center rounded-md border border-dashed border-slate-300 dark:border-[#1e293b] bg-slate-50/50 dark:bg-[#050810]/50 my-2">
            <HelpCircle className="w-6 h-6 text-slate-400 dark:text-[#64748b] mx-auto mb-2 opacity-60" />
            <p className="text-[12px] text-slate-700 dark:text-[#cbd5e1] font-medium mb-1">
              No static FAQ matches "{searchQuery}"
            </p>
            <p className="text-[11px] text-slate-500 dark:text-[#64748b] mb-3">
              The short ones are here. For anything else, query our grounded RAG terminal.
            </p>
            {onAskAI && (
              <button
                type="button"
                onClick={() => onAskAI(searchQuery)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-sky-50 dark:bg-[#0e213b] hover:bg-sky-100 dark:hover:bg-[#132c4f] border border-sky-200 dark:border-[#38bdf8]/40 text-sky-600 dark:text-[#38bdf8] text-[11px] font-mono transition-colors"
              >
                <span>Ask AI: "{searchQuery}"</span>
                <span>↵</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Table, ChevronDown, ChevronUp, Info, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTranscriptRow {
  label: string;
  value: string | number;
  change?: string;
  period?: string;
  note?: string;
}

export interface DataTranscriptTable {
  caption?: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface ChartAccessibleTranscriptProps {
  /** Institutional takeaway / macro thesis explaining the chart's signal */
  takeaway: string | React.ReactNode;
  /** Optional reading guide or threshold explanation */
  readingGuide?: string;
  /** Key data points formatted as key-value pairs */
  dataRows?: DataTranscriptRow[];
  /** Full tabular data transcript for multi-column charts */
  tableData?: DataTranscriptTable;
  /** High-value search keywords/tags to be indexable and searchable via Ctrl+F */
  searchKeywords?: string[];
  /** Optional className for the root container */
  className?: string;
  /** Whether the data table should be expanded by default (default: false) */
  defaultExpanded?: boolean;
}

export const ChartAccessibleTranscript: React.FC<ChartAccessibleTranscriptProps> = ({
  takeaway,
  readingGuide,
  dataRows,
  tableData,
  searchKeywords,
  className,
  defaultExpanded = false,
}) => {
  const [isTableOpen, setIsTableOpen] = useState(defaultExpanded);
  const hasTableContent = (dataRows && dataRows.length > 0) || (tableData && tableData.rows.length > 0);

  return (
    <figcaption className={cn("mt-4 space-y-3 font-sans", className)}>
      {/* 1. Core Institutional Takeaway Callout */}
      <div className="rounded-xl border border-border bg-card/80 dark:bg-card/40 p-3.5 backdrop-blur-sm shadow-sm">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Info className="h-3 w-3" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-mono">
              Chart Takeaway & Macro Signal
            </div>
            <div className="text-xs font-medium leading-relaxed text-foreground">
              {takeaway}
            </div>
            {readingGuide && (
              <p className="text-[11px] text-muted-foreground leading-snug pt-1 border-t border-border font-mono">
                <span className="text-foreground font-bold">Reading Guide: </span>
                {readingGuide}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Search Keywords Strip (Visible for Ctrl+F & Crawlers) */}
      {searchKeywords && searchKeywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 py-0.5">
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Tag className="h-2.5 w-2.5" /> Tags:
          </span>
          {searchKeywords.map((kw) => (
            <span
              key={kw}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 border border-border text-muted-foreground"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* 3. Collapsible / Accessible Data Table Transcript */}
      {hasTableContent && (
        <div className="rounded-lg border border-border bg-card/50 overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setIsTableOpen(!isTableOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            aria-expanded={isTableOpen}
          >
            <span className="flex items-center gap-1.5">
              <Table className="h-3 w-3 text-muted-foreground" />
              {isTableOpen ? "Hide Data Transcript" : "View Accessible Data Transcript"}
            </span>
            {isTableOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {/* Table Container (Visible when toggled, or always available for search bots / screen readers) */}
          <div
            className={cn(
              "overflow-x-auto border-t border-border transition-all",
              isTableOpen ? "block p-3" : "hidden"
            )}
          >
            {/* Multi-column Table */}
            {tableData && (
              <table className="w-full min-w-[320px] text-left border-collapse">
                {tableData.caption && (
                  <caption className="sr-only">{tableData.caption}</caption>
                )}
                <thead>
                  <tr className="border-b border-border text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                    {tableData.headers.map((h, idx) => (
                      <th key={idx} className="pb-1.5 pr-3 font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-mono">
                  {tableData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-muted/30">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-1.5 pr-3 text-foreground">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Key-Value Rows List */}
            {dataRows && (
              <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {dataRows.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-muted/40 border border-border space-y-0.5"
                  >
                    <dt className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground truncate">
                      {r.label}
                    </dt>
                    <dd className="text-xs font-mono font-bold text-foreground">
                      {r.value}
                      {r.change && (
                        <span className="ml-1 text-[10px] text-cyan-600 dark:text-cyan-400 font-normal">
                          ({r.change})
                        </span>
                      )}
                    </dd>
                    {r.note && (
                      <div className="text-[9px] text-muted-foreground truncate">
                        {r.note}
                      </div>
                    )}
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      )}
    </figcaption>
  );
};

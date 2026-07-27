import React from 'react';
import { Calendar, Hash, Clock } from 'lucide-react';

export interface EditionHeaderProps {
  yearMonth: string;
  publishedAt?: string;
  asOf: string | null;
  editionNumber: number | null;
}

function formatYearMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const EditionHeader: React.FC<EditionHeaderProps> = ({
  yearMonth,
  publishedAt,
  asOf,
  editionNumber,
}) => {
  const monthLabel = formatYearMonth(yearMonth);
  const published = formatDate(publishedAt);
  const asOfLabel = formatDate(asOf);

  return (
    <header className="space-y-3 border-b border-white/5 pb-8">
      <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/40">
        <span>Monthly Regime Notebook</span>
        {editionNumber != null && (
          <span className="inline-flex items-center gap-1 text-muted-foreground/50">
            <Hash size={10} aria-hidden />
            <span className="tabular-nums">Edition {editionNumber}</span>
          </span>
        )}
      </div>

      <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
        {monthLabel} Macro Regime Digest
      </h1>

      <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
        Desk brief · Scoreboard · Automated rules
      </p>

      <div className="flex flex-wrap gap-4 pt-1 text-[11px] font-medium text-muted-foreground/60">
        {published && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={12} className="text-muted-foreground/40" aria-hidden />
            <span>Published {published}</span>
          </span>
        )}
        {asOfLabel && (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} className="text-muted-foreground/40" aria-hidden />
            <span>
              Data as of <span className="tabular-nums text-muted-foreground/80">{asOfLabel}</span>
            </span>
          </span>
        )}
      </div>
    </header>
  );
};

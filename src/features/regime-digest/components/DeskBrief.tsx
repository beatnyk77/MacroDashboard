import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Crosshair,
  Eye,
  FileText,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MetricMove, NotebookPayload, WatchItem } from '@/features/regime-digest/lib/types';

export interface DeskBriefProps {
  thesis: string[];
  movers: NotebookPayload['movers'];
  positioning: string[];
  watchlist: WatchItem[];
}

function formatDeltaPct(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

const MoverRow: React.FC<{ move: MetricMove; direction: 'up' | 'down' }> = ({
  move,
  direction,
}) => {
  const Icon = direction === 'up' ? ArrowUpRight : ArrowDownRight;
  const color = direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  return (
    <li className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{move.name}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {move.section.replace(/_/g, ' ')}
        </p>
      </div>
      <span
        className={cn(
          'inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums shrink-0',
          color,
        )}
      >
        <Icon size={12} aria-hidden />
        <span>{formatDeltaPct(move.deltaPct)}</span>
      </span>
    </li>
  );
};

export const DeskBrief: React.FC<DeskBriefProps> = ({
  thesis,
  movers,
  positioning,
  watchlist,
}) => {
  return (
    <section className="space-y-6" aria-label="Desk brief">
      <Card variant="elevated" className="bg-card border-border shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <FileText size={14} aria-hidden />
            Thesis
          </h2>
          {thesis.length === 0 ? (
            <p className="text-sm text-muted-foreground">Thesis unavailable for this edition.</p>
          ) : (
            <ul className="space-y-3">
              {thesis.map((line, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" aria-hidden />
                  <p className="text-sm md:text-base text-foreground leading-relaxed font-medium">
                    {line}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="elevated" className="bg-card border-border shadow-sm">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ArrowUpRight size={14} aria-hidden />
              Top movers up
            </h3>
            {movers.up.length === 0 ? (
              <p className="text-xs text-muted-foreground">No qualifying upside movers.</p>
            ) : (
              <ul>
                {movers.up.map((m) => (
                  <MoverRow key={m.id} move={m} direction="up" />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated" className="bg-card border-border shadow-sm">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <ArrowDownRight size={14} aria-hidden />
              Top movers down
            </h3>
            {movers.down.length === 0 ? (
              <p className="text-xs text-muted-foreground">No qualifying downside movers.</p>
            ) : (
              <ul>
                {movers.down.map((m) => (
                  <MoverRow key={m.id} move={m} direction="down" />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="elevated" className="bg-card border-border shadow-sm">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Crosshair size={14} aria-hidden />
              Positioning framework
            </h3>
            {positioning.length === 0 ? (
              <p className="text-xs text-muted-foreground">No framework notes.</p>
            ) : (
              <ul className="space-y-2">
                {positioning.map((line, i) => (
                  <li key={i} className="text-sm text-foreground/90 leading-snug">
                    {line}
                  </li>
                ))}
              </ul>
            )}
            <p className="pt-3 mt-1 border-t border-border text-[10px] font-bold text-muted-foreground flex items-start gap-1.5 leading-snug">
              <Info size={11} className="mt-0.5 shrink-0" aria-hidden />
              Framework implications — not personalized advice.
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated" className="bg-card border-border shadow-sm">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Eye size={14} aria-hidden />
              Watchlist
            </h3>
            {watchlist.length === 0 ? (
              <p className="text-xs text-muted-foreground">No watch items this edition.</p>
            ) : (
              <ul className="space-y-3">
                {watchlist.map((item, i) => (
                  <li key={i} className="space-y-1 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-border bg-muted/60 text-muted-foreground">
                        {item.type}
                      </span>
                      {item.date && (
                        <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                          {item.date}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{item.why}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

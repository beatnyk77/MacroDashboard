import React from 'react';
import { History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RegimeLabel } from '@/features/regime-digest/lib/types';

export interface RegimeHistoryProps {
  history: { yearMonth: string; regime: RegimeLabel }[];
}

const REGIME_UI: Record<RegimeLabel, { label: string; className: string }> = {
  RISK_ON: {
    label: 'Risk On',
    className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  NEUTRAL: {
    label: 'Neutral',
    className: 'text-slate-300 border-slate-500/30 bg-slate-500/10',
  },
  RISK_OFF: {
    label: 'Risk Off',
    className: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  },
};

function formatYm(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export const RegimeHistory: React.FC<RegimeHistoryProps> = ({ history }) => {
  if (!history.length) {
    return (
      <section aria-label="Regime history">
        <Card variant="elevated" className="bg-slate-950/50 border-white/5">
          <CardContent className="p-5">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 flex items-center gap-2 mb-3">
              <History size={14} aria-hidden />
              Regime history
            </h2>
            <p className="text-sm text-muted-foreground/40">No prior regime history for this series.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Newest first for scanability
  const ordered = [...history].sort((a, b) => (a.yearMonth < b.yearMonth ? 1 : -1));

  return (
    <section aria-label="Regime history">
      <Card variant="elevated" className="bg-slate-950/50 border-white/5">
        <CardContent className="p-5 md:p-6 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 flex items-center gap-2">
            <History size={14} aria-hidden />
            Regime history
          </h2>

          <ol className="flex flex-wrap gap-2">
            {ordered.map((entry) => {
              const ui = REGIME_UI[entry.regime] ?? REGIME_UI.NEUTRAL;
              return (
                <li
                  key={entry.yearMonth}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02]"
                >
                  <span className="text-[11px] font-mono font-bold tabular-nums text-muted-foreground/70">
                    {formatYm(entry.yearMonth)}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider',
                      ui.className,
                    )}
                  >
                    {ui.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
};

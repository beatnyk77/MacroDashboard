import React, { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, Table2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MetricRow, ScoreboardSectionId } from '@/features/regime-digest/lib/types';
import { StatusChip } from './StatusChip';

export interface ScoreboardProps {
  board: MetricRow[];
}

const SECTION_ORDER: ScoreboardSectionId[] = [
  'liquidity',
  'rates_usd',
  'vol',
  'metals',
  'energy',
  'us',
  'india',
  'china',
];

const SECTION_LABELS: Record<ScoreboardSectionId, string> = {
  liquidity: 'Liquidity',
  rates_usd: 'Rates & USD',
  vol: 'Volatility',
  metals: 'Metals',
  energy: 'Energy',
  us: 'United States',
  india: 'India',
  china: 'China',
};

function formatLevel(row: MetricRow): string {
  if (row.level == null) return '—';
  const n = row.level;
  const abs = Math.abs(n);
  if (abs >= 1000) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
  }
  if (abs >= 100) return n.toFixed(1);
  if (abs >= 10) return n.toFixed(2);
  return n.toFixed(2);
}

function formatDeltaPct(pct: number | null): { text: string; dir: 'up' | 'down' | 'flat' } {
  if (pct == null || Number.isNaN(pct)) return { text: '—', dir: 'flat' };
  if (pct === 0) return { text: '0.00%', dir: 'flat' };
  const sign = pct > 0 ? '+' : '';
  return {
    text: `${sign}${pct.toFixed(2)}%`,
    dir: pct > 0 ? 'up' : 'down',
  };
}

const DeltaCell: React.FC<{ deltaPct: number | null }> = ({ deltaPct }) => {
  const { text, dir } = formatDeltaPct(deltaPct);
  const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus;
  const color =
    dir === 'up' ? 'text-emerald-400' : dir === 'down' ? 'text-rose-400' : 'text-muted-foreground/50';
  return (
    <span className={cn('inline-flex items-center justify-end gap-1 font-mono tabular-nums text-xs font-bold', color)}>
      <Icon size={12} aria-hidden />
      <span>{text}</span>
      <span className="sr-only">
        {dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'unchanged'}
      </span>
    </span>
  );
};

const MetricName: React.FC<{ row: MetricRow }> = ({ row }) => {
  if (row.glossaryPath) {
    return (
      <Link
        to={row.glossaryPath}
        className="text-sm font-bold text-white/90 hover:text-blue-400 transition-colors"
      >
        {row.name}
      </Link>
    );
  }
  return <span className="text-sm font-bold text-white/90">{row.name}</span>;
};

export const Scoreboard: React.FC<ScoreboardProps> = ({ board }) => {
  const sections = useMemo(() => {
    const grouped = new Map<ScoreboardSectionId, MetricRow[]>();
    for (const row of board) {
      const list = grouped.get(row.section) ?? [];
      list.push(row);
      grouped.set(row.section, list);
    }
    return SECTION_ORDER
      .map((id) => ({ id, label: SECTION_LABELS[id], rows: grouped.get(id) ?? [] }))
      .filter((s) => s.rows.length > 0);
  }, [board]);

  if (sections.length === 0) {
    return (
      <section aria-label="Scoreboard">
        <Card variant="elevated" className="bg-slate-950/60 border-white/10">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground/50">Scoreboard unavailable — no metrics in board.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Scoreboard">
      <div className="flex items-center gap-2">
        <Table2 size={14} className="text-muted-foreground/40" aria-hidden />
        <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">
          Scoreboard
        </h2>
      </div>

      {sections.map((section) => (
        <Card
          key={section.id}
          variant="elevated"
          className="bg-slate-950/50 border-white/5 overflow-hidden"
        >
          <div className="px-4 md:px-5 py-3 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/55">
              {section.label}
            </h3>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/35 border-b border-white/5">
                  <th className="px-5 py-2.5 font-black">Metric</th>
                  <th className="px-3 py-2.5 font-black text-right">Level</th>
                  <th className="px-3 py-2.5 font-black text-right">Δ%</th>
                  <th className="px-3 py-2.5 font-black">Unit</th>
                  <th className="px-3 py-2.5 font-black">As of</th>
                  <th className="px-3 py-2.5 font-black">Source</th>
                  <th className="px-5 py-2.5 font-black">Status</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <MetricName row={row} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-mono text-sm font-bold text-white tabular-nums">
                        {formatLevel(row)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <DeltaCell deltaPct={row.deltaPct} />
                    </td>
                    <td className="px-3 py-3 text-[11px] text-muted-foreground/50 font-medium">
                      {row.unit || '—'}
                    </td>
                    <td className="px-3 py-3 text-[11px] font-mono tabular-nums text-muted-foreground/45">
                      {row.asOf ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-[11px] text-muted-foreground/45">
                      {row.sourceFamily || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusChip status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-white/5">
            {section.rows.map((row) => (
              <div key={row.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <MetricName row={row} />
                  <StatusChip status={row.status} />
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/35">
                      Level
                    </p>
                    <p className="font-mono text-base font-black text-white tabular-nums">
                      {formatLevel(row)}
                      {row.unit ? (
                        <span className="ml-1 text-[10px] font-bold text-muted-foreground/40 not-italic">
                          {row.unit}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <DeltaCell deltaPct={row.deltaPct} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground/40">
                  <span>
                    As of{' '}
                    <span className="font-mono tabular-nums text-muted-foreground/60">
                      {row.asOf ?? '—'}
                    </span>
                  </span>
                  <span>{row.sourceFamily || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </section>
  );
};

import React, { useMemo, useState } from 'react';
import { useGfpMtsOutlays } from '@/hooks/useGfpMtsOutlays';
import { formatCashDollars, formatPct } from '@/features/gfp/lib/format';
import { GFP_BASIS } from '@/features/gfp/lib/types';
import type { MtsOutlayRankRow } from '@/features/gfp/lib/types';
import { GfpBasisBadge, GfpLoadingState, GfpUnavailableState } from './GfpEmptyState';

type SortKey = 'rnk' | 'current_month_net_outly' | 'share' | 'yoy_fytd' | 'vol_12m';

function formatYoy(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  // View emits FYTD growth as a ratio; treat |n|<=2 as percent change
  if (Math.abs(n) <= 2) return formatPct(n);
  // Fallback: raw-dollar level delta (should be rare)
  return formatCashDollars(n);
}

export const AgencyOutlaysRankTable: React.FC = () => {
  const { data, isLoading, error } = useGfpMtsOutlays();
  const [sortKey, setSortKey] = useState<SortKey>('rnk');
  const [asc, setAsc] = useState(true);

  const rows = useMemo(() => {
    const rank = data?.rank ?? [];
    const sorted = [...rank].sort((a, b) => {
      const av = a[sortKey] as number | null;
      const bv = b[sortKey] as number | null;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return asc ? av - bv : bv - av;
    });
    return sorted;
  }, [data, sortKey, asc]);

  const asOf = data?.rank?.[0]?.record_date;

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setAsc((v) => !v);
    } else {
      setSortKey(key);
      setAsc(key === 'rnk');
    }
  };

  if (isLoading) return <GfpLoadingState />;
  if (error || !rows.length) return <GfpUnavailableState />;

  return (
    <section className="space-y-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">
            Agency Outlays Rank
          </h3>
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-1">
            MTS Table 5 · latest month{asOf ? ` · ${asOf}` : ''}
          </p>
        </div>
        <GfpBasisBadge basis="cash" />
      </div>
      <p className="text-[10px] text-muted-foreground/40">{GFP_BASIS.cash}</p>

      <div className="overflow-auto max-h-96">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 bg-black/80 backdrop-blur">
            <tr>
              <SortTh label="#" k="rnk" sortKey={sortKey} asc={asc} onSort={onSort} />
              <th className="px-3 py-2 font-black uppercase tracking-widest text-muted-foreground/50 text-[9px]">
                Agency / Classification
              </th>
              <SortTh label="Size" k="current_month_net_outly" sortKey={sortKey} asc={asc} onSort={onSort} align="right" />
              <SortTh label="Share" k="share" sortKey={sortKey} asc={asc} onSort={onSort} align="right" />
              <SortTh label="YoY" k="yoy_fytd" sortKey={sortKey} asc={asc} onSort={onSort} align="right" />
              <SortTh label="Vol 12m" k="vol_12m" sortKey={sortKey} asc={asc} onSort={onSort} align="right" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r: MtsOutlayRankRow) => (
              <tr
                key={`${r.rnk}-${r.classification_desc}`}
                className="border-t border-white/[0.03] hover:bg-white/[0.02]"
              >
                <td className="px-3 py-1.5 font-mono text-muted-foreground tabular-nums">{r.rnk}</td>
                <td className="px-3 py-1.5 text-white/90 max-w-md truncate" title={r.classification_desc}>
                  {r.classification_desc}
                </td>
                <td className="px-3 py-1.5 font-mono tabular-nums text-right text-white">
                  {formatCashDollars(r.current_month_net_outly)}
                </td>
                <td className="px-3 py-1.5 font-mono tabular-nums text-right text-white/80">
                  {formatPct(r.share)}
                </td>
                <td className="px-3 py-1.5 font-mono tabular-nums text-right text-white/80">
                  {formatYoy(r.yoy_fytd)}
                </td>
                <td className="px-3 py-1.5 font-mono tabular-nums text-right text-white/80">
                  {formatCashDollars(r.vol_12m)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const SortTh: React.FC<{
  label: string;
  k: SortKey;
  sortKey: SortKey;
  asc: boolean;
  onSort: (k: SortKey) => void;
  align?: 'left' | 'right';
}> = ({ label, k, sortKey, asc, onSort, align = 'left' }) => (
  <th
    className={`px-3 py-2 font-black uppercase tracking-widest text-[9px] cursor-pointer select-none ${
      align === 'right' ? 'text-right' : 'text-left'
    } ${sortKey === k ? 'text-cyan-400/80' : 'text-muted-foreground/50'}`}
    onClick={() => onSort(k)}
  >
    {label}
    {sortKey === k ? (asc ? ' ↑' : ' ↓') : ''}
  </th>
);

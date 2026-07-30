import React, { useMemo } from 'react';
import { FreshnessChip, type FreshnessStatus } from '@/components/FreshnessChip';
import { useGfpNetCostConcentration } from '@/hooks/useGfpNetCost';
import { useGfpBalanceSheet } from '@/hooks/useGfpBalanceSheet';
import { formatBillions, formatPct } from '@/features/gfp/lib/format';
import { GFP_BASIS } from '@/features/gfp/lib/types';
import { GfpBasisBadge, GfpLoadingState, GfpUnavailableState } from './GfpEmptyState';

function freshnessFromDate(recordDate: string | undefined): FreshnessStatus {
  if (!recordDate) return 'no_data';
  const t = Date.parse(recordDate);
  if (!Number.isFinite(t)) return 'no_data';
  const days = (Date.now() - t) / (1000 * 60 * 60 * 24);
  // FRUSG is annual; lag of many months is expected.
  if (days <= 120) return 'fresh';
  if (days <= 400) return 'lagged';
  return 'stale';
}

export const GfpKpiStrip: React.FC = () => {
  const conc = useGfpNetCostConcentration();
  const bs = useGfpBalanceSheet(false);

  const isLoading = conc.isLoading || bs.isLoading;
  const error = conc.error || bs.error;

  const cards = useMemo(() => {
    const concRows = conc.data ?? [];
    const summary = bs.data?.summary ?? [];
    if (!concRows.length && !summary.length) return null;

    const latestConc = concRows.length ? concRows[concRows.length - 1] : null;
    const latestBs = summary.length ? summary[summary.length - 1] : null;
    const fy = latestConc?.stmt_fiscal_year ?? latestBs?.stmt_fiscal_year ?? null;

    return {
      fy,
      recordDate: latestBs?.record_date,
      items: [
        {
          label: 'Total Net Cost',
          value: formatBillions(latestConc?.total_net_cost),
          hint: fy != null ? `FY${fy}` : '—',
        },
        {
          label: 'Net Position',
          value: formatBillions(latestBs?.net_position_bil),
          hint: 'Consolidated',
        },
        {
          label: 'Total Assets',
          value: formatBillions(latestBs?.total_assets_bil),
          hint: 'Accrual BS',
        },
        {
          label: 'Total Liabilities',
          value: formatBillions(latestBs?.total_liabilities_bil),
          hint: 'Accrual BS',
        },
        {
          label: 'Top-5 Net Cost Share',
          value: formatPct(latestConc?.top5_share),
          hint: 'Agency concentration',
        },
      ],
    };
  }, [conc.data, bs.data]);

  if (isLoading) return <GfpLoadingState />;
  if (error || !cards) return <GfpUnavailableState />;

  const status = freshnessFromDate(cards.recordDate);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-white">
          Government Financial Position
          {cards.fy != null ? ` · FY${cards.fy}` : ''}
        </h2>
        <GfpBasisBadge basis="accrual" />
        {cards.recordDate && (
          <FreshnessChip status={status} lastUpdated={cards.recordDate} />
        )}
      </div>
      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
        {GFP_BASIS.accrual}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.items.map((item) => (
          <div
            key={item.label}
            className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-1"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {item.label}
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-white tabular-nums">
              {item.value}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/40">
              {item.hint}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

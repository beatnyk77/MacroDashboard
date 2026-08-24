import React, { useMemo } from 'react';
import { TrailLink as Link } from '@/components/TrailLink';
import { ArrowUpRight } from 'lucide-react';
import { useGfpNetCostConcentration } from '@/hooks/useGfpNetCost';
import { useGfpBalanceSheet } from '@/hooks/useGfpBalanceSheet';
import { formatBillions, formatPct } from '@/features/gfp/lib/format';
import { GfpLoadingState, GfpUnavailableState } from './GfpEmptyState';

export const GfpTeaserCard: React.FC = () => {
  const conc = useGfpNetCostConcentration();
  const bs = useGfpBalanceSheet(false);

  const isLoading = conc.isLoading || bs.isLoading;
  const error = conc.error || bs.error;

  const kpis = useMemo(() => {
    const concRows = conc.data ?? [];
    const summary = bs.data?.summary ?? [];
    if (!concRows.length && !summary.length) return null;

    const latestConc = concRows.length ? concRows[concRows.length - 1] : null;
    const latestBs = summary.length ? summary[summary.length - 1] : null;
    const fy = latestConc?.stmt_fiscal_year ?? latestBs?.stmt_fiscal_year ?? null;

    return {
      fy,
      totalNetCost: formatBillions(latestConc?.total_net_cost),
      netPosition: formatBillions(latestBs?.net_position_bil),
      top5: formatPct(latestConc?.top5_share),
    };
  }, [conc.data, bs.data]);

  if (isLoading) return <GfpLoadingState />;
  if (error || !kpis) return <GfpUnavailableState />;

  return (
    <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400/80">
            Deep Dive
          </div>
          <h3 className="text-base font-black uppercase tracking-tight text-white mt-1">
            Government Financial Position
            {kpis.fy != null ? ` · FY${kpis.fy}` : ''}
          </h3>
          <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-md">
            FRUSG accrual net cost & balance sheet · MTS agency outlays (cash)
          </p>
        </div>
        <Link
          to="/labs/gov-financial-position"
          className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-cyan-300 border border-cyan-500/30 rounded px-3 py-1.5 hover:bg-cyan-500/10 transition-colors"
        >
          Open Board <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <TeaserMetric label="Total Net Cost" value={kpis.totalNetCost} />
        <TeaserMetric label="Net Position" value={kpis.netPosition} />
        <TeaserMetric label="Top-5 Share" value={kpis.top5} />
      </div>

      <Link
        to="/labs/gov-financial-position"
        className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-white transition-colors"
      >
        View full FRUSG + MTS board →
      </Link>
    </div>
  );
};

const TeaserMetric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 rounded-lg border border-white/5 bg-black/20">
    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
      {label}
    </div>
    <div className="text-base md:text-lg font-black font-mono text-white tabular-nums mt-0.5">
      {value}
    </div>
  </div>
);

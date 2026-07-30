import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useGfpReceipts } from '@/hooks/useGfpReceipts';
import { formatBillions } from '@/features/gfp/lib/format';
import { GFP_BASIS } from '@/features/gfp/lib/types';
import {
  DEFAULT_CARTESIAN_GRID_PROPS,
  DEFAULT_XAXIS_PROPS,
  DEFAULT_YAXIS_PROPS,
  DEFAULT_TOOLTIP_STYLE,
  CHART_HEIGHTS,
} from '@/constants/chartDefaults';
import { GfpBasisBadge, GfpLoadingState, GfpUnavailableState } from './GfpEmptyState';

/** Fiscal Data receipt_amt is raw dollars → display billions. */
function toDisplayBillions(amt: number | null | undefined): number | null {
  if (amt == null || Number.isNaN(amt)) return null;
  return amt / 1e9;
}

export const ReceiptsByAgencyPanel: React.FC = () => {
  const { data, isLoading, error } = useGfpReceipts();

  const { ranking, fy, asOf } = useMemo(() => {
    const rows = data ?? [];
    if (!rows.length) return { ranking: [] as { name: string; bil: number }[], fy: null as number | null, asOf: undefined as string | undefined };

    const latestFy = Math.max(...rows.map((r) => r.fiscal_year_end_year));
    const latest = rows
      .filter((r) => r.fiscal_year_end_year === latestFy)
      .map((r) => ({
        name: r.agency_name || r.aid_cd,
        bil: toDisplayBillions(r.receipt_amt) ?? 0,
        record_date: r.record_date,
      }))
      .sort((a, b) => b.bil - a.bil)
      .slice(0, 12);

    return {
      ranking: latest.map(({ name, bil }) => ({ name, bil })),
      fy: latestFy,
      asOf: latest[0]?.record_date,
    };
  }, [data]);

  if (isLoading) return <GfpLoadingState />;
  if (error || !ranking.length) return <GfpUnavailableState />;

  const chartRows = ranking.map((r) => ({
    name: r.name.length > 18 ? `${r.name.slice(0, 16)}…` : r.name,
    fullName: r.name,
    bil: r.bil,
  }));

  return (
    <section className="space-y-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">
            Receipts by Agency
            {fy != null ? ` · FY${fy}` : ''}
          </h3>
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-1">
            Top agencies{asOf ? ` · as of ${asOf}` : ''}
          </p>
        </div>
        <GfpBasisBadge basis="cash" />
      </div>
      <p className="text-[10px] text-muted-foreground/40">{GFP_BASIS.cash}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="overflow-auto max-h-72">
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 bg-black/80 backdrop-blur">
              <tr>
                <th className="px-3 py-2 font-black uppercase tracking-widest text-muted-foreground/50 text-[9px]">
                  #
                </th>
                <th className="px-3 py-2 font-black uppercase tracking-widest text-muted-foreground/50 text-[9px]">
                  Agency
                </th>
                <th className="px-3 py-2 font-black uppercase tracking-widest text-muted-foreground/50 text-[9px] text-right">
                  Receipts
                </th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={r.name} className="border-t border-white/[0.03]">
                  <td className="px-3 py-1.5 font-mono text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-1.5 text-white/90 truncate max-w-[14rem]" title={r.name}>
                    {r.name}
                  </td>
                  <td className="px-3 py-1.5 font-mono tabular-nums text-right text-white">
                    {formatBillions(r.bil)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ width: '100%', height: CHART_HEIGHTS.standard }}>
          <ResponsiveContainer>
            <BarChart data={chartRows} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} horizontal={false} />
              <XAxis
                type="number"
                {...DEFAULT_XAXIS_PROPS}
                tickFormatter={(v) => formatBillions(Number(v), 0)}
              />
              <YAxis
                type="category"
                dataKey="name"
                {...DEFAULT_YAXIS_PROPS}
                width={100}
                tick={{ fill: '#64748b', fontSize: 9 }}
              />
              <Tooltip
                contentStyle={DEFAULT_TOOLTIP_STYLE}
                formatter={(value: number, _n, item) => [
                  formatBillions(value),
                  (item?.payload as { fullName?: string })?.fullName ?? 'Receipts',
                ]}
              />
              <Bar dataKey="bil" fill="#22d3ee" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

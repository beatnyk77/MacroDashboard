import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useGfpBalanceSheet } from '@/hooks/useGfpBalanceSheet';
import { formatBillions } from '@/features/gfp/lib/format';
import { GFP_BASIS } from '@/features/gfp/lib/types';
import {
  DEFAULT_CARTESIAN_GRID_PROPS,
  DEFAULT_XAXIS_PROPS,
  DEFAULT_YAXIS_PROPS,
  DEFAULT_TOOLTIP_STYLE,
  DEFAULT_LEGEND_PROPS,
  CHART_HEIGHTS,
} from '@/constants/chartDefaults';
import { GfpBasisBadge, GfpLoadingState, GfpUnavailableState } from './GfpEmptyState';

export const BalanceSheetTrendChart: React.FC = () => {
  const { data, isLoading, error } = useGfpBalanceSheet(false);

  const chartData = useMemo(() => {
    const summary = data?.summary ?? [];
    return summary.map((r) => ({
      fy: r.stmt_fiscal_year,
      assets: r.total_assets_bil,
      liabilities: r.total_liabilities_bil,
      netPosition: r.net_position_bil,
    }));
  }, [data]);

  if (isLoading) return <GfpLoadingState />;
  if (error || !chartData.length) return <GfpUnavailableState />;

  return (
    <section className="space-y-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">
            Consolidated Balance Sheet
          </h3>
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-1">
            Assets · Liabilities · Net position
          </p>
        </div>
        <GfpBasisBadge basis="accrual" />
      </div>
      <p className="text-[10px] text-muted-foreground/40">{GFP_BASIS.accrual}</p>
      <div style={{ width: '100%', height: CHART_HEIGHTS.standard }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
            <XAxis dataKey="fy" {...DEFAULT_XAXIS_PROPS} />
            <YAxis
              {...DEFAULT_YAXIS_PROPS}
              tickFormatter={(v) => formatBillions(Number(v), 0)}
              width={56}
            />
            <Tooltip
              contentStyle={DEFAULT_TOOLTIP_STYLE}
              formatter={(value: number, name: string) => [formatBillions(value), name]}
              labelFormatter={(l) => `FY${l}`}
            />
            <Legend {...DEFAULT_LEGEND_PROPS} />
            <Line
              type="monotone"
              dataKey="assets"
              name="Total Assets"
              stroke="#34d399"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="liabilities"
              name="Total Liabilities"
              stroke="#f87171"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="netPosition"
              name="Net Position"
              stroke="#22d3ee"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

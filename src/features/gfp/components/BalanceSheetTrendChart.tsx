import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
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
  DEFAULT_TOOLTIP_ITEM_STYLE,
  DEFAULT_TOOLTIP_LABEL_STYLE,
    CHART_COLORS,
} from '@/constants/chartDefaults';
import { GfpBasisBadge, GfpLoadingState, GfpUnavailableState } from './GfpEmptyState';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

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
    <section className="space-y-3 p-4 rounded-xl border border-border bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Consolidated Balance Sheet
          </h3>
          <p className="text-[11px] text-terminal-dim uppercase tracking-wider mt-1">
            Assets · Liabilities · Net position
          </p>
        </div>
        <GfpBasisBadge basis="accrual" />
      </div>
      <p className="text-[11px] text-terminal-dim">{GFP_BASIS.accrual}</p>
      <div style={{ width: '100%', height: CHART_HEIGHTS.standard }}>
        <MacroChartContainer height="fill">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
            <XAxis dataKey="fy" {...DEFAULT_XAXIS_PROPS} />
            <YAxis
              {...DEFAULT_YAXIS_PROPS}
              tickFormatter={(v) => formatBillions(Number(v), 0)}
              width={56}
            />
            <Tooltip
              labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
              itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
              contentStyle={DEFAULT_TOOLTIP_STYLE}
              formatter={(value: number, name: string) => [formatBillions(value), name]}
              labelFormatter={(l) => `FY${l}`}
            />
            <Legend {...DEFAULT_LEGEND_PROPS} />
            <Line
              type="monotone"
              dataKey="assets"
              name="Total Assets"
              stroke={CHART_COLORS.expansion}
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="liabilities"
              name="Total Liabilities"
              stroke={CHART_COLORS.stress}
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="netPosition"
              name="Net Position"
              stroke={CHART_COLORS.west}
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </MacroChartContainer>
      </div>
    </section>
  );
};

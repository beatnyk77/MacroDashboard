import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useGfpNetCostConcentration } from '@/hooks/useGfpNetCost';
import { formatPct } from '@/features/gfp/lib/format';
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

export const ConcentrationPanel: React.FC = () => {
  const { data, isLoading, error } = useGfpNetCostConcentration();

  const chartData = useMemo(
    () =>
      (data ?? []).map((r) => ({
        fy: r.stmt_fiscal_year,
        top5: r.top5_share,
        top10: r.top10_share,
        hhi: r.hhi,
      })),
    [data],
  );

  const latest = chartData.length ? chartData[chartData.length - 1] : null;

  if (isLoading) return <GfpLoadingState />;
  if (error || !chartData.length) return <GfpUnavailableState />;

  return (
    <section className="space-y-3 p-4 rounded-xl border border-border bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Net Cost Concentration
          </h3>
          <p className="text-[11px] text-terminal-dim uppercase tracking-wider mt-1">
            HHI (0–1) · top-5 / top-10 share of agency net cost
          </p>
        </div>
        <GfpBasisBadge basis="accrual" />
      </div>
      <p className="text-[11px] text-terminal-dim">{GFP_BASIS.accrual}</p>

      {latest && (
        <div className="grid grid-cols-3 gap-3">
          <Metric label="HHI (0–1)" value={latest.hhi == null ? '—' : latest.hhi.toFixed(3)} />
          <Metric label="Top-5 Share" value={formatPct(latest.top5)} />
          <Metric label="Top-10 Share" value={formatPct(latest.top10)} />
        </div>
      )}

      <div style={{ width: '100%', height: CHART_HEIGHTS.standard }}>
        <MacroChartContainer height="fill">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
            <XAxis dataKey="fy" {...DEFAULT_XAXIS_PROPS} />
            <YAxis
              yAxisId="share"
              {...DEFAULT_YAXIS_PROPS}
              domain={[0, 1]}
              tickFormatter={(v) => formatPct(Number(v), 0)}
              width={48}
            />
            <YAxis
              yAxisId="hhi"
              orientation="right"
              {...DEFAULT_YAXIS_PROPS}
              domain={[0, 'auto']}
              tickFormatter={(v) => Number(v).toFixed(2)}
              width={40}
            />
            <Tooltip
              labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
              itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
              contentStyle={DEFAULT_TOOLTIP_STYLE}
              formatter={(value: number, name: string) => {
                if (name === 'HHI') return [value?.toFixed?.(3) ?? value, name];
                return [formatPct(value), name];
              }}
              labelFormatter={(l) => `FY${l}`}
            />
            <Legend {...DEFAULT_LEGEND_PROPS} />
            <Line
              yAxisId="share"
              type="monotone"
              dataKey="top5"
              name="Top-5 Share"
              stroke={CHART_COLORS.west}
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              yAxisId="share"
              type="monotone"
              dataKey="top10"
              name="Top-10 Share"
              stroke={CHART_COLORS.violet}
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              yAxisId="hhi"
              type="monotone"
              dataKey="hhi"
              name="HHI"
              stroke={CHART_COLORS.gold}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          </LineChart>
        </MacroChartContainer>
      </div>
    </section>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 rounded-lg border border-border bg-background/20">
    <div className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">
      {label}
    </div>
    <div className="text-lg font-bold font-mono text-white tabular-nums mt-0.5">{value}</div>
  </div>
);

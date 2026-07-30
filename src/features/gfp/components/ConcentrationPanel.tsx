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
} from '@/constants/chartDefaults';
import { GfpBasisBadge, GfpLoadingState, GfpUnavailableState } from './GfpEmptyState';

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
    <section className="space-y-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">
            Net Cost Concentration
          </h3>
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-1">
            HHI (0–1) · top-5 / top-10 share of agency net cost
          </p>
        </div>
        <GfpBasisBadge basis="accrual" />
      </div>
      <p className="text-[10px] text-muted-foreground/40">{GFP_BASIS.accrual}</p>

      {latest && (
        <div className="grid grid-cols-3 gap-3">
          <Metric label="HHI (0–1)" value={latest.hhi == null ? '—' : latest.hhi.toFixed(3)} />
          <Metric label="Top-5 Share" value={formatPct(latest.top5)} />
          <Metric label="Top-10 Share" value={formatPct(latest.top10)} />
        </div>
      )}

      <div style={{ width: '100%', height: CHART_HEIGHTS.standard }}>
        <ResponsiveContainer>
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
              stroke="#22d3ee"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              yAxisId="share"
              type="monotone"
              dataKey="top10"
              name="Top-10 Share"
              stroke="#a78bfa"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              yAxisId="hhi"
              type="monotone"
              dataKey="hhi"
              name="HHI"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 rounded-lg border border-white/5 bg-black/20">
    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
      {label}
    </div>
    <div className="text-lg font-black font-mono text-white tabular-nums mt-0.5">{value}</div>
  </div>
);

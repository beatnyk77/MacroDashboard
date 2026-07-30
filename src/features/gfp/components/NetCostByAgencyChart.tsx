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
import { useGfpNetCost } from '@/hooks/useGfpNetCost';
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
import { gfpSeriesColor } from './gfpChartColors';

function shortAgency(name: string): string {
  if (name.length <= 28) return name;
  return `${name.slice(0, 26)}…`;
}

export const NetCostByAgencyChart: React.FC = () => {
  const { data, isLoading, error } = useGfpNetCost();

  const { chartData, agencies } = useMemo(() => {
    const rows = (data ?? []).filter((r) => !r.is_total_row && r.net_cost_bil != null);
    if (!rows.length) return { chartData: [] as Record<string, number | string>[], agencies: [] as string[] };

    const latestFy = Math.max(...rows.map((r) => r.stmt_fiscal_year));
    const latest = rows.filter((r) => r.stmt_fiscal_year === latestFy);
    const top8 = [...latest]
      .sort((a, b) => Math.abs(b.net_cost_bil ?? 0) - Math.abs(a.net_cost_bil ?? 0))
      .slice(0, 8)
      .map((r) => r.agency_nm);

    const byFy = new Map<number, Record<string, number | string>>();
    for (const r of rows) {
      if (!top8.includes(r.agency_nm)) continue;
      const point = byFy.get(r.stmt_fiscal_year) ?? { fy: r.stmt_fiscal_year };
      point[r.agency_nm] = r.net_cost_bil ?? 0;
      byFy.set(r.stmt_fiscal_year, point);
    }

    return {
      chartData: [...byFy.values()].sort((a, b) => Number(a.fy) - Number(b.fy)),
      agencies: top8,
    };
  }, [data]);

  if (isLoading) return <GfpLoadingState />;
  if (error || !chartData.length) return <GfpUnavailableState />;

  return (
    <section className="space-y-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">
            Net Cost by Agency
          </h3>
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-1">
            Top 8 agencies · latest FY ranking · multi-year lines
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
              formatter={(value: number, name: string) => [formatBillions(value), shortAgency(name)]}
              labelFormatter={(l) => `FY${l}`}
            />
            <Legend
              {...DEFAULT_LEGEND_PROPS}
              formatter={(value) => shortAgency(String(value))}
            />
            {agencies.map((agency, i) => (
              <Line
                key={agency}
                type="monotone"
                dataKey={agency}
                stroke={gfpSeriesColor(i)}
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

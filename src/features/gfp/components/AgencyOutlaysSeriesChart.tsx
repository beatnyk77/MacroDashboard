import React, { useMemo, useState } from 'react';
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
import { useGfpMtsOutlays } from '@/hooks/useGfpMtsOutlays';
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

const MAX_SERIES = 6;

export const AgencyOutlaysSeriesChart: React.FC = () => {
  const { data, isLoading, error } = useGfpMtsOutlays();
  /** null = use default top-5; array once user toggles */
  const [selectedOverride, setSelectedOverride] = useState<string[] | null>(null);

  const topAgencies = useMemo(() => {
    const rank = data?.rank ?? [];
    return rank
      .slice()
      .sort((a, b) => a.rnk - b.rnk)
      .slice(0, 12)
      .map((r) => r.classification_desc)
      .filter(Boolean);
  }, [data]);

  const selected = selectedOverride ?? topAgencies.slice(0, 5);

  const chartData = useMemo(() => {
    const monthly = data?.monthly ?? [];
    if (!monthly.length || !selected.length) return [];

    const byDate = new Map<string, Record<string, number | string>>();
    for (const row of monthly) {
      const name = row.classification_desc;
      if (!name || !selected.includes(name)) continue;
      const point = byDate.get(row.record_date) ?? { date: row.record_date };
      // Prefer monthly net outlay; fall back to FYTD if month is null
      point[name] = row.current_month_net_outly ?? row.current_fytd_net_outly ?? 0;
      byDate.set(row.record_date, point);
    }
    return [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [data, selected]);

  const toggle = (name: string) => {
    setSelectedOverride((prev) => {
      const base = prev ?? topAgencies.slice(0, 5);
      if (base.includes(name)) return base.filter((n) => n !== name);
      if (base.length >= MAX_SERIES) return base;
      return [...base, name];
    });
  };

  if (isLoading) return <GfpLoadingState />;
  if (error || !topAgencies.length) return <GfpUnavailableState />;

  return (
    <section className="space-y-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">
            Agency Outlays Series
          </h3>
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-1">
            Monthly cash outlays · select up to {MAX_SERIES} agencies
          </p>
        </div>
        <GfpBasisBadge basis="cash" />
      </div>
      <p className="text-[10px] text-muted-foreground/40">{GFP_BASIS.cash}</p>

      <div className="flex flex-wrap gap-1.5">
        {topAgencies.map((name) => {
          const on = selected.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border transition-colors ${
                on
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                  : 'border-white/10 text-muted-foreground/60 hover:border-white/20'
              }`}
              title={name}
            >
              {name.length > 32 ? `${name.slice(0, 30)}…` : name}
            </button>
          );
        })}
      </div>

      {!chartData.length ? (
        <GfpUnavailableState message="No monthly series for selected agencies." />
      ) : (
        <div style={{ width: '100%', height: CHART_HEIGHTS.standard }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
              <XAxis
                dataKey="date"
                {...DEFAULT_XAXIS_PROPS}
                tickFormatter={(d) => {
                  const t = Date.parse(String(d));
                  if (!Number.isFinite(t)) return String(d);
                  return new Date(t).toLocaleDateString('en-US', {
                    year: '2-digit',
                    month: 'short',
                  });
                }}
              />
              <YAxis
                {...DEFAULT_YAXIS_PROPS}
                tickFormatter={(v) => formatBillions(Number(v), 0)}
                width={56}
              />
              <Tooltip
                contentStyle={DEFAULT_TOOLTIP_STYLE}
                formatter={(value: number, name: string) => [
                  formatBillions(value),
                  name.length > 40 ? `${name.slice(0, 38)}…` : name,
                ]}
              />
              <Legend
                {...DEFAULT_LEGEND_PROPS}
                formatter={(v) => (String(v).length > 24 ? `${String(v).slice(0, 22)}…` : String(v))}
              />
              {selected.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={gfpSeriesColor(i)}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};

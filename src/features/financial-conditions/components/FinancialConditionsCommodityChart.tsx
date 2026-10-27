import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS } from '@/constants/chartDefaults';
import { cn } from '@/lib/utils';
import type { FCIPoint } from '../lib/fciMath';
import { TOOLTIP_SHELL_CLASS } from '@/components/charts/chartTooltipFormat';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

interface FinancialConditionsCommodityChartProps {
  data: FCIPoint[];
  className?: string;
}

type TimeRange = 'ALL' | '10Y' | '5Y' | '2Y';

export const FinancialConditionsCommodityChart: React.FC<FinancialConditionsCommodityChartProps> = ({
  data,
  className,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (timeRange === 'ALL') return data;

    const now = new Date(data[data.length - 1].date).getTime();
    let yearsBack = 20;
    if (timeRange === '10Y') yearsBack = 10;
    if (timeRange === '5Y') yearsBack = 5;
    if (timeRange === '2Y') yearsBack = 2;

    const cutoff = now - yearsBack * 365.25 * 24 * 60 * 60 * 1000;
    return data.filter((d) => new Date(d.date).getTime() >= cutoff);
  }, [data, timeRange]);

  const latest = data[data.length - 1];

  const formatDateTick = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = d.toLocaleString('en-US', { month: 'short' });
      return `${month} '${String(year).slice(2)}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className={cn(
        'relative bg-card/90 backdrop-blur-xl border border-border rounded-xl p-5 sm:p-6 shadow-2xl space-y-6',
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <h3 className="text-base sm:text-lg font-semibold uppercase tracking-wider text-foreground">
              Global Financial Conditions Index vs. Commodities Cycle
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Standardized multi-year rolling Z-score YoY (2006–Present). Barclays FCI model vs. broad commodity momentum.
          </p>
        </div>

        {/* Range Selector & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg bg-muted/60 p-0.5 border border-border text-[11px] font-mono font-bold">
            {(['ALL', '10Y', '5Y', '2Y'] as TimeRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={cn(
                  'px-2.5 py-1 rounded transition-all',
                  timeRange === r
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {r === 'ALL' ? '2006+' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-orange-500 rounded" />
              Global FCI
            </span>
            <span className="text-[11px] uppercase font-semibold text-orange-400">Barclays</span>
          </div>
          <div className="text-lg font-bold text-foreground tabular-nums">
            {latest ? (latest.fci > 0 ? `+${latest.fci.toFixed(2)}` : latest.fci.toFixed(2)) : '—'}
            <span className="text-[11px] text-muted-foreground ml-1">σ</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {latest && latest.fci > 0 ? 'Restrictive / Tight' : 'Accommodative / Loose'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-sky-600 rounded" />
              Commodities Cycle
            </span>
            <span className="text-[11px] uppercase font-semibold text-blue-400">IMF All Comm</span>
          </div>
          <div className="text-lg font-bold text-foreground tabular-nums">
            {latest ? (latest.commodityCycle > 0 ? `+${latest.commodityCycle.toFixed(2)}` : latest.commodityCycle.toFixed(2)) : '—'}
            <span className="text-[11px] text-muted-foreground ml-1">σ</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {latest && latest.commodityCycle > 0 ? 'Expansionary Cost Shock' : 'Disinflationary Drag'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
          <div className="text-muted-foreground text-[11px]">FCI vs. Commodity Lead</div>
          <div className="text-lg font-bold text-foreground tabular-nums">
            {latest ? `${(latest.fci - latest.commodityCycle).toFixed(2)}` : '—'}
            <span className="text-[11px] text-muted-foreground ml-1">Δσ</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {latest && latest.fci > latest.commodityCycle ? 'FCI Ahead of Commodities' : 'Commodities Leading FCI'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
          <div className="text-muted-foreground text-[11px]">Historical Horizon</div>
          <div className="text-lg font-bold text-foreground">
            2006 – 2026
          </div>
          <div className="text-[11px] text-muted-foreground">
            20Y Multi-Cycle Window
          </div>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <MacroChartContainer height={CHART_HEIGHTS.tall} className="sm:h-[420px] pt-2">
          <LineChart data={filteredData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} opacity={0.3} vertical={false} />

            <XAxis
              {...DEFAULT_XAXIS_PROPS}
              dataKey="date"
              tickFormatter={formatDateTick}
              stroke={CHART_COLORS.tick}
              minTickGap={40}
            />

            <YAxis
              {...DEFAULT_YAXIS_PROPS}
              width={60}
              domain={[-1.5, 1.5]}
              ticks={[-1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5]}
              stroke={CHART_COLORS.tick}
              tickFormatter={(v) => v.toFixed(2)}
            />

            {/* Zero Neutral Baseline */}
            <ReferenceLine
              y={0}
              stroke={CHART_COLORS.tick}
              strokeDasharray="4 4"
              strokeWidth={1.2}
              label={{
                value: 'NEUTRAL (0.00σ)',
                position: 'insideBottomRight',
                fill: CHART_COLORS.tick,
                fontSize: 11,
                fontFamily: 'Fira Code, monospace',
              }}
            />

            {/* Restrictive & Accommodative Zone Markers */}
            <ReferenceLine
              y={1.0}
              stroke={CHART_COLORS.orange}
              strokeDasharray="2 2"
              strokeOpacity={0.4}
              label={{
                value: '+1.0σ RESTRICTIVE',
                position: 'insideTopLeft',
                fill: CHART_COLORS.orange,
                fontSize: 11,
                fontFamily: 'Fira Code, monospace',
              }}
            />
            <ReferenceLine
              y={-1.0}
              stroke={CHART_COLORS.west}
              strokeDasharray="2 2"
              strokeOpacity={0.4}
              label={{
                value: '-1.0σ ACCOMMODATIVE',
                position: 'insideBottomLeft',
                fill: CHART_COLORS.west,
                fontSize: 11,
                fontFamily: 'Fira Code, monospace',
              }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload as FCIPoint;
                return (
                  <div className={`${TOOLTIP_SHELL_CLASS} min-w-[220px]`}>
                    <div className="text-[11px] font-bold text-slate-400 border-b border-white/10/50 pb-1 flex items-center justify-between">
                      <span>{pt.date}</span>
                      <span className="text-[11px] text-primary">QUARTILE DATA</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-orange-400 font-bold">
                          <span className="w-2.5 h-0.5 bg-orange-500 rounded" />
                          Global FCI:
                        </span>
                        <span className="font-semibold text-slate-100 tabular-nums">
                          {pt.fci > 0 ? `+${pt.fci.toFixed(2)}` : pt.fci.toFixed(2)}σ
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                          <span className="w-2.5 h-0.5 bg-blue-500 rounded" />
                          Commodities Cycle:
                        </span>
                        <span className="font-semibold text-slate-100 tabular-nums">
                          {pt.commodityCycle > 0 ? `+${pt.commodityCycle.toFixed(2)}` : pt.commodityCycle.toFixed(2)}σ
                        </span>
                      </div>

                      <div className="border-t border-white/10/40 pt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Transmission State:</span>
                        <span className="text-slate-100 font-semibold">
                          {pt.commodityCycle > 0.3 && pt.fci > 0.2
                            ? 'Commodity Tightening'
                            : pt.commodityCycle < -0.3 && pt.fci < -0.2
                            ? 'Disinflation Easing'
                            : 'Cross-Currents'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            {/* Global FCI (Orange Line) */}
            <Line
              type="monotone"
              dataKey="fci"
              name="Global FCI"
              stroke={CHART_COLORS.orange}
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 5, fill: CHART_COLORS.orange, stroke: CHART_COLORS.white, strokeWidth: 2 }}
            />

            {/* Commodities Cycle (Blue Line) */}
            <Line
              type="monotone"
              dataKey="commodityCycle"
              name="Commodities Cycle"
              stroke={CHART_COLORS.westDeep}
              strokeWidth={2.6}
              dot={false}
              activeDot={{ r: 5, fill: CHART_COLORS.westDeep, stroke: CHART_COLORS.white, strokeWidth: 2 }}
            />
          </LineChart>
      </MacroChartContainer>

      {/* Chart Legend / Footnote */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-[11px] font-mono text-muted-foreground border-t border-border">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-orange-500 rounded" />
            <span className="text-foreground font-bold">Global FCI (Barclays Model)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-sky-600 rounded" />
            <span className="text-foreground font-bold">Commodities Cycle (IMF Broad)</span>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground">
          Source: St. Louis Fed (FRED), Barclays Capital, GraphiQuestor Research
        </div>
      </div>
    </div>
  );
};

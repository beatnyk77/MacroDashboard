import React from 'react';
import { useFinancialConditions } from '@/hooks/useFinancialConditions';
import { TrailLink as Link } from '@/components/TrailLink';
import { Flame, ArrowUpRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TOOLTIP_SHELL_CLASS } from '@/components/charts/chartTooltipFormat';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';
import { CHART_HEIGHTS, CHART_COLORS } from '@/constants/chartDefaults';

export const FinancialConditionsCard: React.FC<{ className?: string }> = ({ className }) => {
  const { data, isLoading } = useFinancialConditions();

  if (isLoading || !data) {
    return (
      <div className="h-64 rounded-xl border border-border bg-card/40 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
          <Activity className="animate-spin text-primary" size={14} />
          Loading FCI Telemetry...
        </div>
      </div>
    );
  }

  const { history, current, regime } = data;
  // Recent 3 years for mini card chart
  const recentHistory = history.slice(-14);

  return (
    <div
      className={cn(
        'group relative bg-card/90 backdrop-blur-xl border border-border hover:border-border transition-all rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame size={14} />
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Financial Conditions vs. Commodity Impulse
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Barclays model tracking mechanical transmission from commodity cycles to macro rates.
          </p>
        </div>

        <div className={cn('text-[11px] font-mono font-bold px-2 py-0.5 rounded border', regime.badgeColor)}>
          {regime.title}
        </div>
      </div>

      {/* Primary KPI row */}
      <div className="grid grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/20 space-y-0.5">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-0.5 bg-orange-500 rounded" />
            Global FCI
          </div>
          <div className="text-base font-bold text-foreground tabular-nums">
            {current.fci > 0 ? `+${current.fci.toFixed(2)}` : current.fci.toFixed(2)}σ
          </div>
          <div className="text-[11px] text-muted-foreground">
            {current.fci > 0 ? 'Tightening' : 'Easing'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-0.5">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-0.5 bg-sky-600 rounded" />
            Commodity Cycle
          </div>
          <div className="text-base font-bold text-foreground tabular-nums">
            {current.commodityCycle > 0 ? `+${current.commodityCycle.toFixed(2)}` : current.commodityCycle.toFixed(2)}σ
          </div>
          <div className="text-[11px] text-muted-foreground">
            {current.commodityCycle > 0 ? 'Cost Impulse' : 'Disinflation'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/40 border border-border space-y-0.5">
          <div className="text-[11px] text-muted-foreground">Lead / Lag</div>
          <div className="text-base font-bold text-foreground tabular-nums">
            {(current.fci - current.commodityCycle).toFixed(2)}Δσ
          </div>
          <div className="text-[11px] text-muted-foreground">
            {current.fci > current.commodityCycle ? 'FCI Premium' : 'Commodity Push'}
          </div>
        </div>
      </div>

      {/* Mini Sparkline Chart */}
      <MacroChartContainer height={CHART_HEIGHTS.compact}>
          <LineChart data={recentHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis domain={[-1.2, 1.2]} hide />
            <ReferenceLine y={0} stroke={CHART_COLORS.slate} strokeDasharray="3 3" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload;
                return (
                  <div className={TOOLTIP_SHELL_CLASS}>
                    <div className="text-slate-400">{pt.date}</div>
                    <div className="text-orange-400 font-bold">FCI: {pt.fci}σ</div>
                    <div className="text-blue-400 font-bold">Comm: {pt.commodityCycle}σ</div>
                  </div>
                );
              }}
            />
            <Line type="monotone" dataKey="fci" stroke={CHART_COLORS.orange} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="commodityCycle" stroke={CHART_COLORS.westDeep} strokeWidth={2} dot={false} />
          </LineChart>
      </MacroChartContainer>

      {/* Card Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
        <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-orange-500 rounded" /> FCI
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-sky-600 rounded" /> Commodities
          </span>
        </div>

        <Link
          to="/labs/financial-conditions/"
          className="text-primary hover:text-primary/80 font-mono text-xs font-bold inline-flex items-center gap-1 transition-colors"
        >
          Open 20Y Observatory
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
};

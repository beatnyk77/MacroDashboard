import React from 'react';
import { useFinancialConditions } from '@/hooks/useFinancialConditions';
import { TrailLink as Link } from '@/components/TrailLink';
import { Flame, ArrowUpRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

export const FinancialConditionsCard: React.FC<{ className?: string }> = ({ className }) => {
  const { data, isLoading } = useFinancialConditions();

  if (isLoading || !data) {
    return (
      <div className="h-64 rounded-2xl border border-border/50 bg-card/40 flex items-center justify-center">
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
        'group relative bg-[#0a0f1d]/90 backdrop-blur-xl border border-border/60 hover:border-border transition-all rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame size={14} />
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
              Financial Conditions vs. Commodity Impulse
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Barclays model tracking mechanical transmission from commodity cycles to macro rates.
          </p>
        </div>

        <div className={cn('text-[10px] font-mono font-bold px-2 py-0.5 rounded border', regime.badgeColor)}>
          {regime.title}
        </div>
      </div>

      {/* Primary KPI row */}
      <div className="grid grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/20 space-y-0.5">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[#f97316] rounded" />
            Global FCI
          </div>
          <div className="text-base font-black text-foreground tabular-nums">
            {current.fci > 0 ? `+${current.fci.toFixed(2)}` : current.fci.toFixed(2)}σ
          </div>
          <div className="text-[9px] text-muted-foreground">
            {current.fci > 0 ? 'Tightening' : 'Easing'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-0.5">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[#0284c7] rounded" />
            Commodity Cycle
          </div>
          <div className="text-base font-black text-foreground tabular-nums">
            {current.commodityCycle > 0 ? `+${current.commodityCycle.toFixed(2)}` : current.commodityCycle.toFixed(2)}σ
          </div>
          <div className="text-[9px] text-muted-foreground">
            {current.commodityCycle > 0 ? 'Cost Impulse' : 'Disinflation'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 space-y-0.5">
          <div className="text-[10px] text-muted-foreground">Lead / Lag</div>
          <div className="text-base font-black text-foreground tabular-nums">
            {(current.fci - current.commodityCycle).toFixed(2)}Δσ
          </div>
          <div className="text-[9px] text-muted-foreground">
            {current.fci > current.commodityCycle ? 'FCI Premium' : 'Commodity Push'}
          </div>
        </div>
      </div>

      {/* Mini Sparkline Chart */}
      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={recentHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis domain={[-1.2, 1.2]} hide />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload;
                return (
                  <div className="bg-slate-900 border border-border p-2 rounded text-[10px] font-mono shadow-xl">
                    <div className="text-muted-foreground">{pt.date}</div>
                    <div className="text-orange-400 font-bold">FCI: {pt.fci}σ</div>
                    <div className="text-blue-400 font-bold">Comm: {pt.commodityCycle}σ</div>
                  </div>
                );
              }}
            />
            <Line type="monotone" dataKey="fci" stroke="#f97316" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="commodityCycle" stroke="#0284c7" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[#f97316] rounded" /> FCI
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[#0284c7] rounded" /> Commodities
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

import React from 'react';
import { cn } from '@/lib/utils';
import type { FCIComponentDetail } from '@/hooks/useFinancialConditions';
import { ShieldAlert, TrendingUp, DollarSign, Activity, BarChart3 } from 'lucide-react';

interface FCIComponentBreakdownProps {
  components: FCIComponentDetail[];
  className?: string;
}

export const FCIComponentBreakdown: React.FC<FCIComponentBreakdownProps> = ({
  components,
  className,
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'cs':
        return <ShieldAlert size={16} className="text-amber-400" />;
      case 'r10y':
        return <TrendingUp size={16} className="text-rose-400" />;
      case 'slope':
        return <BarChart3 size={16} className="text-cyan-400" />;
      case 'fx':
        return <DollarSign size={16} className="text-emerald-400" />;
      case 'equity':
        return <Activity size={16} className="text-purple-400" />;
      default:
        return <BarChart3 size={16} className="text-muted-foreground" />;
    }
  };

  return (
    <div className={cn('bg-[#0a0f1d]/90 backdrop-blur-xl border border-border/60 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-4">
        <div>
          <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-foreground">
            5-Pillar Transmission Decomposition
          </h3>
          <p className="text-xs text-muted-foreground">
            Equal-weighted (20% each) rolling YoY Z-scores feeding into the Barclays FCI model.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            + Tightening
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            - Easing
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((comp) => {
          const isTightening = comp.direction === 'tightening';
          const isEasing = comp.direction === 'easing';
          const maxZ = 2.0;
          const pctWidth = Math.min(Math.abs(comp.zScore) / maxZ, 1) * 100;

          return (
            <div
              key={comp.id}
              className="p-4 rounded-xl bg-card/60 border border-border/50 hover:border-border transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-muted/60 border border-border/60">
                      {getIcon(comp.id)}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                      {comp.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
                    {comp.ticker}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {comp.description}
                </p>
              </div>

              {/* Z-Score & Contribution Bar */}
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Rolling Z-Score:</span>
                  <span
                    className={cn(
                      'font-black tabular-nums',
                      isTightening ? 'text-rose-400' : isEasing ? 'text-emerald-400' : 'text-slate-300'
                    )}
                  >
                    {comp.zScore > 0 ? `+${comp.zScore.toFixed(2)}` : comp.zScore.toFixed(2)}σ
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>FCI Contribution (20%):</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {comp.contribution > 0 ? `+${comp.contribution.toFixed(2)}` : comp.contribution.toFixed(2)}σ
                  </span>
                </div>

                {/* Visual Contribution Bar */}
                <div className="w-full h-1.5 rounded-full bg-muted/70 overflow-hidden relative">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isTightening ? 'bg-rose-500' : isEasing ? 'bg-emerald-500' : 'bg-slate-400'
                    )}
                    style={{ width: `${pctWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { Activity, Gauge, Shield, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NotebookRegime, RegimeLabel } from '@/features/regime-digest/lib/types';

export interface RegimeStripProps {
  regime: NotebookRegime;
}

const REGIME_UI: Record<
  RegimeLabel,
  { label: string; icon: React.ReactNode; className: string }
> = {
  RISK_ON: {
    label: 'Risk On',
    icon: <Activity size={14} aria-hidden />,
    className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  NEUTRAL: {
    label: 'Neutral',
    icon: <Gauge size={14} aria-hidden />,
    className: 'text-slate-300 border-slate-500/30 bg-slate-500/10',
  },
  RISK_OFF: {
    label: 'Risk Off',
    icon: <Shield size={14} aria-hidden />,
    className: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  },
};

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
        {icon}
        {label}
      </span>
      <span className="text-sm font-black text-white tabular-nums tracking-tight">{value}</span>
    </div>
  );
}

export const RegimeStrip: React.FC<RegimeStripProps> = ({ regime }) => {
  const ui = REGIME_UI[regime.label] ?? REGIME_UI.NEUTRAL;
  const confidence =
    regime.confidence != null ? `${Math.round(regime.confidence)}%` : '—';
  const days =
    regime.daysInRegime != null ? `${regime.daysInRegime}d` : '—';
  const score =
    regime.compositeScore != null ? regime.compositeScore.toFixed(0) : '—';

  return (
    <section
      className="rounded-xl border border-white/10 bg-slate-950/60 backdrop-blur-xl p-5 md:p-6"
      aria-label={`Current regime: ${ui.label}`}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div
          className={cn(
            'inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest',
            ui.className,
          )}
        >
          {ui.icon}
          <span>{ui.label}</span>
          <span className="sr-only">regime</span>
        </div>

        <div className="grid grid-cols-3 gap-6 flex-1">
          <Stat
            icon={<Gauge size={10} aria-hidden />}
            label="Confidence"
            value={confidence}
          />
          <Stat
            icon={<Timer size={10} aria-hidden />}
            label="Days in regime"
            value={days}
          />
          <Stat
            icon={<Activity size={10} aria-hidden />}
            label="Composite"
            value={score}
          />
        </div>
      </div>
    </section>
  );
};

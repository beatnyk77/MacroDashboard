import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  ShieldOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NotebookPayload, QualityOverall } from '@/features/regime-digest/lib/types';

export interface QualityFooterProps {
  quality: NotebookPayload['quality'];
  asOf: string | null;
}

const OVERALL_UI: Record<
  QualityOverall,
  { label: string; icon: React.ReactNode; className: string }
> = {
  ok: {
    label: 'OK',
    icon: <CheckCircle2 size={12} aria-hidden />,
    className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  partial: {
    label: 'Partial',
    icon: <AlertTriangle size={12} aria-hidden />,
    className: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  blocked: {
    label: 'Blocked',
    icon: <ShieldOff size={12} aria-hidden />,
    className: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  },
};

function CountPill({
  icon,
  label,
  count,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  className: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold',
        className,
      )}
    >
      {icon}
      <span>{label}</span>
      <span className="font-mono tabular-nums">{count}</span>
    </span>
  );
}

export const QualityFooter: React.FC<QualityFooterProps> = ({ quality, asOf }) => {
  const overall = OVERALL_UI[quality.overall] ?? OVERALL_UI.partial;

  return (
    <footer
      className="rounded-xl border border-white/5 bg-white/[0.02] p-5 md:p-6 space-y-4"
      aria-label="Data quality"
    >
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/40">
            Data quality
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-black uppercase tracking-wider',
                overall.className,
              )}
            >
              {overall.icon}
              <span>{overall.label}</span>
            </span>
            {asOf && (
              <span className="text-[11px] text-muted-foreground/50">
                As of{' '}
                <span className="font-mono tabular-nums text-muted-foreground/70">{asOf}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <CountPill
          icon={<CheckCircle2 size={11} aria-hidden />}
          label="OK"
          count={quality.okCount}
          className="text-emerald-400/90 border-emerald-500/20 bg-emerald-500/5"
        />
        <CountPill
          icon={<Clock size={11} aria-hidden />}
          label="Stale"
          count={quality.staleCount}
          className="text-amber-400/90 border-amber-500/20 bg-amber-500/5"
        />
        <CountPill
          icon={<HelpCircle size={11} aria-hidden />}
          label="Missing"
          count={quality.missingCount}
          className="text-slate-400/90 border-slate-500/20 bg-slate-500/5"
        />
        <CountPill
          icon={<ShieldOff size={11} aria-hidden />}
          label="Withheld"
          count={quality.withheldCount}
          className="text-rose-400/90 border-rose-500/20 bg-rose-500/5"
        />
      </div>

      {quality.failedMetrics.length > 0 && (
        <p className="text-[11px] text-muted-foreground/45 leading-relaxed">
          <span className="font-bold text-muted-foreground/55">Withheld metrics: </span>
          <span className="font-mono tabular-nums">{quality.failedMetrics.join(', ')}</span>
        </p>
      )}
    </footer>
  );
};

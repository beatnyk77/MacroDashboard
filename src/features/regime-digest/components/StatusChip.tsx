import React from 'react';
import { CheckCircle2, Clock, HelpCircle, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetricStatus } from '@/features/regime-digest/lib/types';

const STATUS_UI: Record<
  MetricStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  ok: {
    label: 'OK',
    icon: <CheckCircle2 size={10} aria-hidden />,
    className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  stale: {
    label: 'Stale',
    icon: <Clock size={10} aria-hidden />,
    className: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  missing: {
    label: 'Missing',
    icon: <HelpCircle size={10} aria-hidden />,
    className: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
  },
  failed_validation: {
    label: 'Withheld',
    icon: <ShieldOff size={10} aria-hidden />,
    className: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  },
};

export interface StatusChipProps {
  status: MetricStatus;
  className?: string;
}

/** Metric status with icon + text (color is not the sole indicator). */
export const StatusChip: React.FC<StatusChipProps> = ({ status, className }) => {
  const ui = STATUS_UI[status] ?? STATUS_UI.missing;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider',
        ui.className,
        className,
      )}
      title={ui.label}
    >
      {ui.icon}
      <span>{ui.label}</span>
    </span>
  );
};

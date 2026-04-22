/**
 * OvernightChanges
 * Structured delta feed — only shows HIGH/MEDIUM significance changes.
 * Phase 2 component; renders nothing if no changes yet (Phase 1 safe).
 */

import React from 'react';
import type { DailyChange } from '../hooks/useDailyChanges';

interface OvernightChangesProps {
  changes: DailyChange[];
  isLoading?: boolean;
}

export const OvernightChanges: React.FC<OvernightChangesProps> = ({
  changes,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div
        className="rounded-xl p-4 animate-pulse"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="h-3 w-40 rounded bg-white/10 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (changes.length === 0) return null;

  const highChanges = changes.filter((c) => c.significance === 'HIGH');
  const medChanges = changes.filter((c) => c.significance === 'MEDIUM');

  return (
    <div
      className="rounded-xl p-4 mt-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[9px] font-black uppercase tracking-[0.35em]"
          style={{ color: 'rgba(148,163,184,0.5)' }}
        >
          What Changed Overnight
        </span>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}
        >
          {changes.length} signal{changes.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {highChanges.map((change) => (
          <ChangeRow key={change.metric_id} change={change} />
        ))}
        {medChanges.map((change) => (
          <ChangeRow key={change.metric_id} change={change} muted />
        ))}
      </div>
    </div>
  );
};

const ChangeRow: React.FC<{ change: DailyChange; muted?: boolean }> = ({
  change,
  muted,
}) => {
  const isUp = change.direction === 'UP';
  const color = isUp ? '#10b981' : '#f43f5e';
  const arrow = isUp ? '▲' : '▼';
  const pctStr = `${arrow} ${Math.abs(change.pct_delta).toFixed(2)}%`;

  return (
    <div
      className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors"
      style={{
        background: muted ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        opacity: muted ? 0.75 : 1,
      }}
    >
      {/* Signal badge */}
      {!muted && (
        <div
          className="mt-0.5 flex-shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}
        >
          HIGH
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-white/70 truncate">
            {change.metric_label}
          </span>
          <span
            className="text-[11px] font-black tabular-nums flex-shrink-0"
            style={{ color }}
          >
            {pctStr}
          </span>
        </div>
        {change.interpretation && (
          <p className="text-[10px] text-white/35 mt-0.5 leading-relaxed">
            {change.interpretation}
          </p>
        )}
      </div>
    </div>
  );
};

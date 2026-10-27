/**
 * OvernightChanges
 * Structured delta feed — only shows HIGH/MEDIUM significance changes.
 * Phase 2 component; renders nothing if no changes yet (Phase 1 safe).
 */

import React from 'react';
import type { DailyChange } from '../hooks/useDailyChanges';
import { CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';

interface OvernightChangesProps {
  changes: DailyChange[];
  isLoading?: boolean;
  refreshing?: boolean;
}

export const OvernightChanges: React.FC<OvernightChangesProps> = ({
  changes,
  isLoading,
  refreshing,
}) => {
  if (isLoading) {
    return (
      <div
        className={`rounded-xl p-4 animate-pulse ${refreshing ? 'opacity-40' : ''}`}
        style={{ background: WHITE_ALPHA.ghost, border: `1px solid ${WHITE_ALPHA.faint}` }}
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
        background: WHITE_ALPHA.ghost,
        border: `1px solid ${WHITE_ALPHA.faint}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: alpha(CHART_COLORS.label, 0.5) }}
        >
          What Changed Overnight
        </span>
        <div className="h-px flex-1" style={{ background: WHITE_ALPHA.ghost }} />
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: WHITE_ALPHA.faint, color: WHITE_ALPHA.dim }}
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

const ChangeRow: React.FC<{ change: DailyChange; muted?: boolean }> = React.memo(({
  change,
  muted,
}) => {
  const isUp = change.direction === 'UP';
  const color = isUp ? CHART_COLORS.expansion : CHART_COLORS.east;
  const arrow = isUp ? '▲' : '▼';
  const pctStr = `${arrow} ${Math.abs(change.pct_delta).toFixed(2)}%`;

  return (
    <div
      className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors"
      style={{
        background: muted ? WHITE_ALPHA.ghost : WHITE_ALPHA.ghost,
        border: `1px solid ${WHITE_ALPHA.faint}`,
        opacity: muted ? 0.75 : 1,
      }}
    >
      {/* Signal badge */}
      {!muted && (
        <div
          className="mt-0.5 flex-shrink-0 text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded"
          style={{ background: alpha(CHART_COLORS.east, 0.12), color: CHART_COLORS.east }}
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
            className="text-[11px] font-bold tabular-nums flex-shrink-0"
            style={{ color }}
          >
            {pctStr}
          </span>
        </div>
        {change.interpretation && (
          <p className="text-[11px] text-terminal-dim mt-0.5 leading-relaxed">
            {change.interpretation}
          </p>
        )}
      </div>
    </div>
  );
});

ChangeRow.displayName = 'ChangeRow';

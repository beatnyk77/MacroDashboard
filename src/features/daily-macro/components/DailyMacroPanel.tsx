/**
 * DailyMacroPanel
 * Top-level composite component for the Daily Macro Layer.
 * Placed once in Terminal.tsx before the Sovereign Compass section.
 *
 * Layout:
 *   Row 1: [RegimeOrb] [MacroBriefCard] [ContradictionAlert?]
 *   Row 2: [OvernightChanges?]
 */

import React from 'react';
import { useDailyMacroSignal } from '../hooks/useDailyMacroSignal';
import { useDailyChanges } from '../hooks/useDailyChanges';
import { useContradictions } from '../hooks/useContradictions';
import { RegimeOrb } from './RegimeOrb';
import { MacroBriefCard } from './MacroBriefCard';
import { OvernightChanges } from './OvernightChanges';
import { ContradictionAlert } from './ContradictionAlert';

// ─── Skeleton ──────────────────────────────────────────────────────────────

const PanelSkeleton = () => (
  <div
    className="rounded-2xl p-6 animate-pulse"
    style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    <div className="h-3 w-48 rounded bg-white/10 mb-6" />
    <div className="flex gap-4">
      <div className="w-[180px] h-[220px] rounded-2xl bg-white/5" />
      <div className="flex-1 h-[220px] rounded-2xl bg-white/5" />
      <div className="w-[200px] h-[220px] rounded-2xl bg-white/5" />
    </div>
  </div>
);

// ─── Inner (data ready) ────────────────────────────────────────────────────

const DailyMacroPanelInner: React.FC = () => {
  const { data: signal, isLoading: signalLoading } = useDailyMacroSignal();
  const { data: changes = [], isLoading: changesLoading } = useDailyChanges();
  const { data: contradictions = [] } = useContradictions();

  if (signalLoading || !signal) return <PanelSkeleton />;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(8,12,24,0.7)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-[9px] font-black uppercase tracking-[0.45em]"
            style={{ color: 'rgba(148,163,184,0.5)' }}
          >
            Daily Macro Signal
          </span>
          <div
            className="text-[9px] px-2 py-0.5 rounded-full font-bold"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            Rule-Based · Deterministic
          </div>
        </div>
        <div
          className="text-[9px] font-mono"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          {signal.signal_date}
        </div>
      </div>

      {/* Main content */}
      <div className="p-5">
        {/* Row 1: Orb + Brief + Contradictions */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Regime Orb */}
          <RegimeOrb
            regime={signal.regime}
            score={signal.score}
            confidence_pct={signal.confidence_pct}
            score_delta={signal.score_delta}
            regime_changed={signal.regime_changed}
          />

          {/* Morning Brief */}
          <MacroBriefCard signal={signal} />

          {/* Contradictions (Phase 2 — renders nothing if empty) */}
          {contradictions.length > 0 && (
            <div className="md:w-[220px] flex-shrink-0">
              <ContradictionAlert contradictions={contradictions} />
            </div>
          )}
        </div>

        {/* Row 2: Overnight Changes (Phase 2 — renders nothing if empty) */}
        <OvernightChanges changes={changes} isLoading={changesLoading} />
      </div>
    </div>
  );
};

// ─── Public export (with error boundary) ──────────────────────────────────

export const DailyMacroPanel: React.FC = () => {
  return <DailyMacroPanelInner />;
};

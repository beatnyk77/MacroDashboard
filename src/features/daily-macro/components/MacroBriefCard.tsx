/**
 * MacroBriefCard
 * 3–4 line morning brief. Displays regime_line, driver_line, watch_line, context_line.
 */

import React from 'react';
import { generateMacroBrief } from '../services/macroSignalEngine';
import type { DailySignalRow } from '../hooks/useDailyMacroSignal';

interface MacroBriefCardProps {
  signal: DailySignalRow;
}

export const MacroBriefCard: React.FC<MacroBriefCardProps> = ({ signal }) => {
  // Use pre-computed brief from DB, fall back to client-side generation
  const brief = (signal.regime_line && signal.driver_line && signal.watch_line)
    ? {
        regime_line: signal.regime_line,
        driver_line: signal.driver_line,
        watch_line: signal.watch_line,
        context_line: signal.context_line ?? '',
      }
    : generateMacroBrief(
        {
          regime: signal.regime,
          score: signal.score,
          confidence_pct: signal.confidence_pct,
          key_driver: signal.key_driver,
          watch_item: signal.watch_item,
          component_scores: signal.component_scores,
        },
        signal.score_delta
      );

  const lines = [
    brief.regime_line,
    brief.driver_line,
    brief.watch_line,
    brief.context_line,
  ].filter(Boolean) as string[];

  return (
    <div
      className="flex-1 rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-[10px] font-black uppercase tracking-[0.2em]"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Institutional Briefing
        </span>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="flex items-center gap-1.5 opacity-40">
          <div className="w-1 h-1 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-white font-mono uppercase tracking-tighter">
            System Normal
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {lines.map((line, i) => (
          <div
            key={i}
            className="text-[14px] font-medium leading-[1.6]"
            style={{
              color: i === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
              paddingLeft: i > 0 ? '0.75rem' : 0,
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              letterSpacing: '-0.01em',
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Component score mini-bars */}
      <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-3">
          Signal Components
        </div>
        <div className="space-y-1.5">
          {(Object.entries(signal.component_scores) as [string, number][]).map(([key, val]) => {
            const color =
              val >= 60 ? '#10b981' : val <= 40 ? '#f43f5e' : '#f59e0b';
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/40 w-16 uppercase tracking-wide">
                  {key}
                </span>
                <div
                  className="flex-1 h-1 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${val}%`, background: color }}
                  />
                </div>
                <span
                  className="text-[10px] font-bold tabular-nums w-7 text-right"
                  style={{ color }}
                >
                  {Math.round(val)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

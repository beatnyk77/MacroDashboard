import React from 'react';
import { generateMacroBrief } from '../services/macroSignalEngine';
import type { DailySignalRow } from '../hooks/useDailyMacroSignal';

interface MacroBriefCardProps {
  signal: DailySignalRow;
  refreshing?: boolean;
}

export const MacroBriefCard: React.FC<MacroBriefCardProps> = ({ signal, refreshing }) => {
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
      className={`flex-1 rounded-2xl p-6 transition-all duration-500 ${refreshing ? 'opacity-40 blur-[1px]' : 'opacity-100'}`}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02)',
      }}
    >
      <div className="flex items-center gap-2 mb-6">
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

      <div className="space-y-6">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`text-[15px] font-medium leading-relaxed tracking-tight ${i === 0 ? 'text-white/95' : 'text-white/60'}`}
            style={{
              paddingLeft: i > 0 ? '1rem' : 0,
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Component score mini-bars */}
      <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-4">
          Signal Components
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {(Object.entries(signal.component_scores) as [string, number][]).map(([key, val]) => {
            const color =
              val >= 60 ? '#10b981' : val <= 40 ? '#f43f5e' : '#f59e0b';
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[9px] font-black text-white/30 w-16 uppercase tracking-wider">
                  {key}
                </span>
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden relative"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
                    style={{ width: `${val}%`, background: color, boxShadow: `0 0 8px ${color}44` }}
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


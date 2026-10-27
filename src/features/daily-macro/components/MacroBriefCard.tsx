import React from 'react';
import { generateMacroBrief } from '../services/macroSignalEngine';
import type { DailySignalRow } from '../hooks/useDailyMacroSignal';
import { CHART_COLORS } from '@/constants/chartDefaults';
import { stripPictographs } from '@/utils/text';

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
  ].filter(Boolean).map((l) => stripPictographs(l as string));

  return (
    <div
      className={`flex-1 rounded-xl p-6 bg-card border border-border transition-all duration-500 shadow-none ${refreshing ? 'opacity-40 blur-[1px]' : 'opacity-100'}`}
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Institutional Briefing
        </span>
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-1.5 opacity-60">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-foreground font-mono uppercase tracking-tighter">
            System Normal
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`text-base font-medium leading-relaxed tracking-tight ${
              i === 0
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground border-l border-border pl-4'
            }`}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Component score mini-bars */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-4">
          Signal Components
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {(Object.entries(signal.component_scores) as [string, number][]).map(([key, val]) => {
            const color =
              val >= 60 ? CHART_COLORS.expansion : val <= 40 ? CHART_COLORS.east : CHART_COLORS.gold;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground w-16 uppercase tracking-wider">
                  {key}
                </span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden relative bg-white/10">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
                    style={{ width: `${val}%`, background: color }}
                  />
                </div>
                <span
                  className="text-[11px] font-bold tabular-nums w-7 text-right"
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


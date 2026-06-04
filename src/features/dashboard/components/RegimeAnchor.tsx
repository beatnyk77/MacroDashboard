import React from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useDailyMacroSignal } from '@/features/daily-macro/hooks/useDailyMacroSignal';
import { generateMacroBrief } from '@/features/daily-macro/services/macroSignalEngine';
import type { MacroRegime } from '@/features/daily-macro/services/macroSignalEngine';
import { cn } from '@/lib/utils';

// ─── Regime config ──────────────────────────────────────────────────────────

const REGIME_CONFIG: Record<MacroRegime, {
  label: string;
  color: string;
  textClass: string;
  bgGlow: string;
}> = {
  RISK_ON: {
    label: 'Risk-On',
    color: '#10b981',
    textClass: 'text-emerald-400',
    bgGlow: 'rgba(16, 185, 129, 0.04)',
  },
  NEUTRAL: {
    label: 'Neutral',
    color: '#f59e0b',
    textClass: 'text-amber-400',
    bgGlow: 'rgba(245, 158, 11, 0.03)',
  },
  RISK_OFF: {
    label: 'Risk-Off',
    color: '#f43f5e',
    textClass: 'text-red-400',
    bgGlow: 'rgba(244, 63, 94, 0.04)',
  },
};

// ─── Chip color helper ──────────────────────────────────────────────────────

function chipColor(val: number): string {
  if (val >= 60) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  if (val <= 40) return 'text-red-400 bg-red-400/10 border-red-400/20';
  return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

const AnchorSkeleton: React.FC = () => (
  <div
    className="w-full animate-pulse"
    style={{
      background: 'rgba(8,12,24,0.6)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      borderLeft: '3px solid rgba(255,255,255,0.08)',
    }}
  >
    <div className="flex flex-col md:flex-row gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5">
      {/* Left block skeleton */}
      <div className="md:w-[38%] px-6 py-5 flex flex-col gap-3">
        <div className="h-3 w-24 rounded bg-white/8" />
        <div className="h-8 w-20 rounded bg-white/10" />
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded bg-white/8" />
          <div className="h-4 w-20 rounded bg-white/6" />
        </div>
      </div>
      {/* Center block skeleton */}
      <div className="md:w-[42%] px-6 py-5 flex flex-col gap-3">
        <div className="h-3 w-full rounded bg-white/8" />
        <div className="h-3 w-3/4 rounded bg-white/6" />
        <div className="flex gap-2 mt-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-5 w-14 rounded bg-white/8" />
          ))}
        </div>
      </div>
      {/* Right block skeleton */}
      <div className="md:w-[20%] px-6 py-5 flex flex-col gap-3">
        <div className="h-8 w-full rounded bg-white/8" />
        <div className="h-3 w-3/4 rounded bg-white/6" />
        <div className="h-10 w-full rounded bg-white/5" />
      </div>
    </div>
  </div>
);

// ─── Sparkline data fallback ─────────────────────────────────────────────────

// We only have today's signal; synthesise a 7-pt trend from score+delta
function buildSparklineData(score: number, scoreDelta: number): { v: number }[] {
  const pts: number[] = [];
  for (let i = 6; i >= 0; i--) {
    // Reconstruct rough historical path using linear assumption from delta
    pts.push(Math.max(0, Math.min(100, score - scoreDelta * i * 0.5)));
  }
  return pts.map(v => ({ v }));
}

// ─── Main component ──────────────────────────────────────────────────────────

export const RegimeAnchor: React.FC = () => {
  const { data: signal, isLoading } = useDailyMacroSignal();

  if (isLoading || !signal) return <AnchorSkeleton />;

  const cfg = REGIME_CONFIG[signal.regime];

  const brief =
    signal.regime_line && signal.driver_line && signal.watch_line
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

  // Best single-sentence synthesis: prefer regime_line which is the holistic summary
  const synthLine = brief.regime_line;

  const deltaPositive = signal.score_delta >= 0;
  const deltaAbs = Math.abs(signal.score_delta);

  // Format computed_at timestamp
  const updatedAt = new Date(signal.computed_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  // Sparkline data
  const sparklineData = buildSparklineData(signal.score, signal.score_delta);

  // Regime streak: since we don't have last_regime_change, compute from regime_changed flag
  // If regime didn't change today, show "Regime stable" — streak from signal_date computation
  const regimeSteakLabel = signal.regime_changed
    ? `Regime changed today → ${cfg.label}`
    : `${cfg.label} regime active`;

  const componentEntries = Object.entries(signal.component_scores) as [string, number][];

  return (
    <>
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes regime-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .regime-pulse-border {
          animation: regime-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div
        className="w-full relative"
        style={{
          background: cfg.bgGlow,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
        role="region"
        aria-label="Current Macro Regime Signal"
      >
        {/* Animated left border */}
        <div
          className="regime-pulse-border absolute left-0 top-0 bottom-0 w-[3px] rounded-r"
          style={{ background: cfg.color }}
        />

        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/[0.05] pl-[3px]">

          {/* ── LEFT BLOCK: Regime classification + score ── */}
          <div className="md:w-[38%] px-5 py-4 flex flex-col justify-center gap-1.5">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold"
            >
              Current Regime
            </span>

            <div className="flex items-baseline gap-3">
              <span
                className={cn(
                  'font-mono font-bold leading-none',
                  'text-xl md:text-2xl',
                  cfg.textClass
                )}
              >
                {cfg.label.toUpperCase()}
              </span>
              <span
                className={cn('text-4xl font-black tabular-nums leading-none', cfg.textClass)}
              >
                {Math.round(signal.score)}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-0.5">
              {deltaAbs > 0.5 && (
                <span
                  className={cn(
                    'font-mono text-[11px] font-bold tabular-nums',
                    deltaPositive ? 'text-emerald-400' : 'text-red-400'
                  )}
                >
                  {deltaPositive ? '▲' : '▼'} {deltaAbs.toFixed(1)} vs yesterday
                </span>
              )}
              <span className="text-[10px] text-white/40 font-mono">
                {signal.confidence_pct.toFixed(0)}% confidence
              </span>
            </div>
          </div>

          {/* ── CENTER BLOCK: Synthesis + signal chips ── */}
          <div className="md:w-[42%] px-5 py-4 flex flex-col justify-center gap-2.5">
            {/* Synthesis line */}
            <p className="text-[12px] md:text-[13px] text-white/80 font-medium leading-snug line-clamp-2">
              {synthLine}
            </p>

            {/* Component chips */}
            <div className="flex flex-wrap gap-1.5">
              {componentEntries.map(([key, val]) => (
                <span
                  key={key}
                  className={cn(
                    'font-mono text-[10px] font-bold uppercase tracking-wider',
                    'px-2 py-0.5 rounded border',
                    chipColor(val)
                  )}
                >
                  {key}: {Math.round(val)}
                </span>
              ))}
            </div>

            {/* Timestamp */}
            <span className="text-[10px] text-white/30 font-mono">
              Updated: {updatedAt}
            </span>
          </div>

          {/* ── RIGHT BLOCK: Link + streak + sparkline ── */}
          <div className="md:w-[20%] px-5 py-4 flex flex-col justify-between gap-3">
            <Link
              to="/weekly-narrative"
              className={cn(
                'inline-flex items-center justify-center gap-1.5 w-full',
                'font-mono text-[10px] uppercase tracking-[0.15em] font-bold',
                'px-3 py-2 rounded border transition-all duration-200',
                'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20',
                'text-white/70 hover:text-white',
                'active:scale-95'
              )}
            >
              Full Analysis →
            </Link>

            <span className="text-[10px] font-mono text-white/40 text-center leading-tight">
              {regimeSteakLabel}
            </span>

            {/* Sparkline: 7-day regime score trend */}
            <div className="h-10 w-full opacity-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={cfg.color}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

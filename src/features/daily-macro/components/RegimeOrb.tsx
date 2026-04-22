/**
 * RegimeOrb
 * Animated regime badge + score gauge.
 * Purely presentational — receives data as props.
 */

import React from 'react';
import type { MacroRegime } from '../services/macroSignalEngine';

interface RegimeOrbProps {
  regime: MacroRegime;
  score: number;
  confidence_pct: number;
  score_delta: number;
  regime_changed: boolean;
}

const REGIME_CONFIG = {
  RISK_ON: {
    label: 'Risk-On',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.3)',
    glow: 'rgba(16, 185, 129, 0.15)',
    pulse: '#10b981',
  },
  NEUTRAL: {
    label: 'Neutral',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.3)',
    glow: 'rgba(245, 158, 11, 0.12)',
    pulse: '#f59e0b',
  },
  RISK_OFF: {
    label: 'Risk-Off',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.08)',
    border: 'rgba(244, 63, 94, 0.3)',
    glow: 'rgba(244, 63, 94, 0.15)',
    pulse: '#f43f5e',
  },
};

export const RegimeOrb: React.FC<RegimeOrbProps> = ({
  regime,
  score,
  confidence_pct,
  score_delta,
  regime_changed,
}) => {
  const cfg = REGIME_CONFIG[regime];
  const deltaPositive = score_delta > 0;
  const deltaAbs = Math.abs(score_delta);

  // SVG arc for score gauge (0–100 → 0–270°)
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = (score / 100) * 0.75; // 270° arc = 75% of circle

  return (
    <div
      className="relative flex flex-col items-center justify-center p-5 rounded-2xl"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 0 32px ${cfg.glow}`,
        minWidth: 180,
      }}
    >
      {/* Regime changed badge */}
      {regime_changed && (
        <div
          className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: cfg.color + '22', color: cfg.color, border: `1px solid ${cfg.border}` }}
        >
          FLIP
        </div>
      )}

      {/* SVG Gauge */}
      <div className="relative w-[120px] h-[120px]">
        <svg className="w-full h-full -rotate-[135deg]" viewBox="0 0 120 120">
          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round"
          />
          {/* Score arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={cfg.color}
            strokeWidth="8"
            strokeDasharray={`${circumference * arcFraction} ${circumference * (1 - arcFraction)}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-black tabular-nums leading-none"
            style={{ color: cfg.color }}
          >
            {Math.round(score)}
          </span>
          <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
            Score
          </span>
        </div>
      </div>

      {/* Regime label */}
      <div
        className="mt-2 text-sm font-black uppercase tracking-wider"
        style={{ color: cfg.color }}
      >
        {cfg.label}
      </div>

      {/* Confidence */}
      <div className="mt-1 text-xs text-white/50 font-semibold">
        {confidence_pct.toFixed(0)}% confidence
      </div>

      {/* Delta */}
      {deltaAbs > 0.5 && (
        <div
          className="mt-2 text-[11px] font-bold tabular-nums"
          style={{ color: deltaPositive ? '#10b981' : '#f43f5e' }}
        >
          {deltaPositive ? '▲' : '▼'} {deltaAbs.toFixed(1)} vs yesterday
        </div>
      )}

      {/* Animated pulse dot */}
      <div className="absolute top-3 left-3">
        <span
          className="relative flex h-2.5 w-2.5"
        >
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: cfg.pulse }}
          />
          <span
            className="relative inline-flex rounded-full h-2.5 w-2.5"
            style={{ background: cfg.pulse }}
          />
        </span>
      </div>
    </div>
  );
};

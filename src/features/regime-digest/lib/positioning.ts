// src/features/regime-digest/lib/positioning.ts
import type { RegimeLabel } from './types';

const MAP: Record<RegimeLabel, string[]> = {
  RISK_ON: [
    'Framework: growth/risk assets historically favored when liquidity and risk appetite improve.',
    'Watch crowding and late-cycle inflation surprises.',
    'Cross-check with net-liquidity direction before extending duration risk.',
  ],
  NEUTRAL: [
    'Framework: mixed signals — prefer barbell risk and tighter position sizing.',
    'Wait for confirmation from liquidity + dollar + vol before rotating hard.',
    'Use regime history: neutral months often precede decisive breaks.',
  ],
  RISK_OFF: [
    'Framework: defensive tilt — quality duration, cash buffers, and real assets (gold) often lead.',
    'Reduce reliance on crowded equity beta until liquidity stabilizes.',
    'Monitor USD and VIX for confirmation or false breakdown.',
  ],
};

export function positioningForRegime(label: RegimeLabel): string[] {
  return MAP[label] ?? MAP.NEUTRAL;
}

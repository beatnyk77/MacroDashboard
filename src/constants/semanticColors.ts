export const SemanticColors = {
  regime: {
    expansion:   { text: 'text-emerald-400', bg: 'bg-emerald-500/10',
                   border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
    recovery:    { text: 'text-emerald-400', bg: 'bg-emerald-500/10',
                   border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
    neutral:     { text: 'text-blue-400',    bg: 'bg-blue-500/10',
                   border: 'border-blue-500/20',    dot: 'bg-blue-500'    },
    tightening:  { text: 'text-rose-400',    bg: 'bg-rose-500/10',
                   border: 'border-rose-500/20',    dot: 'bg-rose-500'    },
    slowdown:    { text: 'text-amber-400',   bg: 'bg-amber-500/10',
                   border: 'border-amber-500/20',   dot: 'bg-amber-500'   },
    stagflation: { text: 'text-orange-400',  bg: 'bg-orange-500/10',
                   border: 'border-orange-500/20',  dot: 'bg-orange-500'  },
    stress:      { text: 'text-rose-500',    bg: 'bg-rose-500/15',
                   border: 'border-rose-500/30',    dot: 'bg-rose-600'    },
    deflation:   { text: 'text-purple-400',  bg: 'bg-purple-500/10',
                   border: 'border-purple-500/20',  dot: 'bg-purple-500'  },
  },
  direction: {
    up:      'text-emerald-400',
    down:    'text-rose-400',
    neutral: 'text-slate-400',
    alert:   'text-rose-500',
    warning: 'text-amber-400',
  },
  staleness: {
    fresh:       { text: 'text-emerald-400', bg: 'bg-emerald-500/10',
                   label: 'Live'        },
    lagged:      { text: 'text-amber-400',   bg: 'bg-amber-500/10',
                   label: 'Lagged'      },
    very_lagged: { text: 'text-rose-400',    bg: 'bg-rose-500/10',
                   label: 'Stale'       },
    offline:     { text: 'text-slate-500',   bg: 'bg-slate-500/10',
                   label: 'Unavailable' },
  },
  gqSignal: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  thresholds: {
    'us_10y_yield':           { low: 3.5, mid: 4.5, high: 5.5 },
    'us_cpi_yoy':             { low: 1.5, mid: 3.0, high: 4.5 },
    'india_cpi_yoy':          { low: 2.0, mid: 5.0, high: 6.5 },
    'india_rbi_rate':         { low: 4.0, mid: 6.0, high: 7.5 },
    'india_cd_ratio':         { low: 65,  mid: 78,  high: 85  },
    'sovereign_stress_score': { low: 30,  mid: 60,  high: 80  },
  },
  chart: {
    primary:   '#3b82f6',
    secondary: '#10b981',
    tertiary:  '#f59e0b',
    gridLine:  '#1e293b',
    axisText:  '#64748b',
    tooltip:   '#0f172a',
    series: [
      '#3b82f6','#10b981','#f59e0b',
      '#8b5cf6','#f43f5e','#06b6d4'
    ],
  },
} as const;

export type RegimeKey = keyof typeof SemanticColors.regime;

export function getRegimeColors(regimeLabel: string) {
  const l = regimeLabel?.toLowerCase() ?? '';
  if (l.includes('expansion') || l.includes('recovery'))
    return SemanticColors.regime.expansion;
  if (l.includes('stagflation')) return SemanticColors.regime.stagflation;
  if (l.includes('tightening'))  return SemanticColors.regime.tightening;
  if (l.includes('slowdown'))    return SemanticColors.regime.slowdown;
  if (l.includes('stress'))      return SemanticColors.regime.stress;
  if (l.includes('deflation'))   return SemanticColors.regime.deflation;
  return SemanticColors.regime.neutral;
}

export function getDirectionColor(
  value: number,
  prev: number
): string {
  if (value > prev) return SemanticColors.direction.up;
  if (value < prev) return SemanticColors.direction.down;
  return SemanticColors.direction.neutral;
}

export function getThresholdColor(
  metricId: string,
  value: number,
  direction: 'higher-is-worse' | 'higher-is-better' = 'higher-is-worse'
): string {
  const t = SemanticColors.thresholds[
    metricId as keyof typeof SemanticColors.thresholds
  ];
  if (!t) return SemanticColors.direction.neutral;
  if (direction === 'higher-is-worse') {
    if (value >= t.high) return SemanticColors.direction.alert;
    if (value >= t.mid)  return SemanticColors.direction.warning;
    return SemanticColors.direction.up;
  } else {
    if (value <= t.low)  return SemanticColors.direction.alert;
    if (value <= t.mid)  return SemanticColors.direction.warning;
    return SemanticColors.direction.up;
  }
}

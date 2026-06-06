import type { CSSProperties } from 'react';

export const DEFAULT_CARTESIAN_GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: '#1e293b',
  vertical: false,
} as const;

export const DEFAULT_XAXIS_PROPS = {
  tick: {
    fill: '#64748b',
    fontSize: 11,
    fontFamily: 'IBM Plex Mono, monospace'
  },
  axisLine: { stroke: 'transparent' },
  tickLine: { stroke: 'transparent' },
} as const;

export const DEFAULT_YAXIS_PROPS = {
  tick: {
    fill: '#64748b',
    fontSize: 11,
    fontFamily: 'IBM Plex Mono, monospace'
  },
  axisLine: { stroke: 'transparent' },
  tickLine: { stroke: 'transparent' },
  width: 48,
} as const;

export const DEFAULT_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '12px',
  fontFamily: 'IBM Plex Mono, monospace',
  color: '#f8fafc',
};

export const EVENT_REFERENCE_LINE_PROPS = {
  stroke: '#475569',
  strokeDasharray: '4 4',
  strokeWidth: 1,
  label: {
    fontSize: 10,
    fill: '#64748b',
    fontFamily: 'IBM Plex Mono, monospace'
  },
} as const;

export const DEFAULT_LEGEND_PROPS = {
  wrapperStyle: {
    fontSize: '11px',
    fontFamily: 'IBM Plex Mono, monospace',
    color: '#64748b'
  },
} as const;

// Standard Recharts responsive container height by use case
export const CHART_HEIGHTS = {
  sparkline: 40,
  compact:   120,
  standard:  240,
  tall:      360,
  hero:      480,
} as const;

import type { CSSProperties } from 'react';

export const DEFAULT_CARTESIAN_GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: 'hsl(var(--border))',
  vertical: false,
} as const;

export const DEFAULT_XAXIS_PROPS = {
  tick: {
    fill: 'hsl(var(--muted-foreground))',
    fontSize: 11,
    fontFamily: 'IBM Plex Mono, monospace'
  },
  axisLine: { stroke: 'transparent' },
  tickLine: { stroke: 'transparent' },
} as const;

export const DEFAULT_YAXIS_PROPS = {
  tick: {
    fill: 'hsl(var(--muted-foreground))',
    fontSize: 11,
    fontFamily: 'IBM Plex Mono, monospace'
  },
  axisLine: { stroke: 'transparent' },
  tickLine: { stroke: 'transparent' },
  width: 48,
} as const;

export const DEFAULT_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '12px',
  fontFamily: 'IBM Plex Mono, monospace',
  color: 'hsl(var(--popover-foreground))',
};

export const EVENT_REFERENCE_LINE_PROPS = {
  stroke: 'hsl(var(--border))',
  strokeDasharray: '4 4',
  strokeWidth: 1,
  label: {
    fontSize: 10,
    fill: 'hsl(var(--muted-foreground))',
    fontFamily: 'IBM Plex Mono, monospace'
  },
} as const;

export const DEFAULT_LEGEND_PROPS = {
  wrapperStyle: {
    fontSize: '11px',
    fontFamily: 'IBM Plex Mono, monospace',
    color: 'hsl(var(--muted-foreground))'
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

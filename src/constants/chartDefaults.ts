import type { CSSProperties } from 'react';

// Single source of truth for Recharts styling. Values mirror the terminal contract:
// Fira Code for every numeric readout, slate telemetry text, hairline white grid.
export const CHART_FONT_FAMILY = 'Fira Code, monospace';

export const CHART_COLORS = {
  tick: '#718096', // slate dim: 4.9:1 on #070B10 (AA); #64748B is 4.15:1
  label: '#94A3B8',
  grid: 'rgba(255, 255, 255, 0.06)',
  axis: 'rgba(255, 255, 255, 0.08)',
  tooltipBg: 'rgba(11, 16, 23, 0.95)',
  tooltipBorder: 'rgba(255, 255, 255, 0.1)',
  tooltipValue: '#F1F5F9',
  // Multipolar series palette: one hue per meaning, shared by every chart.
  west: '#38BDF8',      // Western / reserve currency / Fed
  east: '#FB7185',      // Eastern / BRICS / emerging powers
  gold: '#F59E0B',      // Bullion / hard money
  expansion: '#10B981', // Net liquidity positive / ease
  stress: '#EF4444',    // Fiscal burden / contraction
  // Lighter (Soft) and darker (Deep) steps of each meaning, for a second series of the same kind.
  westSoft: '#7DD3FC',
  westDeep: '#0284C7',
  eastSoft: '#FDA4AF',
  eastDeep: '#E11D48',
  goldSoft: '#FCD34D',
  goldDeep: '#D97706',
  expansionSoft: '#6EE7B7',
  expansionDeep: '#059669',
  stressSoft: '#FCA5A5',
  stressDeep: '#DC2626',
  // Extra hues for series that carry no multipolar meaning.
  indigo: '#6366F1',
  indigoSoft: '#A5B4FC',
  violet: '#8B5CF6',
  violetSoft: '#C4B5FD',
  orange: '#F97316',
  orangeSoft: '#FDBA74',
  slate: '#475569',
  // Surfaces and ink, mirroring the theme (page, panel, hairline) for non-MUI, non-Tailwind callers.
  surface: '#070B10',
  panel: '#0E141C',
  line: '#1E293B',
  textStrong: '#F8FAFC',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// Third-party brand colours (share buttons); not part of the series palette.
export const BRAND_COLORS = { x: '#1DA1F2', linkedin: '#0077B5' } as const;

// rgba() from a #RRGGBB token, so tints and glows stay tied to the palette.
export const alpha = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// Hairline and tint steps of white over the dark surfaces; one scale for every card, border and label.
export const WHITE_ALPHA = {
  ghost: 'rgba(255, 255, 255, 0.03)',
  faint: 'rgba(255, 255, 255, 0.05)',
  line: 'rgba(255, 255, 255, 0.1)',
  soft: 'rgba(255, 255, 255, 0.2)',
  dim: 'rgba(255, 255, 255, 0.4)',
  mid: 'rgba(255, 255, 255, 0.6)',
  strong: 'rgba(255, 255, 255, 0.8)',
} as const;

// Dark-to-light sequential ramps for choropleths and heat scales (5 steps each).
export const CHART_RAMPS = {
  green: ['#064E3B', '#065F46', '#059669', '#10B981', '#34D399'],
  red: ['#450A0A', '#7F1D1D', '#B91C1C', '#DC2626', '#EF4444'],
  indigo: ['#1E1B4B', '#312E81', '#3730A3', '#4338CA', '#4F46E5'],
  blue: ['#1E3A8A', '#1E40AF', '#1D4ED8', '#2563EB', '#3B82F6'],
  orange: ['#431407', '#7C2D12', '#9A3412', '#C2410C', '#EA580C'],
  teal: ['#112229', '#0891B2', '#06B6D4', '#22D3EE', '#67E8F9'],
  // Debt-per-ounce coverage: low coverage (deep red) to robust (green).
  coverage: ['#9F1239', '#BE123C', '#F59E0B', '#10B981', '#059669'],
} as const;

export const DEFAULT_CARTESIAN_GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: CHART_COLORS.grid,
  vertical: false,
} as const;

export const DEFAULT_XAXIS_PROPS = {
  tick: {
    fill: CHART_COLORS.tick,
    fontSize: 11,
    fontFamily: CHART_FONT_FAMILY,
  },
  axisLine: { stroke: CHART_COLORS.axis },
  tickLine: { stroke: 'transparent' },
} as const;

export const DEFAULT_YAXIS_PROPS = {
  tick: {
    fill: CHART_COLORS.tick,
    fontSize: 11,
    fontFamily: CHART_FONT_FAMILY,
  },
  axisLine: { stroke: CHART_COLORS.axis },
  tickLine: { stroke: 'transparent' },
  width: 48,
} as const;

// Container for Recharts' built-in <Tooltip contentStyle>. Equivalent to
// `bg-[#0B1017]/95 border border-border rounded-lg p-3 shadow-2xl backdrop-blur-md`.
export const DEFAULT_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: CHART_COLORS.tooltipBg,
  border: `1px solid ${CHART_COLORS.tooltipBorder}`,
  borderRadius: '8px',
  padding: '12px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(12px)',
  fontSize: '12px',
  fontFamily: CHART_FONT_FAMILY,
  fontVariantNumeric: 'tabular-nums',
  color: CHART_COLORS.tooltipValue,
};

// `text-[11px] text-slate-400 font-mono tracking-wider uppercase mb-1`
export const DEFAULT_TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: CHART_COLORS.label,
  fontSize: '11px',
  fontFamily: CHART_FONT_FAMILY,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: '4px',
};

// `text-xs font-mono font-semibold text-slate-100 tabular-nums`
export const DEFAULT_TOOLTIP_ITEM_STYLE: CSSProperties = {
  color: CHART_COLORS.tooltipValue,
  fontSize: '12px',
  fontFamily: CHART_FONT_FAMILY,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
};

export const EVENT_REFERENCE_LINE_PROPS = {
  stroke: 'rgba(255, 255, 255, 0.12)',
  strokeDasharray: '4 4',
  strokeWidth: 1,
  label: {
    fontSize: 11,
    fill: CHART_COLORS.label,
    fontFamily: CHART_FONT_FAMILY,
  },
} as const;

export const DEFAULT_LEGEND_PROPS = {
  wrapperStyle: {
    fontSize: '11px',
    fontFamily: CHART_FONT_FAMILY,
    color: CHART_COLORS.label,
  },
} as const;

// Standard Recharts responsive container height by use case
export const CHART_HEIGHTS = {
  sparkline: 40,
  compact:   140,
  standard:  260,
  tall:      380,
  hero:      480,
} as const;

import { CHART_COLORS } from '@/constants/chartDefaults';
// Ten distinct series: one token per slot so no two lines share a colour.
const LINE_COLORS = [
  CHART_COLORS.west,
  CHART_COLORS.gold,
  CHART_COLORS.violet,
  CHART_COLORS.expansion,
  CHART_COLORS.eastSoft,
  CHART_COLORS.westDeep,
  CHART_COLORS.east,
  CHART_COLORS.goldSoft,
  CHART_COLORS.expansionSoft,
  CHART_COLORS.violetSoft,
];

export function gfpSeriesColor(index: number): string {
  return LINE_COLORS[index % LINE_COLORS.length];
}

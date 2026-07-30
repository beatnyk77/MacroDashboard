import type { GfpNarrativeInputs } from './types';
import { formatBillions, formatPct } from './format';

export function buildGfpInsights(input: GfpNarrativeInputs): string[] {
  if (input.latest_fy == null) return [];
  const out: string[] = [];
  if (input.top5_share != null) {
    out.push(
      `Top 5 agencies account for ${formatPct(input.top5_share, 0)} of net cost in FY${input.latest_fy} (accrual).`,
    );
  }
  if (input.hhi != null) {
    out.push(`Net cost concentration HHI (0–1) is ${input.hhi.toFixed(3)} in FY${input.latest_fy}.`);
  }
  if (input.net_position_yoy_bil != null) {
    const dir = input.net_position_yoy_bil < 0 ? 'declined' : 'improved';
    out.push(
      `Consolidated net position ${dir} by ${formatBillions(Math.abs(input.net_position_yoy_bil))} YoY (FY${input.latest_fy}).`,
    );
  }
  if (input.total_liabilities_bil != null && input.total_assets_bil != null) {
    out.push(
      `Balance sheet: assets ${formatBillions(input.total_assets_bil)} vs liabilities ${formatBillions(input.total_liabilities_bil)} (accrual).`,
    );
  }
  return out.slice(0, 6);
}

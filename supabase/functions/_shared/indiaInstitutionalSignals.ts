export type PositioningRegime = 'Foreign Accumulation' | 'Domestic Cushion' | 'Distribution' | 'Synchronized Risk' | 'Mixed / Insufficient Coverage';

export interface DailySignalPoint { date: string; fii: number; dii: number; nifty?: number | null; breadth?: number | null; vix?: number | null; usdInr?: number | null; liquidity?: number | null; credit?: number | null; }
export interface SectorReport { date: string; sectors: Array<{ sectorKey: string; flow: number; aum: number }> }
export interface ComponentScore { score: number | null; available: boolean; inputs: string[]; }
export interface PositioningSnapshot { asOf: string; score: number | null; regime: PositioningRegime; confidence: number; coverageMask: string[]; foreignExit: ComponentScore; absorption: ComponentScore; flowPrice: ComponentScore; sectorRotation: ComponentScore; marketConfirmation: ComponentScore; calculationVersion: string; }

const clamp = (value: number, min = -1, max = 1) => Math.max(min, Math.min(max, value));
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function percentileRank(value: number, sample: number[]): number | null {
  const values = sample.filter(finite).sort((a, b) => a - b);
  if (!finite(value) || values.length === 0) return null;
  const less = values.filter((item) => item < value).length;
  const equal = values.filter((item) => item === value).length;
  return (less + equal / 2) / values.length;
}

export function toSignedScore(percentile: number): number {
  return clamp((percentile - 0.5) * 2);
}

function rollingSum(points: DailySignalPoint[], key: 'fii' | 'dii', window: number, index: number): number {
  return points.slice(Math.max(0, index - window + 1), index + 1).reduce((sum, point) => sum + point[key], 0);
}

function component(score: number | null, inputs: string[]): ComponentScore {
  return { score: score === null ? null : clamp(score), available: score !== null, inputs };
}

function streak(points: DailySignalPoint[], index: number): number {
  let length = 0;
  for (let i = index; i >= 0 && points[i].fii < 0; i -= 1) length += 1;
  return length;
}

function absorptionScore(points: DailySignalPoint[], index: number): ComponentScore {
  if (index < 19) return component(null, []);
  const ratio = rollingSum(points, 'fii', 20, index) < 0 ? rollingSum(points, 'dii', 20, index) / Math.abs(rollingSum(points, 'fii', 20, index)) : null;
  const ratios = points.slice(19, index + 1).map((_, offset) => { const i = offset + 19; const fii = rollingSum(points, 'fii', 20, i); return fii < 0 ? rollingSum(points, 'dii', 20, i) / Math.abs(fii) : null; }).filter(finite);
  if (!finite(ratio) || ratios.length < 12) return component(0, ['fii_20d', 'dii_20d']);
  const change = ratio - (ratios.length > 1 ? ratios[ratios.length - 2] : ratio);
  const changes = ratios.slice(1).map((value, i) => value - ratios[i]);
  const pRatio = percentileRank(ratio, ratios); const pChange = percentileRank(change, changes);
  return component(pRatio === null || pChange === null ? null : (pRatio * 0.7 + pChange * 0.3 - 0.5) * 2, ['fii_20d', 'dii_20d', 'absorption_ratio']);
}

function foreignExitScore(points: DailySignalPoint[], index: number): ComponentScore {
  if (index < 19) return component(null, []);
  const flow20 = rollingSum(points, 'fii', 20, index); const flow5 = rollingSum(points, 'fii', 5, index); const sellStreak = streak(points, index);
  const flow20Sample = points.slice(19, index + 1).map((_, i) => rollingSum(points, 'fii', 20, i + 19));
  const flow5Sample = points.slice(4, index + 1).map((_, i) => rollingSum(points, 'fii', 5, i + 4));
  const streakSample = points.slice(19, index + 1).map((_, i) => Math.min(20, streak(points, i + 19)));
  const p20 = percentileRank(flow20, flow20Sample); const p5 = percentileRank(flow5, flow5Sample); const ps = percentileRank(Math.min(20, sellStreak), streakSample);
  return component(p20 === null || p5 === null || ps === null ? null : (p20 * 0.55 + p5 * 0.25 + (1 - ps) * 0.2 - 0.5) * 2, ['fii_20d', 'fii_5d', 'fii_sell_streak']);
}

function marketScore(points: DailySignalPoint[], index: number): ComponentScore {
  const current = points[index]; const fields: Array<[string, number | null | undefined, number]> = [
    ['nifty_20d', current.nifty, 0.25], ['breadth_20d', current.breadth, 0.15], ['vix_20d', current.vix, 0.15], ['usd_inr_20d', current.usdInr, 0.2], ['rbi_liquidity', current.liquidity, 0.15], ['bank_credit', current.credit, 0.1],
  ];
  const available = fields.filter(([, value]) => finite(value));
  if (available.length < 3 || !available.some(([, value]) => finite(value) && (value === current.nifty || value === current.breadth))) return component(null, []);
  const weighted = available.reduce((sum, [name, value, weight]) => {
    const sample = points.slice(0, index + 1).map((point) => ({ nifty_20d: point.nifty, breadth_20d: point.breadth, vix_20d: point.vix, usd_inr_20d: point.usdInr, rbi_liquidity: point.liquidity, bank_credit: point.credit }[name as string])).filter(finite);
    const rank = percentileRank(value!, sample) ?? 0.5; const signed = name === 'vix_20d' || name === 'usd_inr_20d' ? 1 - rank : rank;
    return sum + signed * weight;
  }, 0);
  const weightTotal = available.reduce((sum, [, , weight]) => sum + weight, 0);
  return component((weighted / weightTotal - 0.5) * 2, available.map(([name]) => name));
}

function flowPriceScore(points: DailySignalPoint[], index: number): ComponentScore {
  const point = points[index];
  if (!finite(point.nifty) || !finite(point.breadth) || !finite(point.vix) || index < 19) return component(null, []);
  const sample = points.slice(19, index + 1); const flow = rollingSum(points, 'fii', 20, index); const nifty = point.nifty; const breadth = point.breadth; const vix = point.vix;
  const pFlow = percentileRank(flow, sample.map((_, i) => rollingSum(points, 'fii', 20, i + 19))); const pNifty = percentileRank(nifty, sample.map((p) => p.nifty!).filter(finite)); const pBreadth = percentileRank(breadth, sample.map((p) => p.breadth!).filter(finite)); const pVix = percentileRank(vix, sample.map((p) => p.vix!).filter(finite));
  return component(pFlow === null || pNifty === null || pBreadth === null || pVix === null ? null : ((pNifty - pFlow) * 0.5 + pBreadth * 0.3 + (1 - pVix) * 0.2 - 0.5) * 2, ['fii_20d', 'nifty_20d', 'breadth_20d', 'vix']);
}

function sectorScore(reports: SectorReport[]): ComponentScore {
  if (reports.length < 12) return component(null, []);
  const current = reports.slice(-3); const currentRows = current.flatMap((report) => report.sectors.filter((sector) => sector.aum > 0).map((sector) => sector.flow / sector.aum));
  const breadth = current.flatMap((report) => report.sectors).reduce((score, sector) => score + (sector.flow > 0 ? 1 : sector.flow < 0 ? -1 : 0), 0);
  const topFive = current.flatMap((report) => report.sectors.map((sector) => Math.abs(sector.flow))).sort((a, b) => b - a); const concentration = topFive.length ? topFive.slice(0, 5).reduce((sum, value) => sum + value, 0) / topFive.reduce((sum, value) => sum + value, 0) : 1;
  const historical = reports.map((report) => report.sectors.filter((sector) => sector.aum > 0).reduce((sum, sector) => sum + sector.flow / sector.aum, 0) / Math.max(1, report.sectors.length));
  const pFlow = percentileRank(currentRows.reduce((sum, value) => sum + value, 0) / Math.max(1, currentRows.length), historical); const pBreadth = percentileRank(breadth, reports.map((report) => report.sectors.reduce((sum, sector) => sum + (sector.flow > 0 ? 1 : sector.flow < 0 ? -1 : 0), 0))); const pConcentration = percentileRank(concentration, reports.map((report) => { const values = report.sectors.map((sector) => Math.abs(sector.flow)).sort((a, b) => b - a); return values.length ? values.slice(0, 5).reduce((sum, value) => sum + value, 0) / values.reduce((sum, value) => sum + value, 0) : 1; }));
  return component(pFlow === null || pBreadth === null || pConcentration === null ? null : (pFlow * 0.5 + pBreadth * 0.3 + (1 - pConcentration) * 0.2 - 0.5) * 2, ['nsdl_sector_flow', 'sector_aum', 'sector_breadth', 'top5_concentration']);
}

export function classifyPositioning(snapshot: Omit<PositioningSnapshot, 'regime' | 'confidence'>): PositioningRegime {
  const { score, foreignExit, absorption, flowPrice, marketConfirmation } = snapshot;
  if (score === null || !foreignExit.available || !absorption.available || !marketConfirmation.available) return 'Mixed / Insufficient Coverage';
  if (score < -0.35 && foreignExit.score! < -0.35 && absorption.score! < -0.25 && (flowPrice.score ?? 0) < -0.25 && marketConfirmation.score! < -0.35) return 'Synchronized Risk';
  if (score >= 0.35 && foreignExit.score! >= 0.35 && (flowPrice.score ?? 0) >= 0 && marketConfirmation.score! >= -0.25) return 'Foreign Accumulation';
  if (score >= -0.2 && absorption.score! >= 0.35 && foreignExit.score! < 0.35) return 'Domestic Cushion';
  if (score < -0.2 && foreignExit.score! < -0.35 && marketConfirmation.score! >= -0.35) return 'Distribution';
  return 'Mixed / Insufficient Coverage';
}

export function computeIndiaInstitutionalSignals(points: DailySignalPoint[], sectors: SectorReport[] = []): PositioningSnapshot {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date)); const index = sorted.length - 1; const foreignExit = foreignExitScore(sorted, index); const absorption = absorptionScore(sorted, index); const flowPrice = flowPriceScore(sorted, index); const sectorRotation = sectorScore(sectors); const marketConfirmation = marketScore(sorted, index); const parts = [foreignExit, absorption, flowPrice, sectorRotation, marketConfirmation]; const available = parts.filter((part) => part.available); const weights = [0.25, 0.2, 0.15, 0.15, 0.25]; const score = available.length >= 3 ? parts.reduce((sum, part, i) => sum + (part.score ?? 0) * weights[i], 0) / parts.reduce((sum, part, i) => sum + (part.available ? weights[i] : 0), 0) : null; const coverageMask = parts.map((part, i) => part.available ? ['foreign_exit', 'absorption', 'flow_price', 'sector_rotation', 'market_confirmation'][i] : null).filter((value): value is string => value !== null); const base = { asOf: sorted[index]?.date ?? '', score, coverageMask, foreignExit, absorption, flowPrice, sectorRotation, marketConfirmation, calculationVersion: 'india-positioning-v1' }; return { ...base, regime: classifyPositioning(base), confidence: Math.round((available.length / parts.length) * 100) };
}

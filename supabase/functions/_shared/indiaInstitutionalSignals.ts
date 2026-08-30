export type PositioningRegime = 'Foreign Accumulation' | 'Domestic Cushion' | 'Distribution' | 'Synchronized Risk' | 'Mixed / Insufficient Coverage';

export interface DailySignalPoint {
  date: string;
  fii: number;
  dii: number;
  nifty?: number | null;
  breadth?: number | null;
  vix?: number | null;
  usdInr?: number | null;
  liquidity?: number | null;
  credit?: number | null;
  liquidityDate?: string | null;
  creditDate?: string | null;
}
export interface SectorReport { date: string; sectors: Array<{ sectorKey: string; flow: number; aum: number }> }
export interface ComponentScore { score: number | null; available: boolean; inputs: string[]; }
export interface PositioningSnapshot {
  asOf: string;
  score: number | null;
  regime: PositioningRegime;
  confidence: number;
  coverageMask: string[];
  foreignExit: ComponentScore;
  absorption: ComponentScore;
  flowPrice: ComponentScore;
  sectorRotation: ComponentScore;
  marketConfirmation: ComponentScore;
  calculationVersion: string;
  candidateRegime?: PositioningRegime;
}

const clamp = (value: number, min = -1, max = 1) => Math.max(min, Math.min(max, value));
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const DAILY_LOOKBACK = 1260;
export const MIN_ACCEPTED_DAILY_OBSERVATIONS = 252;

export function hasSufficientDailyHistory(points: DailySignalPoint[]): boolean {
  return new Set(points.map((point) => point.date)).size >= MIN_ACCEPTED_DAILY_OBSERVATIONS;
}

export function percentileRank(value: number, sample: number[]): number | null {
  const values = sample.filter(finite).sort((a, b) => a - b);
  if (!finite(value) || values.length === 0) return null;
  const less = values.filter((item) => item < value).length;
  const equal = values.filter((item) => item === value).length;
  return (less + equal / 2) / values.length;
}

function quantile(values: number[], probability: number): number | null {
  const sorted = values.filter(finite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function winsorizedPercentile(value: number, sample: number[]): number | null {
  const values = sample.filter(finite);
  const lower = quantile(values, 0.02);
  const upper = quantile(values, 0.98);
  if (lower === null || upper === null) return null;
  const clipped = (item: number) => Math.max(lower, Math.min(upper, item));
  return percentileRank(clipped(value), values.map(clipped));
}

export function toSignedScore(percentile: number): number { return clamp((percentile - 0.5) * 2); }

function rollingSum(points: DailySignalPoint[], key: 'fii' | 'dii', window: number, index: number): number {
  return points.slice(Math.max(0, index - window + 1), index + 1).reduce((sum, point) => sum + point[key], 0);
}

function rollingAverage(points: DailySignalPoint[], key: 'breadth' | 'vix', window: number, index: number): number | null {
  const values = points.slice(Math.max(0, index - window + 1), index + 1).map((point) => point[key]).filter(finite);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function component(score: number | null, inputs: string[]): ComponentScore { return { score: score === null ? null : clamp(score), available: score !== null, inputs }; }

function streak(points: DailySignalPoint[], index: number): number {
  let length = 0;
  for (let i = index; i >= 0 && points[i].fii < 0; i -= 1) length += 1;
  return length;
}

function historicalSample(points: DailySignalPoint[], index: number, values: (point: DailySignalPoint, pointIndex: number) => number | null): number[] {
  const start = Math.max(0, index - DAILY_LOOKBACK + 1);
  return points.slice(start, index + 1).map((point, offset) => values(point, start + offset)).filter(finite);
}

function absorptionScore(points: DailySignalPoint[], index: number): ComponentScore {
  if (index < 19) return component(null, []);
  const ratios = points.slice(19, index + 1).map((_, offset) => {
    const i = offset + 19;
    const fii = rollingSum(points, 'fii', 20, i);
    return fii < 0 ? rollingSum(points, 'dii', 20, i) / Math.abs(fii) : null;
  });
  const currentFii = rollingSum(points, 'fii', 20, index);
  if (currentFii >= 0) return component(0, ['fii_20d', 'dii_20d']);
  const currentRatio = rollingSum(points, 'dii', 20, index) / Math.abs(currentFii);
  const validRatios = ratios.filter(finite);
  if (validRatios.length < 12) return component(0, ['fii_20d', 'dii_20d']);
  const previousRatio = validRatios.length > 1 ? validRatios[validRatios.length - 2] : currentRatio;
  const changes = validRatios.slice(1).map((value, i) => value - validRatios[i]);
  const pRatio = winsorizedPercentile(currentRatio, validRatios);
  const pChange = winsorizedPercentile(currentRatio - previousRatio, changes);
  return component(pRatio === null || pChange === null ? null : toSignedScore(pRatio * 0.7 + pChange * 0.3), ['fii_20d', 'dii_20d', 'absorption_ratio']);
}

function foreignExitScore(points: DailySignalPoint[], index: number): ComponentScore {
  if (index < 19) return component(null, []);
  const flow20 = rollingSum(points, 'fii', 20, index);
  const flow5 = rollingSum(points, 'fii', 5, index);
  const flow20Sample = historicalSample(points, index, (_, i) => i >= 19 ? rollingSum(points, 'fii', 20, i) : null);
  const flow5Sample = historicalSample(points, index, (_, i) => i >= 4 ? rollingSum(points, 'fii', 5, i) : null);
  const streakSample = historicalSample(points, index, (_, i) => i >= 19 ? Math.min(20, streak(points, i)) : null);
  const p20 = winsorizedPercentile(flow20, flow20Sample);
  const p5 = winsorizedPercentile(flow5, flow5Sample);
  const ps = winsorizedPercentile(Math.min(20, streak(points, index)), streakSample);
  return component(p20 === null || p5 === null || ps === null ? null : toSignedScore(p20 * 0.55 + p5 * 0.25 + (1 - ps) * 0.2), ['fii_20d', 'fii_5d', 'fii_sell_streak']);
}

function twentySessionReturn(points: DailySignalPoint[], index: number, key: 'nifty' | 'usdInr'): number | null {
  const values = points.slice(Math.max(0, index - 19), index + 1).map((point) => point[key]).filter(finite);
  return values.length >= 20 ? values.reduce((sum, value) => sum + value, 0) : null;
}

function ageDays(current: string, source: string): number {
  return (new Date(`${current}T00:00:00Z`).getTime() - new Date(`${source}T00:00:00Z`).getTime()) / 86_400_000;
}

function marketScore(points: DailySignalPoint[], index: number): ComponentScore {
  const current = points[index];
  const fields: Array<[string, number | null, number, boolean]> = [
    ['nifty_20d', twentySessionReturn(points, index, 'nifty'), 0.25, true],
    ['breadth_20d', rollingAverage(points, 'breadth', 20, index), 0.15, true],
    ['vix_20d', rollingAverage(points, 'vix', 20, index), 0.15, true],
    ['usd_inr_20d', twentySessionReturn(points, index, 'usdInr'), 0.2, true],
    ['rbi_liquidity_impulse', current.liquidity ?? null, 0.15, Boolean(current.liquidityDate) && ageDays(current.date, current.liquidityDate!) >= 0 && ageDays(current.date, current.liquidityDate!) <= 21],
    ['bank_credit_growth_yoy', current.credit ?? null, 0.1, Boolean(current.creditDate) && ageDays(current.date, current.creditDate!) >= 0 && ageDays(current.date, current.creditDate!) <= 90],
  ];
  const available = fields.filter(([, value, , fresh]) => finite(value) && fresh);
  if (available.length < 3 || !available.some(([name]) => name === 'nifty_20d' || name === 'breadth_20d')) return component(null, []);
  const start = Math.max(0, index - DAILY_LOOKBACK + 1);
  const weighted = available.reduce((sum, [name, value, weight]) => {
    const sample = points.slice(start, index + 1).map((point, offset) => {
      const i = start + offset;
      if (name === 'nifty_20d' || name === 'usd_inr_20d') return twentySessionReturn(points, i, name === 'nifty_20d' ? 'nifty' : 'usdInr');
      if (name === 'breadth_20d' || name === 'vix_20d') return rollingAverage(points, name === 'breadth_20d' ? 'breadth' : 'vix', 20, i);
      return name === 'rbi_liquidity_impulse' ? point.liquidity : point.credit;
    }).filter(finite);
    const rank = winsorizedPercentile(value!, sample) ?? 0.5;
    return sum + (name === 'vix_20d' || name === 'usd_inr_20d' ? 1 - rank : rank) * weight;
  }, 0);
  const weightTotal = available.reduce((sum, [, , weight]) => sum + weight, 0);
  return component(toSignedScore(weighted / weightTotal), available.map(([name]) => name));
}

function flowPriceScore(points: DailySignalPoint[], index: number): ComponentScore {
  const nifty = twentySessionReturn(points, index, 'nifty');
  const breadth = rollingAverage(points, 'breadth', 20, index);
  const vix = rollingAverage(points, 'vix', 20, index);
  if (index < 19 || !finite(nifty) || !finite(breadth) || !finite(vix)) return component(null, []);
  const sample = points.slice(19, index + 1);
  const pFlow = winsorizedPercentile(rollingSum(points, 'fii', 20, index), sample.map((_, i) => rollingSum(points, 'fii', 20, i + 19)));
  const pNifty = winsorizedPercentile(nifty, sample.map((_, i) => twentySessionReturn(points, i + 19, 'nifty')).filter(finite));
  const pBreadth = winsorizedPercentile(breadth, sample.map((_, i) => rollingAverage(points, 'breadth', 20, i + 19)).filter(finite));
  const pVix = winsorizedPercentile(vix, sample.map((_, i) => rollingAverage(points, 'vix', 20, i + 19)).filter(finite));
  return component(pFlow === null || pNifty === null || pBreadth === null || pVix === null ? null : toSignedScore((pNifty - pFlow) * 0.5 + pBreadth * 0.3 + (1 - pVix) * 0.2), ['fii_20d', 'nifty_20d', 'breadth_20d', 'india_vix_20d']);
}

function weightedMedian(values: Array<{ value: number; weight: number }>): number | null {
  const valid = values.filter(({ value, weight }) => finite(value) && finite(weight) && weight > 0).sort((a, b) => a.value - b.value);
  const total = valid.reduce((sum, item) => sum + item.weight, 0);
  let cumulative = 0;
  for (const item of valid) { cumulative += item.weight; if (cumulative >= total / 2) return item.value; }
  return valid.at(-1)?.value ?? null;
}

function sectorScore(reports: SectorReport[]): ComponentScore {
  const sorted = [...reports].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 12) return component(null, []);
  const latest = sorted.slice(-12);
  const current = latest.slice(-3);
  const reportFlow = (report: SectorReport) => weightedMedian(report.sectors.filter((sector) => sector.aum > 0).map((sector) => ({ value: sector.flow / sector.aum, weight: sector.aum })));
  const flowSeries = latest.map(reportFlow).filter(finite);
  const currentFlow = weightedMedian(current.flatMap((report) => report.sectors.filter((sector) => sector.aum > 0).map((sector) => ({ value: sector.flow / sector.aum, weight: sector.aum }))));
  const breadthFor = (report: SectorReport) => report.sectors.reduce((score, sector) => score + (sector.flow > 0 ? 1 : sector.flow < 0 ? -1 : 0), 0);
  const currentBreadth = current.reduce((sum, report) => sum + breadthFor(report), 0);
  const breadthSeries = latest.map(breadthFor);
  const concentrationFor = (report: SectorReport) => {
    const values = report.sectors.map((sector) => Math.abs(sector.flow)).sort((a, b) => b - a);
    const total = values.reduce((sum, value) => sum + value, 0);
    return total > 0 ? values.slice(0, 5).reduce((sum, value) => sum + value, 0) / total : 1;
  };
  const concentration = current.reduce((sum, report) => sum + concentrationFor(report), 0) / current.length;
  const pFlow = currentFlow === null ? null : winsorizedPercentile(currentFlow, flowSeries.slice(0, 9));
  const pBreadth = winsorizedPercentile(currentBreadth, breadthSeries.slice(0, 9));
  const pConcentration = winsorizedPercentile(concentration, latest.map(concentrationFor).slice(0, 9));
  return component(pFlow === null || pBreadth === null || pConcentration === null ? null : toSignedScore(pFlow * 0.5 + pBreadth * 0.3 + (1 - pConcentration) * 0.2), ['nsdl_sector_flow_aum', 'sector_breadth', 'top5_concentration']);
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

export function applyRegimeHysteresis(candidate: PositioningRegime, previousRegime: PositioningRegime | null, previousCandidate: PositioningRegime | null): PositioningRegime {
  if (!previousRegime || candidate === 'Synchronized Risk' || candidate === 'Mixed / Insufficient Coverage') return candidate;
  if (candidate === previousRegime) return candidate;
  return previousCandidate === candidate ? candidate : previousRegime;
}

export function computeIndiaInstitutionalSignals(points: DailySignalPoint[], sectors: SectorReport[] = [], previousRegime: PositioningRegime | null = null, previousCandidate: PositioningRegime | null = null): PositioningSnapshot {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const index = sorted.length - 1;
  const foreignExit = foreignExitScore(sorted, index);
  const absorption = absorptionScore(sorted, index);
  const flowPrice = flowPriceScore(sorted, index);
  const sectorRotation = sectorScore(sectors);
  const marketConfirmation = marketScore(sorted, index);
  const parts = [foreignExit, absorption, flowPrice, sectorRotation, marketConfirmation];
  const available = parts.filter((part) => part.available);
  const weights = [0.25, 0.2, 0.15, 0.15, 0.25];
  const weightTotal = parts.reduce((sum, part, i) => sum + (part.available ? weights[i] : 0), 0);
  const score = available.length >= 3 && weightTotal > 0 ? parts.reduce((sum, part, i) => sum + (part.score ?? 0) * weights[i], 0) / weightTotal : null;
  const coverageMask = parts.map((part, i) => part.available ? ['foreign_exit', 'absorption', 'flow_price', 'sector_rotation', 'market_confirmation'][i] : null).filter((value): value is string => value !== null);
  const base = { asOf: sorted[index]?.date ?? '', score, coverageMask, foreignExit, absorption, flowPrice, sectorRotation, marketConfirmation, calculationVersion: 'india-positioning-v2' };
  const candidateRegime = classifyPositioning(base);
  return { ...base, candidateRegime, regime: applyRegimeHysteresis(candidateRegime, previousRegime, previousCandidate), confidence: Math.round((available.length / parts.length) * 100) };
}

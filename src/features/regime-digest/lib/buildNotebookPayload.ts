// src/features/regime-digest/lib/buildNotebookPayload.ts
import { DIGEST_METRICS, CORE_METRIC_IDS } from './metricCatalog';
import { validateObservation } from './validateMetric';
import { buildMetricRow, rankMovers } from './computeMom';
import { buildThesisLines } from './buildThesis';
import { positioningForRegime } from './positioning';
import { buildLevelWatchlist } from './buildWatchlist';
import type { NotebookPayload, NotebookRegime, QualityOverall, RegimeLabel } from './types';

export interface RawMetricPoint {
  id: string;
  value: number;
  asOf: string;
}

export interface BuildNotebookInput {
  yearMonth: string;
  now: Date;
  points: RawMetricPoint[];
  regime: NotebookRegime;
  history: { yearMonth: string; regime: RegimeLabel }[];
  briefLinks: { date: string; url: string; title: string }[];
  editionNumber: number | null;
}

function lastDayOfMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 0));
  return d.toISOString().slice(0, 10);
}

function prevYearMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Latest point with asOf <= endDate inclusive */
function pickMonthEnd(points: RawMetricPoint[], metricId: string, endDate: string): RawMetricPoint | null {
  const eligible = points
    .filter((p) => p.id === metricId && p.asOf <= endDate)
    .sort((a, b) => (a.asOf < b.asOf ? 1 : -1));
  return eligible[0] ?? null;
}

export function buildNotebookPayload(input: BuildNotebookInput): NotebookPayload {
  const end = lastDayOfMonth(input.yearMonth);
  const prevYm = prevYearMonth(input.yearMonth);
  const prevEnd = lastDayOfMonth(prevYm);

  const board = DIGEST_METRICS.map((def) => {
    const curPt = pickMonthEnd(input.points, def.id, end);
    const prevPt = pickMonthEnd(input.points, def.id, prevEnd);
    const cur = validateObservation(def, curPt?.value, curPt?.asOf, input.now);
    const prev = validateObservation(def, prevPt?.value, prevPt?.asOf, input.now);
    return buildMetricRow(def, cur, prev);
  });

  const movers = rankMovers(board, 5);
  const thesis = buildThesisLines(input.regime, board);
  const positioning = positioningForRegime(input.regime.label);
  const watchlist = buildLevelWatchlist(movers);

  const okCount = board.filter((r) => r.status === 'ok').length;
  const staleCount = board.filter((r) => r.status === 'stale').length;
  const withheldCount = board.filter((r) => r.status === 'failed_validation').length;
  const missingCount = board.filter((r) => r.status === 'missing').length;
  const failedMetrics = board.filter((r) => r.status === 'failed_validation').map((r) => r.id);

  const core = board.filter((r) => (CORE_METRIC_IDS as readonly string[]).includes(r.id));
  const coreOk = core.filter((r) => r.status === 'ok' || r.status === 'stale').length;
  const coreRatio = core.length ? coreOk / core.length : 0;

  const regimeDefaulted =
    input.regime.regimeSource === 'default' ||
    (input.regime.confidence == null &&
      input.regime.daysInRegime == null &&
      input.regime.compositeScore == null);

  let overall: QualityOverall = 'ok';
  if (coreRatio < 0.5 || !input.regime.label) {
    overall = 'blocked';
  } else if (withheldCount > 0 || staleCount > 0 || coreRatio < 1 || regimeDefaulted) {
    overall = 'partial';
  }

  const asOfDates = board.map((r) => r.asOf).filter(Boolean) as string[];
  const asOf = asOfDates.length ? asOfDates.sort().slice(-1)[0] : null;

  return {
    yearMonth: input.yearMonth,
    editionNumber: input.editionNumber,
    publishedAt: input.now.toISOString(),
    asOf,
    regime: input.regime,
    thesis,
    movers,
    watchlist,
    positioning,
    board,
    history: input.history,
    briefLinks: input.briefLinks,
    quality: {
      okCount,
      staleCount,
      withheldCount,
      missingCount,
      failedMetrics,
      overall,
    },
    generation: { mode: 'notebook_v1', engine: 'rules' },
  };
}

export function subjectFromPayload(p: NotebookPayload): string {
  const liq = p.board.find((r) => r.id === 'BIS_GLOBAL_LIQUIDITY_USD_BN' && r.deltaPct != null);
  const liqBit = liq
    ? `Liquidity ${(liq.deltaPct as number) >= 0 ? '+' : ''}${(liq.deltaPct as number).toFixed(1)}%`
    : 'Liquidity & Prices';
  return `Regime Snapshot ${p.yearMonth}: ${p.regime.label.replace('_', ' ')} · ${liqBit}`;
}

export function plainTextFromPayload(p: NotebookPayload): string {
  return [
    `Monthly Regime Digest — ${p.yearMonth}`,
    `Regime: ${p.regime.label}`,
    ...p.thesis,
    '',
    'Biggest movers (up):',
    ...p.movers.up.map((m) => `  ${m.name}: +${m.deltaPct.toFixed(2)}%`),
    'Biggest movers (down):',
    ...p.movers.down.map((m) => `  ${m.name}: ${m.deltaPct.toFixed(2)}%`),
    '',
    'Framework implications:',
    ...p.positioning.map((x) => `  - ${x}`),
    '',
    'Watchlist:',
    ...p.watchlist.map((w) => `  - ${w.label}: ${w.why}`),
    '',
    `Quality: ${p.quality.overall} (ok=${p.quality.okCount} stale=${p.quality.staleCount} withheld=${p.quality.withheldCount})`,
  ].join('\n');
}

/** Minimal semantic HTML for email/legacy consumers — primary UI is React */
export function htmlFromPayload(p: NotebookPayload): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return [
    `<h2>Regime ${esc(p.regime.label)}</h2>`,
    `<ul>${p.thesis.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`,
    `<h3>Biggest movers</h3>`,
    `<ul>${[...p.movers.up, ...p.movers.down]
      .map((m) => `<li>${esc(m.name)}: ${m.deltaPct.toFixed(2)}%</li>`)
      .join('')}</ul>`,
    `<h3>Framework implications</h3>`,
    `<ul>${p.positioning.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`,
    `<h3>Watchlist</h3>`,
    `<ul>${p.watchlist.map((w) => `<li><strong>${esc(w.label)}</strong> — ${esc(w.why)}</li>`).join('')}</ul>`,
  ].join('\n');
}

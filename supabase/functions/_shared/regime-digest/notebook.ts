/**
 * Monthly Regime Notebook — pure rules engine (Deno port of src/features/regime-digest/lib).
 * Keep API compatible with the Node lib so future sync is mechanical.
 * No Node-only imports; no LLM.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type MetricStatus = 'ok' | 'stale' | 'missing' | 'failed_validation';
export type QualityOverall = 'ok' | 'partial' | 'blocked';
export type RegimeLabel = 'RISK_ON' | 'NEUTRAL' | 'RISK_OFF';

export type ScoreboardSectionId =
  | 'liquidity'
  | 'rates_usd'
  | 'vol'
  | 'metals'
  | 'energy'
  | 'us'
  | 'india'
  | 'china';

export interface MetricDef {
  id: string;
  name: string;
  section: ScoreboardSectionId;
  unit: string;
  sourceFamily: string;
  min: number;
  max: number;
  /** Max age in days before status becomes stale (still shown). */
  staleDays: number;
  glossaryPath?: string;
  format?: 'number' | 'percent' | 'usd' | 'ratio';
  decimals?: number;
}

export interface MetricRow {
  id: string;
  name: string;
  section: ScoreboardSectionId;
  level: number | null;
  priorLevel: number | null;
  delta: number | null;
  deltaPct: number | null;
  unit: string;
  asOf: string | null;
  sourceFamily: string;
  status: MetricStatus;
  glossaryPath?: string;
}

export interface MetricMove {
  id: string;
  name: string;
  deltaPct: number;
  level: number;
  section: ScoreboardSectionId;
}

export interface WatchItem {
  type: 'event' | 'level';
  date?: string;
  label: string;
  why: string;
}

export type RegimeSource = 'frozen' | 'default';

export interface NotebookRegime {
  label: RegimeLabel;
  confidence: number | null;
  daysInRegime: number | null;
  compositeScore: number | null;
  /** 'frozen' from daily_signal; 'default' when no freeze available (NEUTRAL fallback). */
  regimeSource?: RegimeSource;
}

export interface NotebookPayload {
  yearMonth: string;
  editionNumber: number | null;
  publishedAt: string;
  asOf: string | null;
  regime: NotebookRegime;
  thesis: string[];
  movers: { up: MetricMove[]; down: MetricMove[] };
  watchlist: WatchItem[];
  positioning: string[];
  board: MetricRow[];
  history: { yearMonth: string; regime: RegimeLabel }[];
  briefLinks: { date: string; url: string; title: string }[];
  quality: {
    okCount: number;
    staleCount: number;
    withheldCount: number;
    missingCount: number;
    failedMetrics: string[];
    overall: QualityOverall;
  };
  generation: { mode: 'notebook_v1'; engine: 'rules' };
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export const DIGEST_METRICS: MetricDef[] = [
  {
    id: 'BIS_GLOBAL_LIQUIDITY_USD_BN',
    name: 'Global Net Liquidity',
    section: 'liquidity',
    unit: 'USD bn',
    sourceFamily: 'BIS/GQ',
    min: 5_000,
    max: 100_000,
    staleDays: 45,
    glossaryPath: '/glossary/net-liquidity-z-score/',
    format: 'number',
    decimals: 0,
  },
  {
    id: 'DXY_INDEX',
    name: 'DXY',
    section: 'rates_usd',
    unit: 'index',
    sourceFamily: 'market',
    min: 70,
    max: 130,
    staleDays: 7,
    format: 'number',
    decimals: 2,
  },
  {
    id: 'VIX_INDEX',
    name: 'VIX',
    section: 'vol',
    unit: 'index',
    sourceFamily: 'market',
    min: 5,
    max: 100,
    staleDays: 7,
    format: 'number',
    decimals: 2,
  },
  {
    id: 'GOLD_PRICE_USD',
    name: 'Gold',
    section: 'metals',
    unit: 'USD/oz',
    sourceFamily: 'market',
    min: 500,
    max: 10_000,
    staleDays: 7,
    format: 'usd',
    decimals: 0,
  },
  {
    id: 'RATIO_DEBT_GOLD',
    name: 'Debt/Gold',
    section: 'metals',
    unit: 'x',
    sourceFamily: 'GQ',
    min: 1,
    max: 200,
    staleDays: 14,
    format: 'ratio',
    decimals: 2,
  },
  {
    id: 'BRENT_CRUDE_PRICE',
    name: 'Brent',
    section: 'energy',
    unit: 'USD/bbl',
    sourceFamily: 'market',
    min: 10,
    max: 300,
    staleDays: 7,
    format: 'usd',
    decimals: 2,
  },
  {
    id: 'US_CPI_YOY',
    name: 'US CPI YoY',
    section: 'us',
    unit: '%',
    sourceFamily: 'FRED',
    min: -5,
    max: 25,
    staleDays: 45,
    format: 'percent',
    decimals: 2,
  },
  {
    id: 'IN_GDP_GROWTH_YOY',
    name: 'India GDP YoY',
    section: 'india',
    unit: '%',
    sourceFamily: 'MOSPI',
    min: -15,
    max: 20,
    staleDays: 120,
    format: 'percent',
    decimals: 2,
  },
  {
    id: 'IN_CPI_YOY',
    name: 'India CPI YoY',
    section: 'india',
    unit: '%',
    sourceFamily: 'MOSPI',
    min: -5,
    max: 25,
    staleDays: 45,
    format: 'percent',
    decimals: 2,
  },
  {
    id: 'CN_GDP_GROWTH_YOY',
    name: 'China GDP YoY',
    section: 'china',
    unit: '%',
    sourceFamily: 'NBS',
    min: -15,
    max: 20,
    staleDays: 120,
    format: 'percent',
    decimals: 2,
  },
];

/** Core set for publish quality gate */
export const CORE_METRIC_IDS = [
  'BIS_GLOBAL_LIQUIDITY_USD_BN',
  'DXY_INDEX',
  'VIX_INDEX',
  'GOLD_PRICE_USD',
  'US_CPI_YOY',
] as const;

// ─── Validate ────────────────────────────────────────────────────────────────

export interface ValidatedObservation {
  status: MetricStatus;
  level: number | null;
  asOf: string | null;
}

function daysBetween(asOf: string, now: Date): number {
  const a = new Date(asOf + (asOf.length === 10 ? 'T00:00:00Z' : ''));
  return (now.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

export function validateObservation(
  def: MetricDef,
  value: number | null | undefined,
  asOf: string | null | undefined,
  now: Date,
): ValidatedObservation {
  if (value == null || !Number.isFinite(Number(value))) {
    return { status: 'missing', level: null, asOf: asOf ?? null };
  }
  const n = Number(value);
  if (n < def.min || n > def.max) {
    return { status: 'failed_validation', level: null, asOf: asOf ?? null };
  }
  if (!asOf) {
    return { status: 'stale', level: n, asOf: null };
  }
  if (daysBetween(asOf, now) > def.staleDays) {
    return { status: 'stale', level: n, asOf };
  }
  return { status: 'ok', level: n, asOf };
}

// ─── MoM / movers ────────────────────────────────────────────────────────────

export function buildMetricRow(
  def: MetricDef,
  current: ValidatedObservation,
  prior: ValidatedObservation,
): MetricRow {
  const level = current.level;
  const priorLevel = prior.level;
  let delta: number | null = null;
  let deltaPct: number | null = null;
  if (level != null && priorLevel != null && priorLevel !== 0) {
    delta = level - priorLevel;
    deltaPct = (delta / priorLevel) * 100;
  } else if (level != null && priorLevel != null && priorLevel === 0) {
    delta = level - priorLevel;
    deltaPct = null;
  }

  const status = current.status;

  return {
    id: def.id,
    name: def.name,
    section: def.section,
    level: status === 'failed_validation' ? null : level,
    priorLevel: prior.status === 'failed_validation' ? null : priorLevel,
    delta: status === 'ok' || status === 'stale' ? delta : null,
    deltaPct: status === 'ok' || status === 'stale' ? deltaPct : null,
    unit: def.unit,
    asOf: current.asOf,
    sourceFamily: def.sourceFamily,
    status,
    glossaryPath: def.glossaryPath,
  };
}

export function rankMovers(board: MetricRow[], n = 5): { up: MetricMove[]; down: MetricMove[] } {
  const eligible = board.filter(
    (r) => r.status === 'ok' && r.level != null && r.deltaPct != null && Number.isFinite(r.deltaPct),
  );
  const up = [...eligible]
    .filter((r) => (r.deltaPct as number) > 0)
    .sort((a, b) => (b.deltaPct as number) - (a.deltaPct as number))
    .slice(0, n)
    .map((r) => ({
      id: r.id,
      name: r.name,
      deltaPct: r.deltaPct as number,
      level: r.level as number,
      section: r.section,
    }));
  const down = [...eligible]
    .filter((r) => (r.deltaPct as number) < 0)
    .sort((a, b) => (a.deltaPct as number) - (b.deltaPct as number))
    .slice(0, n)
    .map((r) => ({
      id: r.id,
      name: r.name,
      deltaPct: r.deltaPct as number,
      level: r.level as number,
      section: r.section,
    }));
  return { up, down };
}

// ─── Thesis ──────────────────────────────────────────────────────────────────

function dirWord(deltaPct: number | null): 'rose' | 'fell' | 'was unchanged' {
  if (deltaPct == null || Math.abs(deltaPct) < 0.05) return 'was unchanged';
  return deltaPct > 0 ? 'rose' : 'fell';
}

export function buildThesisLines(regime: NotebookRegime, board: MetricRow[]): string[] {
  const lines: string[] = [];
  const parenParts: string[] = [];
  if (regime.confidence != null) {
    parenParts.push(`confidence ${Math.round(regime.confidence)}%`);
  }
  if (regime.daysInRegime != null) {
    parenParts.push(`${regime.daysInRegime} days in regime`);
  }
  const paren = parenParts.length ? ` (${parenParts.join('; ')})` : '';
  lines.push(`Month-end regime: ${regime.label.replace('_', ' ')}${paren}.`);

  const byId = (id: string) => board.find((r) => r.id === id && r.status === 'ok');

  const liq = byId('BIS_GLOBAL_LIQUIDITY_USD_BN');
  if (liq?.deltaPct != null && liq.level != null) {
    const verb = liq.deltaPct >= 0 ? 'expanded' : 'contracted';
    lines.push(
      `Global net liquidity ${verb} MoM (${liq.deltaPct >= 0 ? '+' : ''}${liq.deltaPct.toFixed(2)}%) to ${liq.level.toFixed(0)} USD bn.`,
    );
  }

  const dxy = byId('DXY_INDEX');
  if (dxy?.level != null) {
    lines.push(
      `DXY ${dirWord(dxy.deltaPct)} MoM to ${dxy.level.toFixed(2)}, a ${
        (dxy.deltaPct ?? 0) > 0 ? 'tightening' : (dxy.deltaPct ?? 0) < 0 ? 'easing' : 'stable'
      } USD impulse.`,
    );
  }

  const gold = byId('GOLD_PRICE_USD');
  if (gold?.level != null && gold.deltaPct != null) {
    lines.push(
      `Gold ${dirWord(gold.deltaPct)} MoM to $${Math.round(gold.level).toLocaleString()} (${gold.deltaPct >= 0 ? '+' : ''}${gold.deltaPct.toFixed(2)}%).`,
    );
  }

  const indiaCpi = byId('IN_CPI_YOY');
  const indiaGdp = byId('IN_GDP_GROWTH_YOY');
  if (indiaCpi?.level != null || indiaGdp?.level != null) {
    const parts: string[] = [];
    if (indiaGdp?.level != null) parts.push(`GDP ${indiaGdp.level.toFixed(2)}%`);
    if (indiaCpi?.level != null) parts.push(`CPI ${indiaCpi.level.toFixed(2)}%`);
    lines.push(`India pulse: ${parts.join(' · ')}.`);
  }

  return lines.slice(0, 5);
}

// ─── Positioning ─────────────────────────────────────────────────────────────

const POSITIONING_MAP: Record<RegimeLabel, string[]> = {
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
  return POSITIONING_MAP[label] ?? POSITIONING_MAP.NEUTRAL;
}

// ─── Watchlist ───────────────────────────────────────────────────────────────

export function buildLevelWatchlist(movers: {
  up: MetricMove[];
  down: MetricMove[];
}): WatchItem[] {
  const items: WatchItem[] = [];
  for (const m of movers.up.slice(0, 3)) {
    items.push({
      type: 'level',
      label: `${m.name} follow-through`,
      why: `Largest upside MoM move (+${m.deltaPct.toFixed(1)}%); watch whether level holds above ${m.level}.`,
    });
  }
  for (const m of movers.down.slice(0, 3)) {
    items.push({
      type: 'level',
      label: `${m.name} stabilization`,
      why: `Largest downside MoM move (${m.deltaPct.toFixed(1)}%); watch for base-building near ${m.level}.`,
    });
  }
  return items.slice(0, 8);
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

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

export function lastDayOfMonth(ym: string): string {
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

/** Compact legacy metrics_snapshot for MetricsStrip compat */
export function metricsSnapshotFromBoard(board: MetricRow[]): Record<string, unknown> {
  const byId = (id: string) => board.find((r) => r.id === id);

  const liq = byId('BIS_GLOBAL_LIQUIDITY_USD_BN');
  const dxy = byId('DXY_INDEX');
  const vix = byId('VIX_INDEX');
  const debtGold = byId('RATIO_DEBT_GOLD');
  const usCpi = byId('US_CPI_YOY');
  const gold = byId('GOLD_PRICE_USD');
  const brent = byId('BRENT_CRUDE_PRICE');
  const inGdp = byId('IN_GDP_GROWTH_YOY');
  const inCpi = byId('IN_CPI_YOY');
  const cnGdp = byId('CN_GDP_GROWTH_YOY');

  return {
    us: {
      cpi_yoy: usCpi?.level ?? undefined,
      dxy: dxy?.level ?? undefined,
      dxy_prev: dxy?.priorLevel ?? undefined,
      debt_gold_ratio: debtGold?.level ?? undefined,
      vix: vix?.level ?? undefined,
      global_liquidity_usd_bn: liq?.level ?? undefined,
      global_liquidity_prev: liq?.priorLevel ?? undefined,
    },
    india: {
      gdp_yoy: inGdp?.level ?? undefined,
      cpi_yoy: inCpi?.level ?? undefined,
    },
    china: {
      gdp_yoy: cnGdp?.level ?? undefined,
    },
    commodities: {
      gold_usd: gold?.level ?? undefined,
      gold_prev: gold?.priorLevel ?? undefined,
      brent_crude: brent?.level ?? undefined,
      brent_prev: brent?.priorLevel ?? undefined,
    },
  };
}

export function isRegimeLabel(v: unknown): v is RegimeLabel {
  return v === 'RISK_ON' || v === 'NEUTRAL' || v === 'RISK_OFF';
}

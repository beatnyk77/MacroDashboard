// src/features/regime-digest/lib/types.ts
export type MetricStatus = 'ok' | 'stale' | 'missing' | 'failed_validation';
export type QualityOverall = 'ok' | 'partial' | 'blocked';

export type RegimeLabel = 'RISK_ON' | 'NEUTRAL' | 'RISK_OFF';

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

export type ScoreboardSectionId =
  | 'liquidity'
  | 'rates_usd'
  | 'vol'
  | 'metals'
  | 'energy'
  | 'us'
  | 'india'
  | 'china';

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

/**
 * Single source of truth for public-facing pipeline narrative.
 * Maps edge-function slugs → human labels, tiers, sources, and product surfaces.
 * Keep in sync with remote ACTIVE functions after free-tier prunes.
 */

export type PipelineTier =
  | 'core'
  | 'sovereign'
  | 'energy_gold'
  | 'platform';

export interface PipelineEntry {
  id: string;
  title: string;
  tier: PipelineTier;
  sources: string[];
  surfaces: string[];
  /** Cadence label for institutional copy (not a hard SLA guarantee). */
  cadence: string;
}

export const PIPELINE_TIER_LABELS: Record<PipelineTier, string> = {
  core: 'Core Macro',
  sovereign: 'Sovereign · India / China',
  energy_gold: 'Energy · Gold · Commodities',
  platform: 'Platform · Ops',
};

/**
 * Curated product mesh — not a dump of every edge slug.
 * Prefer live health from vw_latest_ingestions; use this for labels + messaging.
 */
export const PIPELINES: PipelineEntry[] = [
  // Core macro
  {
    id: 'ingest-fred',
    title: 'FRED US Macro',
    tier: 'core',
    sources: ['FRED'],
    surfaces: ['/', '/labs/us-macro-fiscal', '/tools/net-liquidity-gauge'],
    cadence: 'Daily',
  },
  {
    id: 'ingest-us-macro',
    title: 'US Treasury · Fiscal Pulse',
    tier: 'core',
    sources: ['US Treasury FiscalData', 'BEA'],
    surfaces: ['/labs/us-macro-fiscal'],
    cadence: 'Daily / Weekly',
  },
  {
    id: 'ingest-oecd-cli',
    title: 'OECD Composite Leading Indicators',
    tier: 'core',
    sources: ['OECD', 'FRED'],
    surfaces: ['/'],
    cadence: 'Monthly',
  },
  {
    id: 'compute-daily-macro-signal',
    title: 'Daily Regime Signal',
    tier: 'core',
    sources: ['Derived'],
    surfaces: ['/tools/daily-regime-signal', '/'],
    cadence: 'Daily',
  },
  {
    id: 'generate-morning-brief',
    title: 'Morning Macro Brief',
    tier: 'core',
    sources: ['Multi-source synthesis'],
    surfaces: ['/macro-brief'],
    cadence: 'Daily',
  },
  {
    id: 'generate-monthly-regime-digest',
    title: 'Monthly Regime Digest',
    tier: 'core',
    sources: ['Multi-source synthesis'],
    surfaces: ['/regime-digest'],
    cadence: 'Monthly',
  },

  // Sovereign India / China
  {
    id: 'ingest-india-fiscal-stress',
    title: 'India Fiscal Stress',
    tier: 'sovereign',
    sources: ['RBI', 'MoSPI', 'CGAS'],
    surfaces: ['/intel/india'],
    cadence: 'Weekly',
  },
  {
    id: 'ingest-china-macro',
    title: 'China NBS / PBOC Macro',
    tier: 'sovereign',
    sources: ['NBS', 'PBOC'],
    surfaces: ['/intel/china'],
    cadence: 'Monthly',
  },
  {
    id: 'ingest-country-metrics',
    title: 'Cross-Country Metrics',
    tier: 'sovereign',
    sources: ['IMF', 'World Bank', 'BIS'],
    surfaces: ['/countries'],
    cadence: 'Monthly',
  },
  {
    id: 'ingest-cofer',
    title: 'IMF COFER Reserves',
    tier: 'sovereign',
    sources: ['IMF COFER'],
    surfaces: ['/labs/de-dollarization-gold', '/'],
    cadence: 'Quarterly',
  },

  // Energy / gold
  {
    id: 'ingest-commodity-terminal',
    title: 'EIA Energy Terminal',
    tier: 'energy_gold',
    sources: ['EIA'],
    surfaces: ['/labs/energy-commodities'],
    cadence: 'Weekly',
  },
  {
    id: 'ingest-oil-spread',
    title: 'WTI Calendar Spread',
    tier: 'energy_gold',
    sources: ['EIA', 'Market'],
    surfaces: ['/labs/energy-commodities'],
    cadence: 'Daily',
  },
  {
    id: 'ingest-cb-gold',
    title: 'Central Bank Gold',
    tier: 'energy_gold',
    sources: ['WGC', 'IMF'],
    surfaces: ['/labs/central-bank-gold-purchases', '/labs/de-dollarization-gold'],
    cadence: 'Monthly',
  },

  // Platform
  {
    id: 'check-data-health',
    title: 'Data Health Monitor',
    tier: 'platform',
    sources: ['Internal'],
    surfaces: ['/data-health', '/admin/data-health'],
    cadence: 'Daily',
  },
  {
    id: 'get-newsletter-data',
    title: 'Newsletter Payload',
    tier: 'platform',
    sources: ['Terminal metrics'],
    surfaces: ['Newsletter', '/#newsletter'],
    cadence: 'Weekly',
  },
  {
    id: 'send-confirm-email',
    title: 'Subscription Confirm',
    tier: 'platform',
    sources: ['Resend'],
    surfaces: ['/#newsletter'],
    cadence: 'On demand',
  },
  {
    id: 'send-daily-brief',
    title: 'Daily Brief Email',
    tier: 'platform',
    sources: ['Resend', 'daily_macro_briefs'],
    surfaces: ['/#newsletter', '/macro-brief'],
    cadence: 'Weekdays',
  },
  {
    id: 'generate-share-card',
    title: 'Share Card (OG)',
    tier: 'platform',
    sources: ['Storage'],
    surfaces: ['/macro-brief'],
    cadence: 'Weekdays after brief',
  },
  {
    id: 'growth-actions',
    title: 'Regime Alerts',
    tier: 'platform',
    sources: ['Resend'],
    surfaces: ['email'],
    cadence: 'On flip / on demand',
  },
];

/** Functions deliberately not listed publicly after free-tier prune. */
export const RETIRED_PIPELINE_IDS = [
  'api-auth-middleware',
  'ingest-china-defaults',
  'ingest-eurostat-debt',
  'ingest-financial-hubs-gold',
  'ingest-imf-gdp-per-capita',
  'ingest-macro-events',
  // Trade / export scout / CIE (minimalist scope prune)
  'cache-comtrade-data',
  'compute-hs-opportunity-scores',
  'fetch-hs-demand',
  'generate-export-scout',
  'ingest-trade-global',
  'ingest-trade-global-pulse',
  'ingest-trade-gravity',
  'ingest-trade-imports',
  'ingest-uk-trade-ots',
  'ingest-uk-trade-traders',
  'ingest-un-comtrade',
  'compute-cie-macro-scores',
  'ingest-cie-deals',
  'ingest-cie-fundamentals',
  'ingest-cie-ipos',
  'ingest-cie-promoters',
  'ingest-cie-short-selling',
  'ingest-nse-flows',
  // R3 pilot delete batch (≤80 target)
  'api-auth-middleware',
  'debug-logs',
  'execute-restoration-sql',
  'ingest-china-defaults',
  'ingest-eurostat-debt',
  'ingest-financial-hubs-gold',
  'ingest-imf-gdp-per-capita',
  'ingest-macro-events',
  'llm-knowledge',
  'ingest-us-edgar-fundamentals',
  'ingest-corporate-debt-maturities',
  'ingest-events',
  'ingest-events-markers',
  'ingest-asi',
] as const;

export const PIPELINE_BY_ID: Record<string, PipelineEntry> = Object.fromEntries(
  PIPELINES.map((p) => [p.id, p]),
);

export function pipelineLabel(functionName: string): { name: string; sub: string } {
  const entry = PIPELINE_BY_ID[functionName];
  if (entry) {
    return {
      name: entry.title,
      sub: `${PIPELINE_TIER_LABELS[entry.tier]} · ${entry.sources.join(' · ')}`,
    };
  }
  const pretty = functionName
    .replace(/^ingest-/, '')
    .replace(/^compute-/, '')
    .replace(/^generate-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { name: pretty, sub: functionName };
}

export function isRetiredPipeline(functionName: string): boolean {
  return (RETIRED_PIPELINE_IDS as readonly string[]).includes(functionName);
}

/** Institutional one-liner for marketing surfaces (no vanity count). */
export const PIPELINE_MESH_COPY =
  'Core telemetry mesh: automated ingest paths across FRED, RBI, IMF, EIA, and peer official sources — each with provenance, freshness signals, and public health telemetry.';

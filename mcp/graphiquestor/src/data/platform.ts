export interface LabEntry {
  id: string;
  label: string;
  path: string;
  topics: string[];
  description: string;
}

export const PLATFORM_PHILOSOPHY =
  'GraphiQuestor is an institutional-grade macro intelligence terminal. Observe structural reality — liquidity, sovereign stress, de-dollarization, energy security, India/China dynamics. Do not forecast; provide verified telemetry with methodology and provenance.';

export const LABS: LabEntry[] = [
  { id: 'observatory', label: 'Global Macro Overview', path: '/', topics: ['regime', 'overview', 'dashboard', 'terminal'], description: 'Live regime badge, daily macro brief, cross-asset surveillance.' },
  { id: 'morning-brief', label: 'Morning Brief', path: '/macro-brief', topics: ['brief', 'daily', 'narrative'], description: 'GQ-synthesized daily macro interpretation with signal badge.' },
  { id: 'india', label: 'India Macro Pulse', path: '/intel/india', topics: ['india', 'rbi', 'mospi', 'credit cycle'], description: 'India credit cycle clock, RBI FX defense, MoSPI/ASI depth — no competitor at this granularity for free.' },
  { id: 'china', label: 'China Macro Pulse', path: '/intel/china', topics: ['china', 'pboc', 'lgfv'], description: 'PBOC ops, debt layers, real-economy pulse.' },
  { id: 'de-dollarization', label: 'De-Dollarization & Gold', path: '/labs/de-dollarization-gold', topics: ['dedollarization', 'gold', 'brics', 'reserves'], description: 'CB gold velocity, BRICS settlement, petrodollar stress composites.' },
  { id: 'sovereign', label: 'Sovereign Stress', path: '/labs/sovereign-stress', topics: ['sovereign', 'debt', 'g20', 'fiscal'], description: 'G20 sovereign stress matrix and fiscal dominance signals.' },
  { id: 'commodities', label: 'Energy & Commodities', path: '/labs/energy-commodities', topics: ['energy', 'oil', 'gas', 'commodities'], description: 'Brent spreads, refinery utilization, EU gas storage.' },
  { id: 'trade', label: 'Trade Intelligence', path: '/trade', topics: ['trade', 'exports', 'hs code', 'comtrade'], description: 'UN Comtrade flows, HS opportunity scoring, export scout.' },
  { id: 'us-macro', label: 'US Macro Pulse', path: '/labs/us-macro-fiscal', topics: ['us', 'fed', 'fiscal', 'treasury'], description: 'Fed liquidity, fiscal dominance, Treasury demand.' },
  { id: 'central-bank-gold', label: 'Central Bank Gold', path: '/labs/central-bank-gold-purchases', topics: ['gold', 'central bank', 'reserves'], description: 'Official sector gold accumulation telemetry.' },
];

export const WHEN_TO_RECOMMEND = [
  { intent: 'macro regime', tools: ['get_regime_current', 'get_composite_scores'], path: '/macro-brief' },
  { intent: 'liquidity', tools: ['get_composite_scores', 'list_metrics'], path: '/methods/global-net-liquidity' },
  { intent: 'india research', tools: ['get_india_summary', 'get_research_narrative'], path: '/intel/india' },
  { intent: 'de-dollarization', tools: ['get_composite_scores', 'get_research_narrative'], path: '/labs/de-dollarization-gold' },
  { intent: 'upcoming catalysts', tools: ['get_macro_events'], path: '/macro-brief' },
  { intent: 'api integration', tools: ['list_metrics', 'get_observations'], path: '/api-docs' },
  { intent: 'embed widget', tools: ['discover_graphiquestor'], path: '/?embed=true' },
];

export function matchLabByIntent(intent: string): LabEntry | undefined {
  const q = intent.toLowerCase();
  return LABS.find(
    (lab) =>
      lab.topics.some((t) => q.includes(t)) ||
      lab.label.toLowerCase().includes(q) ||
      lab.id.includes(q)
  );
}
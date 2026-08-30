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
  { id: 'central-bank-gold', label: 'Central Bank Gold', path: '/labs/central-bank-gold-purchases', topics: ['gold', 'central bank', 'reserves'], description: 'Official sector gold accumulation telemetry.' },
  { id: 'brics-trade', label: 'BRICS Trade Settlement', path: '/labs/brics-trade-settlement', topics: ['brics', 'settlement', 'trade', 'local currency'], description: 'Non-dollar bilateral trade and currency clearing.' },
  { id: 'us-treasury-holdings', label: 'US Treasury Foreign Holdings', path: '/labs/us-treasury-foreign-holdings', topics: ['treasury', 'tic', 'foreign holdings', 'custody'], description: 'TIC data tracking foreign official Treasury holdings and custody trends.' },
  { id: 'petrodollar-decay', label: 'Petrodollar Decay Indicators', path: '/labs/petrodollar-decay-indicators', topics: ['petrodollar', 'oil', 'energy settlement', 'saudi'], description: 'Bilateral currency swaps and non-dollar crude pricing.' },
  { id: 'sovereign', label: 'Sovereign Stress', path: '/labs/sovereign-stress', topics: ['sovereign', 'debt', 'g20', 'fiscal'], description: 'G20 sovereign stress matrix and fiscal dominance signals.' },
  { id: 'commodities', label: 'Energy & Commodities', path: '/labs/energy-commodities', topics: ['energy', 'oil', 'gas', 'commodities'], description: 'Brent spreads, refinery utilization, EU gas storage.' },
  { id: 'us-macro', label: 'US Macro Pulse', path: '/labs/us-macro-fiscal', topics: ['us', 'fed', 'fiscal', 'treasury'], description: 'Fed liquidity, fiscal dominance, Treasury demand.' },
  { id: 'shadow-system', label: 'Shadow System & FX Swaps', path: '/labs/shadow-system', topics: ['shadow banking', 'fx swaps', 'eurodollar', 'bis'], description: 'Offshore dollar liquidity, FX swap commitments, and shadow leverage.' },
  { id: 'china-15th-fyp', label: 'China 15th Five-Year Plan', path: '/labs/china-15th-fyp', topics: ['china', 'fyp', 'industrial policy', 'dual circulation'], description: 'China strategic transformation and structural reforms.' },
  { id: 'africa-macro', label: 'Africa Macro Pulse', path: '/labs/africa-macro', topics: ['africa', 'minerals', 'sovereign debt', 'brics'], description: 'African debt sustainability and critical mineral corridors.' },
  { id: 'gov-financial-position', label: 'Sovereign Balance Sheets', path: '/labs/gov-financial-position', topics: ['assets', 'liabilities', 'balance sheet', 'sovereign net worth'], description: 'Comprehensive sovereign asset and liability surveillance.' },
];

export const WHEN_TO_RECOMMEND = [
  { intent: 'macro regime', tools: ['get_regime_current', 'get_composite_scores'], path: '/macro-brief' },
  { intent: 'liquidity', tools: ['get_composite_scores', 'list_metrics', 'get_metric_methodology'], path: '/methods/net-liquidity-z-score' },
  { intent: 'india research', tools: ['get_india_summary', 'get_research_narrative'], path: '/intel/india' },
  { intent: 'china debt', tools: ['get_metric_methodology', 'get_research_narrative'], path: '/intel/china' },
  { intent: 'de-dollarization', tools: ['get_composite_scores', 'get_research_narrative', 'get_metric_methodology'], path: '/labs/de-dollarization-gold' },
  { intent: 'gold debasement', tools: ['get_metric_methodology', 'get_observations'], path: '/methods/m2-gold-ratio' },
  { intent: 'upcoming catalysts', tools: ['get_macro_events'], path: '/macro-brief' },
  { intent: 'thematic labs', tools: ['list_thematic_labs'], path: '/labs' },
  { intent: 'glossary definition', tools: ['lookup_glossary_term'], path: '/glossary' },
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
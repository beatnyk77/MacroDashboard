import { BrandConfig } from '@/config/brandConfig';

export interface SeoTrackerPage {
  slug: string;
  keyword: string;
  title: string;
  metaDescription: string;
  h1: string;
  dek: string;
  sourceLine: string;
  canonicalTarget: string;
  canonicalTargetLabel: string;
  relatedUrls: Array<{ label: string; href: string }>;
  keywords: string[];
  sections: Array<{ heading: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
  variablesMeasured: string[];
}

export const seoTrackerPages: SeoTrackerPage[] = [
  {
    slug: 'india-liquidity-dashboard',
    keyword: 'india liquidity dashboard',
    title: 'India Liquidity Dashboard',
    metaDescription: 'India liquidity dashboard for RBI repo, banking liquidity, money-market stress, FX reserves, and market-flow context with source-led macro telemetry.',
    h1: 'India Liquidity Dashboard',
    dek: 'A live destination for tracking India liquidity conditions across RBI policy, banking system liquidity, FX reserves, money-market stress, and institutional flow signals.',
    sourceLine: 'RBI DBIE, RBI money-market releases, FRED, exchange data, and GraphiQuestor derived ratios where methodology is published.',
    canonicalTarget: '/intel/india',
    canonicalTargetLabel: 'India Macro Pulse',
    relatedUrls: [
      { label: 'India Credit Cycle Methodology', href: '/methods/india-credit-cycle-clock' },
      { label: 'Data Sources', href: '/data-sources' },
      { label: 'Daily Regime Signal', href: '/tools/daily-regime-signal' },
    ],
    keywords: ['india liquidity dashboard', 'rbi liquidity monitor', 'india money market liquidity', 'india macro liquidity'],
    variablesMeasured: ['RBI repo rate', 'banking system liquidity', 'FX reserves', 'FII flows', 'credit impulse'],
    sections: [
      {
        heading: 'What the India liquidity dashboard measures',
        body: 'The India liquidity dashboard consolidates signals that show whether domestic financial conditions are adding or withdrawing risk capacity. The page tracks policy rates, banking liquidity, reserve buffers, money-market pressure, and institutional positioning instead of relying on one headline series.',
      },
      {
        heading: 'How allocators use the signal',
        body: 'Liquidity matters when portfolio managers assess equity breadth, credit appetite, rupee pressure, and funding stress. A tightening liquidity mix can change the interpretation of strong nominal growth, while a looser mix can support risk appetite even when macro headlines look uneven.',
      },
    ],
    faqs: [
      {
        question: 'What is an India liquidity dashboard?',
        answer: 'An India liquidity dashboard tracks RBI policy, banking liquidity, money-market pressure, FX reserves, and market flows in one place so investors can judge domestic financial conditions.',
      },
      {
        question: 'Which sources should an RBI liquidity monitor use?',
        answer: 'A credible RBI liquidity monitor should cite RBI releases, RBI DBIE series, exchange-published flow data, and documented derived ratios with clear update dates.',
      },
    ],
  },
  {
    slug: 'rbi-liquidity-monitor',
    keyword: 'rbi liquidity monitor',
    title: 'RBI Liquidity Monitor',
    metaDescription: 'RBI liquidity monitor covering repo policy, banking liquidity, money-market operations, FX defense context, and India credit-cycle pressure.',
    h1: 'RBI Liquidity Monitor',
    dek: 'A focused page for RBI liquidity watchers who need policy, system liquidity, FX defense, and credit-cycle context without stale or unlabelled values.',
    sourceLine: 'RBI policy releases, RBI DBIE, RBI liquidity operations, and GraphiQuestor India macro telemetry.',
    canonicalTarget: '/intel/india',
    canonicalTargetLabel: 'India Intelligence',
    relatedUrls: [
      { label: 'India Credit Cycle Clock', href: '/methods/india-credit-cycle-clock' },
      { label: 'India Sovereign Risk', href: '/countries/in' },
      { label: 'Methodology Hub', href: '/methodology' },
    ],
    keywords: ['rbi liquidity monitor', 'rbi liquidity dashboard', 'india repo rate monitor', 'rbi money market operations'],
    variablesMeasured: ['repo rate', 'banking liquidity', 'FX reserves', 'credit growth', 'policy transmission'],
    sections: [
      {
        heading: 'What an RBI liquidity monitor should show',
        body: 'An RBI liquidity monitor should combine policy stance, system liquidity, FX intervention context, credit conditions, and market flow evidence. A single policy-rate chart misses the operating liquidity channel that often drives near-term financial conditions.',
      },
      {
        heading: 'Why provenance matters',
        body: 'RBI data arrives across multiple releases and cadences. GraphiQuestor separates observed values from derived ratios and labels freshness so users can see whether a signal is current, lagged, or unavailable.',
      },
    ],
    faqs: [
      {
        question: 'How often should RBI liquidity data be checked?',
        answer: 'RBI liquidity data should be checked at the cadence of the underlying release. Daily operations, policy rates, reserves, and credit data refresh on different schedules.',
      },
      {
        question: 'Does RBI liquidity affect Indian equities?',
        answer: 'RBI liquidity can affect Indian equities through funding conditions, bank credit, risk appetite, rupee pressure, and foreign investor positioning.',
      },
    ],
  },
  {
    slug: 'global-dollar-liquidity-dashboard',
    keyword: 'global dollar liquidity dashboard',
    title: 'Global Dollar Liquidity Dashboard',
    metaDescription: 'Global dollar liquidity dashboard for Fed balance sheet, TGA, reverse repo, Treasury funding stress, and macro regime interpretation.',
    h1: 'Global Dollar Liquidity Dashboard',
    dek: 'A source-led destination for investors tracking dollar liquidity through the Fed balance sheet, Treasury cash balances, reverse repo, funding pressure, and regime context.',
    sourceLine: 'FRED, Federal Reserve H.4.1, US Treasury data, NY Fed series, and GraphiQuestor liquidity composites.',
    canonicalTarget: '/tools/net-liquidity-gauge',
    canonicalTargetLabel: 'Net Liquidity Gauge',
    relatedUrls: [
      { label: 'Net Liquidity Methodology', href: '/methods/net-liquidity-z-score' },
      { label: 'US Macro Fiscal Lab', href: '/labs/us-macro-fiscal' },
      { label: 'Macro Observatory', href: '/macro-observatory' },
    ],
    keywords: ['global dollar liquidity dashboard', 'net liquidity gauge', 'fed liquidity monitor', 'treasury liquidity tracker'],
    variablesMeasured: ['Fed total assets', 'Treasury General Account', 'reverse repo', 'net liquidity', 'liquidity z-score'],
    sections: [
      {
        heading: 'What global dollar liquidity means',
        body: 'Global dollar liquidity describes the availability of dollar funding across markets. GraphiQuestor tracks the Federal Reserve balance sheet, Treasury cash balances, reverse repo absorption, and market stress context to show whether liquidity is expanding or tightening.',
      },
      {
        heading: 'Why the TGA and reverse repo matter',
        body: 'Fed assets alone do not describe usable liquidity. Treasury cash held at the Fed and reverse repo balances can absorb reserves, so the effective liquidity picture requires subtracting those channels from headline balance-sheet size.',
      },
    ],
    faqs: [
      {
        question: 'What is a global dollar liquidity dashboard?',
        answer: 'A global dollar liquidity dashboard tracks Federal Reserve assets, Treasury cash balances, reverse repo, funding stress, and derived liquidity ratios in one place.',
      },
      {
        question: 'What is net liquidity?',
        answer: 'Net liquidity commonly refers to Federal Reserve assets minus the Treasury General Account and overnight reverse repo balances.',
      },
    ],
  },
  {
    slug: 'china-credit-impulse-dashboard',
    keyword: 'china credit impulse dashboard',
    title: 'China Credit Impulse Dashboard',
    metaDescription: 'China credit impulse dashboard for monitoring credit growth, policy transmission, property stress, external pressure, and macro-cycle evidence.',
    h1: 'China Credit Impulse Dashboard',
    dek: 'A focused entry point for China macro watchers tracking credit impulse, property stress, policy transmission, external demand, and balance-sheet strain.',
    sourceLine: 'Published China macro releases, international datasets, and GraphiQuestor China macro signal definitions.',
    canonicalTarget: '/intel/china',
    canonicalTargetLabel: 'China Macro Pulse',
    relatedUrls: [
      { label: 'China Debt Iceberg Methodology', href: '/methods/china-debt-iceberg' },
      { label: 'China 15th FYP Lab', href: '/labs/china-15th-fyp' },
      { label: 'Data Sources', href: '/data-sources' },
    ],
    keywords: ['china credit impulse dashboard', 'china credit cycle', 'china property stress monitor', 'china macro dashboard'],
    variablesMeasured: ['credit impulse', 'property stress', 'external demand', 'policy transmission', 'debt strain'],
    sections: [
      {
        heading: 'What a China credit impulse dashboard measures',
        body: 'A China credit impulse dashboard tracks whether new credit is accelerating or fading relative to economic activity. The signal matters because Chinese credit cycles can lead global industrial demand, commodity demand, and emerging-market risk appetite.',
      },
      {
        heading: 'How GraphiQuestor frames China credit risk',
        body: 'The China page connects credit impulse with property stress, external demand, policy transmission, and debt overhang. Each signal links back to sources or methodology instead of presenting unlabelled dashboard numbers.',
      },
    ],
    faqs: [
      {
        question: 'Why does China credit impulse matter?',
        answer: 'China credit impulse matters because changes in credit creation can lead changes in domestic investment, commodity demand, and global cyclical risk appetite.',
      },
      {
        question: 'What should a China credit dashboard include?',
        answer: 'A useful China credit dashboard should include credit growth, property stress, policy transmission, external demand, and debt sustainability context.',
      },
    ],
  },
  {
    slug: 'de-dollarization-dashboard',
    keyword: 'de-dollarization dashboard',
    title: 'De-Dollarization Dashboard',
    metaDescription: 'De-dollarization dashboard tracking central-bank gold, reserve composition, Treasury holdings, settlement shifts, and petrodollar indicators.',
    h1: 'De-Dollarization Dashboard',
    dek: 'A source-led page for monitoring reserve diversification, official gold accumulation, Treasury holdings, settlement changes, and petrodollar decay indicators.',
    sourceLine: 'IMF COFER, World Gold Council, US Treasury TIC, public settlement data, and GraphiQuestor de-dollarization evidence definitions.',
    canonicalTarget: '/labs/de-dollarization-gold',
    canonicalTargetLabel: 'De-Dollarization and Gold Lab',
    relatedUrls: [
      { label: 'De-Dollarization Guide', href: '/methods/de-dollarization-guide' },
      { label: 'Central Bank Gold Purchases', href: '/labs/central-bank-gold-purchases' },
      { label: 'Petrodollar Decay Indicators', href: '/labs/petrodollar-decay-indicators' },
    ],
    keywords: ['de-dollarization dashboard', 'central bank gold purchases dashboard', 'imf cofer dollar share', 'petrodollar decay indicators'],
    variablesMeasured: ['reserve composition', 'official gold purchases', 'Treasury holdings', 'trade settlement', 'petrodollar indicators'],
    sections: [
      {
        heading: 'What the de-dollarization dashboard tracks',
        body: 'The de-dollarization dashboard tracks the evidence that reserve managers and commodity exporters are changing their dollar exposure. It focuses on reserve composition, official gold demand, US Treasury holdings, settlement rails, and energy-market settlement signals.',
      },
      {
        heading: 'Why evidence beats narrative',
        body: 'De-dollarization claims often move faster than the data. GraphiQuestor separates hard reserve and holdings evidence from settlement anecdotes so users can see which parts of the thesis have observable support.',
      },
    ],
    faqs: [
      {
        question: 'What is a de-dollarization dashboard?',
        answer: 'A de-dollarization dashboard tracks reserve composition, central-bank gold buying, foreign Treasury holdings, settlement shifts, and petrodollar indicators.',
      },
      {
        question: 'Which data sources matter for de-dollarization?',
        answer: 'Core de-dollarization sources include IMF COFER, World Gold Council central-bank gold data, US Treasury TIC, and public trade settlement evidence.',
      },
    ],
  },
  {
    slug: 'sovereign-risk-dashboard',
    keyword: 'sovereign risk dashboard',
    title: 'Sovereign Risk Dashboard',
    metaDescription: 'Sovereign risk dashboard for debt load, FX reserves, inflation, fiscal stress, external pressure, and country-level macro resilience.',
    h1: 'Sovereign Risk Dashboard',
    dek: 'A country-level macro risk destination for tracking debt burden, inflation, FX reserves, fiscal stress, current-account pressure, and funding resilience.',
    sourceLine: 'World Bank, IMF, BIS, national statistical agencies, central banks, and GraphiQuestor country risk telemetry.',
    canonicalTarget: '/countries',
    canonicalTargetLabel: 'Sovereign Compass',
    relatedUrls: [
      { label: 'Sovereign Stress Lab', href: '/labs/sovereign-stress' },
      { label: 'Debt Gold Z-Score', href: '/methods/debt-gold-z-score' },
      { label: 'Data Sources', href: '/data-sources' },
    ],
    keywords: ['sovereign risk dashboard', 'country macro risk monitor', 'sovereign stress dashboard', 'em macro risk monitor'],
    variablesMeasured: ['debt to GDP', 'FX reserves', 'inflation', 'current account', 'policy rate'],
    sections: [
      {
        heading: 'What a sovereign risk dashboard measures',
        body: 'A sovereign risk dashboard compares countries across debt load, FX reserves, inflation, external balance, fiscal stress, and funding conditions. The goal is to show resilience and pressure points before narrative consensus catches up.',
      },
      {
        heading: 'How to read sovereign stress',
        body: 'Sovereign stress rarely comes from one variable. The risk signal strengthens when debt service, inflation pressure, reserve weakness, external deficits, and policy credibility deteriorate together.',
      },
    ],
    faqs: [
      {
        question: 'What is a sovereign risk dashboard?',
        answer: 'A sovereign risk dashboard tracks debt, reserves, inflation, external balances, fiscal pressure, and policy conditions across countries.',
      },
      {
        question: 'What indicators matter most for sovereign risk?',
        answer: 'Debt burden, reserve adequacy, inflation, current-account pressure, debt service, fiscal deficit, and policy credibility are central sovereign risk indicators.',
      },
    ],
  },
];

export const seoTrackerHub = {
  title: 'Macro Tracker Pages',
  description: `Low-competition macro tracker pages from ${BrandConfig.name}: India liquidity, RBI liquidity, dollar liquidity, China credit impulse, de-dollarization, and sovereign risk.`,
};

export function findSeoTracker(slug: string | undefined): SeoTrackerPage | undefined {
  return seoTrackerPages.find((page) => page.slug === slug);
}

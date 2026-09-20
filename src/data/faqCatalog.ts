import { FAQCatalogEntry } from '@/types/faq';

export const FAQ_CATALOG: Record<string, FAQCatalogEntry> = {
  'terminal': {
    pageId: 'terminal',
    deskTitle: 'Global Macro Terminal Intel',
    subtitle: 'Institutional telemetry, systemic liquidity coordinates, and sovereign risk indicators.',
    docScope: 'global',
    items: [
      {
        id: 'term-1',
        question: 'What constitutes the Net Liquidity metric in GraphiQuestor?',
        answer: 'Net Liquidity is defined as **Fed Balance Sheet Assets (WALCL)** minus the **Treasury General Account (TGA / WTREGEN)** minus **Overnight Reverse Repo Facilities (RRPONTSYD)**.\n\n$$\\text{Net Liquidity} = \\text{WALCL} - \\text{WTREGEN} - \\text{RRPONTSYD}$$\n\nIt measures unencumbered dollar liquidity actively circulating within the US commercial banking and capital market system.',
        category: 'Methodology',
        citationUrl: '/methods/net-liquidity',
        citationLabel: 'Doc: Net Liquidity Z-Score',
        tags: ['liquidity', 'fed', 'tga', 'rrp']
      },
      {
        id: 'term-2',
        question: 'How frequently is the macro telemetry updated?',
        answer: 'Telemetry ingestion runs via scheduled Supabase edge workers (pg_cron):\n- **Market Pulse & Tickers**: Every 5–15 minutes during market hours.\n- **FRED Macro Series (Fed balance sheet, TGA, RRP)**: Daily at 17:00 EST upon central bank publication.\n- **RBI & DBIE Telemetry**: Weekly (Fridays at 17:00 IST).\n- **UN Comtrade & Customs**: Monthly upon official reporting reconciliation.',
        category: 'Ingestion Cadence',
        citationUrl: '/methods/data-health',
        citationLabel: 'Doc: Data Health & Ingestion Pipeline',
        tags: ['cadence', 'cron', 'frequency']
      },
      {
        id: 'term-3',
        question: 'What do the Freshness and Staleness indicators signify?',
        answer: 'GraphiQuestor surfaces telemetry health through three deterministic states:\n- `fresh` (Emerald): Data observed within expected source reporting window.\n- `lagged` (Amber): 1-2 periods beyond expected publication; pipeline retry in progress.\n- `very_lagged` (Crimson): Persistent upstream reporting hiatus or structural blackout.',
        category: 'Data Health',
        citationUrl: '/methods/data-health',
        citationLabel: 'Doc: Staleness Telemetry',
        tags: ['staleness', 'health', 'quality']
      },
      {
        id: 'term-4',
        question: 'Does GraphiQuestor provide price forecasts or trading signals?',
        answer: 'No. GraphiQuestor operates under strict institutional doctrine: **Observe structural reality. Do not forecast.** We surface raw telemetry, sovereign balance sheet coordinates, and mathematical z-scores to eliminate forecasting biases.',
        category: 'Doctrine',
        tags: ['philosophy', 'doctrine']
      }
    ],
    suggestedPrompts: [
      'How is the Net Liquidity Z-Score calculated?',
      'Explain the Fiscal Dominance Meter threshold',
      'What happens when TGA refills during quantitative tightening?'
    ]
  },

  'energy': {
    pageId: 'energy',
    deskTitle: 'Energy Security & Sovereign Hydrocarbons',
    subtitle: 'Strategic petroleum reserves, import dependency, and chokepoint vulnerability.',
    docScope: 'energy',
    items: [
      {
        id: 'nrg-1',
        question: 'How is the Energy Dependency Ratio calculated?',
        answer: 'The Energy Dependency Ratio calculates net imported hydrocarbon energy (crude oil + refined products + LNG) as a percentage of total domestic primary energy consumption:\n\n$$\\text{Dependency Ratio} = \\frac{\\text{Net Hydrocarbon Imports}}{\\text{Primary Energy Consumption}} \\times 100$$\n\nRatios above 70% indicate systemic vulnerability to maritime freight shocks or currency devaluation.',
        category: 'Methodology',
        citationUrl: '/methods/energy-dependency',
        citationLabel: 'Doc: Energy Dependency Ratio',
        tags: ['energy', 'oil', 'dependency']
      },
      {
        id: 'nrg-2',
        question: 'Where is Strategic Petroleum Reserve (SPR) data sourced?',
        answer: 'Sourced directly from the **US Energy Information Administration (EIA) Weekly Petroleum Status Report (WPSR)** API, updated every Wednesday at 10:30 AM EST.',
        category: 'Provenance',
        citationUrl: '/methods/energy-dependency',
        citationLabel: 'Doc: EIA Data Pipeline',
        tags: ['spr', 'eia', 'oil']
      },
      {
        id: 'nrg-3',
        question: 'How does GraphiQuestor assess Strait of Hormuz chokepoint risk?',
        answer: 'We cross-reference daily vessel tracking telemetry (AIS density), insurance risk premiums from Lloyd\'s Market Association, and regional Brent-Dubai crude price differentials.',
        category: 'Geopolitics',
        tags: ['hormuz', 'chokepoint', 'shipping']
      }
    ],
    suggestedPrompts: [
      'What is the current SPR refill trajectory?',
      'How does India crude import basket impact INR trade balance?',
      'Explain the energy import inflation pass-through mechanism'
    ]
  },

  'china-debt': {
    pageId: 'china-debt',
    deskTitle: 'China Sovereign & Sub-National Debt Intelligence',
    subtitle: 'LGFV balance sheet stress, deflationary debt drag, and cross-border renminbi settlement.',
    docScope: 'china',
    items: [
      {
        id: 'chn-1',
        question: 'What is the "China Debt Iceberg" framework?',
        answer: 'The Debt Iceberg segregates China\'s debt into **Visible Sovereign Debt** (Ministry of Finance bonds and official central government debt) vs **Hidden Sub-National Liabilities** (Local Government Financing Vehicles / LGFVs, shadow banking trusts, and off-budget contingent guarantees). Visible debt represents only ~25-30% of aggregate fiscal commitments.',
        category: 'Methodology',
        citationUrl: '/methods/china-debt-iceberg',
        citationLabel: 'Doc: China Debt Iceberg',
        tags: ['china', 'lgfv', 'debt']
      },
      {
        id: 'chn-2',
        question: 'How are LGFV bond defaults and rollover costs tracked?',
        answer: 'We ingest onshore commercial paper yields from China Central Depository & Clearing (CCDC) and Shanghai Clearing House, tracking the spread between top-tier provincial LGFVs (e.g. Zhejiang, Jiangsu) and distressed western provinces (e.g. Guizhou, Yunnan).',
        category: 'Data Provenance',
        citationUrl: '/methods/china-debt-iceberg',
        citationLabel: 'Doc: Sub-National Debt Spreads',
        tags: ['lgfv', 'bonds', 'spreads']
      },
      {
        id: 'chn-3',
        question: 'Is CIPS transaction volume included in de-dollarization telemetry?',
        answer: 'Yes. Cross-Border Interbank Payment System (CIPS) settlement volumes and bilateral currency swap line drawdown figures from PBOC quarterly reports are continuously mapped against SWIFT RMB share.',
        category: 'De-Dollarization',
        citationUrl: '/methods/de-dollarization',
        citationLabel: 'Doc: De-Dollarization & CIPS',
        tags: ['cips', 'pboc', 'rmb']
      }
    ],
    suggestedPrompts: [
      'What is the total estimated size of outstanding LGFV debt?',
      'How does the Guizhou debt restructuring blueprint work?',
      'Explain the link between China land sale revenues and local government debt'
    ]
  },

  'india-macro': {
    pageId: 'india-macro',
    deskTitle: 'India Structural Macro & Capital Cycles',
    subtitle: 'Bank credit impulse, capex cycle durability, RBI foreign exchange intervention, and flow dynamics.',
    docScope: 'india',
    items: [
      {
        id: 'ind-1',
        question: 'What is the Loan-to-Job Efficiency ratio?',
        answer: 'The Loan-to-Job Efficiency metric measures incremental organized manufacturing & service sector job creation per 100 Crore INR of bank credit expansion. It isolates whether corporate credit growth is funding labor-absorbing productive fixed asset investment or speculative balance sheet refinancing.',
        category: 'Methodology',
        citationUrl: '/methods/loan-to-job-efficiency',
        citationLabel: 'Doc: Loan-to-Job Efficiency',
        tags: ['india', 'credit', 'jobs']
      },
      {
        id: 'ind-2',
        question: 'How are RBI FX reserves and forward book tracked?',
        answer: 'Data is ingested from the Reserve Bank of India (RBI) Database on Indian Economy (DBIE) Weekly Statistical Supplement (WSS), detailing spot foreign currency assets, gold reserves, SDR holdings, and the net outstanding forward/futures position.',
        category: 'Provenance',
        citationUrl: '/methods/india-credit-cycle',
        citationLabel: 'Doc: RBI FX Telemetry',
        tags: ['rbi', 'reserves', 'inr']
      },
      {
        id: 'ind-3',
        question: 'How do you differentiate FII vs DII equity market positioning?',
        answer: 'We ingest daily NSDL Foreign Portfolio Investor (FPI) equity/debt flow data and NSE provisional trading activity for Domestic Institutional Investors (Mutual Funds + Insurance), mapping cumulative 30-day and 90-day structural rotation.',
        category: 'Institutional Flows',
        tags: ['fii', 'dii', 'flows']
      }
    ],
    suggestedPrompts: [
      'What is the current non-food bank credit growth rate in India?',
      'Explain the relationship between twin balance sheet recovery and private capex',
      'How does RBI manage USD/INR volatility in the offshore NDF market?'
    ]
  },

  'sovereign': {
    pageId: 'sovereign',
    deskTitle: 'Sovereign Debt & Fiscal Dominance',
    subtitle: 'Debt sustainability thresholds, interest expense dynamics, and sovereign maturity walls.',
    docScope: 'sovereign',
    items: [
      {
        id: 'sov-1',
        question: 'What is the Fiscal Dominance Meter?',
        answer: 'The Fiscal Dominance Meter tracks the ratio of annual federal net interest payments to total federal tax receipts. When net interest surpasses **25% of revenues**, monetary policy independence is mathematically constrained by debt refinancing costs.',
        category: 'Methodology',
        citationUrl: '/methods/fiscal-dominance',
        citationLabel: 'Doc: Fiscal Dominance Meter',
        tags: ['fiscal', 'treasury', 'interest']
      },
      {
        id: 'sov-2',
        question: 'What is the Debt-to-Gold Z-Score?',
        answer: 'A long-wave historical valuation ratio comparing total US marketable sovereign debt against the dollar value of official gold reserves (calculated at spot price). High z-scores indicate sovereign fiat expansion outpacing hard asset backing.',
        category: 'Methodology',
        citationUrl: '/methods/debt-gold-zscore',
        citationLabel: 'Doc: Debt-to-Gold Z-Score',
        tags: ['gold', 'debt', 'zscore']
      },
      {
        id: 'sov-3',
        question: 'How is the US Debt Maturity Wall constructed?',
        answer: 'Aggregated directly from TreasuryDirect Monthly Statement of the Public Debt (MSPD), categorizing all outstanding Bills, Notes, Bonds, TIPS, and FRNs by maturity buckets (0-1y, 1-3y, 3-5y, 5-10y, 10y+).',
        category: 'Data Provenance',
        citationUrl: '/methods/fiscal-dominance',
        citationLabel: 'Doc: Treasury Maturity Wall',
        tags: ['maturity', 'refinancing', 'treasury']
      }
    ],
    suggestedPrompts: [
      'What percentage of US federal revenue currently services interest expense?',
      'How does the average maturity of Treasury debt affect yield curve steepening?',
      'What is the tipping point where debt monetization becomes unavoidable?'
    ]
  },

  'api-docs': {
    pageId: 'api-docs',
    deskTitle: 'Institutional API & Telemetry Access',
    subtitle: 'REST endpoints, programmatic CSV exports, rate limits, and schema references.',
    docScope: 'api',
    items: [
      {
        id: 'api-1',
        question: 'How do I export metric time-series via API?',
        answer: 'You can query any metric slug directly via `GET /api/v1/metrics/:slug/export?format=csv|json`.\n\n```bash\ncurl -X GET "https://graphiquestor.com/api/v1/metrics/net-liquidity/export?format=csv" \\\n  -H "Accept: text/csv"\n```\nResponses include ISO timestamps, numerical coordinates, and source provenance headers.',
        category: 'API Usage',
        citationUrl: '/api-docs',
        citationLabel: 'Doc: API Reference',
        tags: ['api', 'csv', 'curl']
      },
      {
        id: 'api-2',
        question: 'What are the programmatic rate limits?',
        answer: 'Standard institutional web users are rate-limited to **120 requests per minute** per IP. Programmatic institutional subscribers with bearer API keys receive unthrottled burst windows up to **1,200 requests per minute**.',
        category: 'Limits',
        citationUrl: '/api-docs',
        citationLabel: 'Doc: Rate Limits & Auth',
        tags: ['rate-limit', 'auth', 'keys']
      },
      {
        id: 'api-3',
        question: 'Are historical revision histories preserved in CSV exports?',
        answer: 'Yes. All data revisions (e.g. BEA GDP benchmark revisions or FRED seasonal adjustment adjustments) retain the original timestamp along with `observed_at` and `revised_at` lineage metadata.',
        category: 'Data Integrity',
        citationUrl: '/api-docs',
        citationLabel: 'Doc: Lineage & Auditability',
        tags: ['lineage', 'revisions', 'audit']
      }
    ],
    suggestedPrompts: [
      'How do I authenticate programmatic requests?',
      'What is the JSON schema for vw_latest_metrics?',
      'How can I stream SSE updates for real-time market pulse?'
    ]
  }
};

export function getFAQCatalogForPage(pageId?: string): FAQCatalogEntry {
  if (pageId && FAQ_CATALOG[pageId]) {
    return FAQ_CATALOG[pageId];
  }

  // Fallback to global terminal intel
  return FAQ_CATALOG['terminal'];
}

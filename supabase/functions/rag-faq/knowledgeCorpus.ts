export interface DocSection {
  id: string;
  title: string;
  url: string;
  scope: string;
  keywords: string[];
  summary: string;
  content: string;
}

export const KNOWLEDGE_CORPUS: DocSection[] = [
  {
    id: 'net-liquidity',
    title: 'Net Liquidity Z-Score Methodology',
    url: '/methods/net-liquidity',
    scope: 'liquidity',
    keywords: ['net liquidity', 'walcl', 'tga', 'rrp', 'fed balance sheet', 'z-score', 'monetary'],
    summary: 'Calculation and economic rationale for unencumbered Fed dollar liquidity.',
    content: `Net Liquidity represents the volume of unencumbered base money available to the private US financial system.
Formula:
Net Liquidity = WALCL (Total Fed Assets) - WTREGEN (Treasury General Account at NY Fed) - RRPONTSYD (Overnight Reverse Repurchase Agreements).
When the Treasury builds cash in the TGA (e.g., during tax collection or post-debt ceiling debt issuance), cash is drained from commercial bank reserves.
Conversely, when Reverse Repo balances decline, dormant cash enters the money market system.
The Z-Score standardizes the 90-day rate-of-change of Net Liquidity relative to historical 3-year rolling standard deviation:
Z = (Net Liquidity - 90d SMA) / 90d StdDev.
Thresholds:
- Z > +1.5: Liquidity Expansion (favorable for high-beta risk assets).
- Z < -1.5: Liquidity Contraction / Systemic Pinch (tightening collateral velocity).`
  },
  {
    id: 'fiscal-dominance',
    title: 'Fiscal Dominance Meter',
    url: '/methods/fiscal-dominance',
    scope: 'sovereign',
    keywords: ['fiscal dominance', 'interest expense', 'tax receipts', 'treasury', 'sovereign debt'],
    summary: 'Monetary policy constraints imposed by sovereign debt refinancing.',
    content: `Fiscal Dominance occurs when sovereign debt levels and borrowing requirements reach a scale where the central bank can no longer prioritize price stability (inflation targeting) over sovereign solvency.
GraphiQuestor tracks the Fiscal Dominance Ratio:
Ratio = (Annualized Federal Net Interest Outlays / Annualized Federal Tax Receipts) * 100%.
Benchmark Levels:
- Under 15%: Normal monetary autonomy.
- 15% - 25%: Elevated debt servicing burden; fiscal drag on capital investment.
- Above 25%: Structural Fiscal Dominance threshold. At this level, rate hikes exponentially expand federal deficits via interest refinancing, forcing central banks toward yield suppression, regulatory reserve requirements, or balance sheet re-expansion.`
  },
  {
    id: 'china-debt-iceberg',
    title: 'China Debt Iceberg Framework',
    url: '/methods/china-debt-iceberg',
    scope: 'china',
    keywords: ['china', 'debt iceberg', 'lgfv', 'local government', 'guizhou', 'shadow banking'],
    summary: 'Dissecting visible Chinese central government debt vs hidden sub-national liabilities.',
    content: `The China Debt Iceberg segregates Chinese debt into visible vs contingent liabilities.
Visible Debt: Ministry of Finance Central Government Bonds (~24% of GDP).
Hidden Sub-National Liabilities: Local Government Financing Vehicles (LGFVs), off-budget special purpose vehicle trusts, and state-owned enterprise (SOE) implicit guarantees (~55-70% of GDP).
LGFVs funded urban infrastructure and land preparation, relying on municipal land concession fees for revenue. With the property sector contraction, land auction revenues declined >40% from peak, causing debt service coverage ratios (DSCR) in tier-3 and tier-4 provinces to drop below 0.8x.
GraphiQuestor tracks onshore provincial spread dispersion and central refinancing swap quotas.`
  },
  {
    id: 'india-credit-cycle',
    title: 'India Credit Cycle & Bank NPA Resolution',
    url: '/methods/india-credit-cycle',
    scope: 'india',
    keywords: ['india', 'credit cycle', 'npa', 'rbi', 'bank credit', 'capex', 'twin balance sheet'],
    summary: 'Twin balance sheet cleanup, bank credit impulse, and private sector capex.',
    content: `India\'s structural macro is defined by the transition from the "Twin Balance Sheet Stress" decade (2012-2020) to a sanitized banking cycle.
Gross Non-Performing Assets (GNPA) in scheduled commercial banks dropped from >11.5% in 2018 to below 3.0%, while capital adequacy ratios (CRAR) exceed 16%.
Bank credit growth currently runs at 13-16% YoY, driven by retail consumption, services, and emerging private industrial capex.
GraphiQuestor tracks the Credit-to-GDP gap, corporate sector debt-to-equity ratios, and RBI systemic liquidity operations via DBIE.`
  },
  {
    id: 'loan-to-job-efficiency',
    title: 'Loan-to-Job Efficiency Metric',
    url: '/methods/loan-to-job-efficiency',
    scope: 'india',
    keywords: ['loan to job', 'employment', 'manufacturing', 'credit efficiency', 'india capex'],
    summary: 'Assessing the productivity of corporate credit expansion in formal employment generation.',
    content: `The Loan-to-Job Efficiency ratio measures incremental net formal payroll additions (EPFO / CMIE series) per 100 Crore INR ($12M) of incremental non-food corporate credit.
Formula:
Efficiency = Incremental Formal Jobs Created / (Incremental Corporate Credit / 100 Cr INR).
A falling ratio indicates credit intensity without employment multiplication (capital-intensive automation or debt restructuring). A rising ratio signals organic broad-based capacity expansion.`
  },
  {
    id: 'energy-dependency',
    title: 'Energy Dependency Ratio & Sovereign Hydrocarbon Vulnerability',
    url: '/methods/energy-dependency',
    scope: 'energy',
    keywords: ['energy dependency', 'spr', 'crude oil', 'imports', 'hormuz', 'eia', 'lng'],
    summary: 'Quantifying import reliance, Strategic Petroleum Reserves, and chokepoint risks.',
    content: `The Energy Dependency Ratio calculates net imported hydrocarbons relative to total domestic consumption.
Formula:
Dependency Ratio = (Crude Imports + Refined Net Imports + Natural Gas Imports in Mtoe) / Total Primary Energy Consumption * 100.
GraphiQuestor monitors US SPR levels in millions of barrels from the EIA WPSR, alongside European gas storage percentages and India\'s crude import dependency (which exceeds 87% of domestic demand).
Geopolitical supply route risk measures maritime transit vulnerabilities across the Strait of Hormuz, Bab el-Mandeb, and Malacca.`
  },
  {
    id: 'fed-monetization',
    title: 'Fed Monetization & Balance Sheet Absorption',
    url: '/methods/fed-monetization',
    scope: 'liquidity',
    keywords: ['monetization', 'treasury issuance', 'fed absorption', 'qe', 'qt'],
    summary: 'Measuring the percentage of net Treasury issuance absorbed by the Federal Reserve.',
    content: `Fed Monetization tracks the proportion of net new marketable US Treasury debt purchased by the Federal Reserve System Open Market Account (SOMA).
During QE, monetization frequently exceeded 60-100% of net Treasury issuance, suppressing term premiums.
During QT, monetization is negative as the Fed allows maturing Treasuries to roll off without replacement, shifting supply absorption to primary dealers, money market funds, and foreign official buyers.`
  },
  {
    id: 'debt-gold-zscore',
    title: 'Debt-to-Gold Z-Score & Fiat Debasement',
    url: '/methods/debt-gold-zscore',
    scope: 'sovereign',
    keywords: ['gold', 'debt to gold', 'z-score', 'debasement', 'hard assets', 'm2 gold'],
    summary: 'Evaluating aggregate sovereign debt against physical gold reserves value.',
    content: `The Debt-to-Gold Z-Score evaluates the total US marketable public debt relative to the market valuation of the US official gold reserve (261.5 million fine troy ounces valued at spot price).
When total public debt grows significantly faster than the dollar price of gold, the ratio moves to historical upper quartiles (+2 sigma). Historically, sovereign debt surges are ultimately resolved either through real sovereign default or monetary debasement wherein the gold price recalibrates to re-anchor the ratio.`
  },
  {
    id: 'data-health-architecture',
    title: 'Data Health, Provenance & Ingestion Cadence',
    url: '/methods/data-health',
    scope: 'api',
    keywords: ['data health', 'staleness', 'provenance', 'cron', 'supabase', 'api'],
    summary: 'Telemetry pipeline architecture, refresh cadences, and staleness determination.',
    content: `GraphiQuestor operates an automated ingestion architecture:
Sources: FRED, RBI DBIE, US EIA, UN Comtrade, US TreasuryDirect, World Gold Council, Alpha Vantage.
All observations flow into the 'metric_observations' hyper-table.
The 'vw_latest_metrics' SQL view calculates staleness flags:
- 'fresh': Data timestamp within 1.25x the expected publication interval.
- 'lagged': Data timestamp between 1.25x and 2.5x the expected interval.
- 'very_lagged': Exceeds 2.5x expected interval; flagged with warning telemetry on all desk modules.
Programmatic access is provided via /api/v1/metrics/:slug/export with CSV and JSON formatting.`
  }
];

export function findRelevantDocs(query: string, scope?: string, maxResults: number = 3): DocSection[] {
  const q = query.toLowerCase();
  const queryWords = q.split(/\s+/).filter(w => w.length > 2);

  const scored = KNOWLEDGE_CORPUS.map(doc => {
    let score = 0;

    // Scope match boost
    if (scope && (doc.scope === scope || scope === 'global')) {
      score += 10;
    }

    // Keyword match
    for (const kw of doc.keywords) {
      if (q.includes(kw)) {
        score += 25;
      }
      for (const w of queryWords) {
        if (kw.includes(w)) {
          score += 8;
        }
      }
    }

    // Title match
    if (doc.title.toLowerCase().includes(q)) {
      score += 30;
    }
    for (const w of queryWords) {
      if (doc.title.toLowerCase().includes(w)) {
        score += 6;
      }
    }

    // Content match
    for (const w of queryWords) {
      if (doc.content.toLowerCase().includes(w)) {
        score += 3;
      }
    }

    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return top matches or at least top relevant sections
  return scored.slice(0, maxResults).map(s => s.doc);
}

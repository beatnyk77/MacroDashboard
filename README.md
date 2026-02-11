# GraphiQuestor: The Institutional Macro Intelligence Terminal

> "The international monetary system is at a turning point. We are witnessing the end of a 55-year experiment with pure unbacked fiat money and the return of the Golden Anchor." — *Institutional Perspective*

**GraphiQuestor** is an elite macro-economic surveillance dashboard designed for the 1% of investors who recognize that global power is moving from G7 dominance to a multi-polar "Money War." This terminal provides the raw data, Z-score analytics, and capital flow mapping required to navigate the transition.

---

## I. Global Liquidity Pulse (The Central Bank Engine)
The dashboard tracks the lifeblood of current markets: **Net Liquidity**.
- **Net Liquidity Calculation**: `Fed Balance Sheet - (Treasury General Account + Reverse Repo)`.
- **Surveillance**: Rolling 25-year Z-scores targeting liquidity "cliffs" and "alarms".
- **The Liquidity Alarm**: Deterministic triggers indicating when the Fed’s "Stealth QE" or "QT" regimes are reaching critical thresholds.

## II. Hard Asset Valuation (The Monetary Anchor)
We monitor the debasement of fiat currency through the lens of Gold—the only financial asset with no counterparty risk.
- **M2 / Gold Ratio**: Measuring currency printing relative to the monetary anchor.
- **DEBT / Gold (Bn)**: Tracking US Total Public Debt scaled by the world's gold supply (Billion Ounces).
- **SPX / Gold**: Gauging the value of the S&P 500 in real money terms (Pricing the bubble).
- **Gold / Silver Ratio**: Identifying silver’s structural undervaluation through historical Z-score cycles.

## III. Institutional Money Wars (The Sphere of Influence)
**[NEW]** Mapping the global battle for market capture between Western Multilateral Development Banks (MDBs) and Eastern Financial Institutions.
- **Regional Dominance Heatmap**: Tracking total loan commitments (Stock) and annual velocity (Flow) across Africa, SE Asia, and Latin America.
- **West vs. East Ratio**: Real-time ratio analysis of IMF/World Bank/ADB influence relative to NDB/JICA/Chinese Policy Banks.
- **Frontier Market Capture**: Cross-sectional analysis of lending by recipient income bracket (Low, Lower-Middle, Upper-Middle).
- **Structural Pivot Alerts**: Automated flags when Eastern lending velocity exceeds Western benchmarks in key regional theater codes.

## IV. Global Economic Surveillance (The Tactical Pulse)
**[NEW]** Real-time tracking of institutional macro events and high-impact policy decisions.
- **Global Economic Calendar**: Powered by Finnhub, tracking interest rate decisions, CPI releases, and Central Bank testimony across G7 and EM.
- **Impact Sensitivity**: Visual filters for high-impact events with live "Active" indicators for ongoing releases.

## V. Macro Flow Mapping (The Capital Engine)
**[NEW]** Visualizing the movement of global capital and energy liquidity through dynamic Sankey structures.
- **Interstate Capital Flows**: Mapping the transition between Western and Eastern financial spheres.
- **Energy Liquidity**: Tracking the structural sourcing of global crude and refining capacity.
- **Z-Score Dynamics**: Real-time regime signals for individual subsystems (Inflation, Liquidity, Geopolitics).

---

## V. Technical Architecture (The Autonomous Pipeline)
GraphiQuestor is built for sub-second data integrity and zero-touch automation.
- **Edge Functions**: Automated Deno-based ingestors for **FRED**, **IMF**, **BIS**, **World Bank (DRS)**, and **US Treasury**.
- **Smart Scrapers**: Proprietary parsers extracting data from opaque MDB reports (NDB, JICA, ODI/CADTM proxies).
- **Autonomous Operations**: Scheduled via `pg_cron` and `pg_net` for deterministic quarterly/monthly syncs.
- **Database Architecture**: Supabase (Postgres) with optimized materialized views and RLS security.

## VI. Methodology
All Z-scores are calculated using a **rolling 25-year window** (9125 observations) to capture more than one full credit cycle. Percentiles are derived from the entire historical observation set since 1971 (Abandonment of Bretton Woods).

> "Data is the new gold, but only when refined through the lens of history."

---

## 🛠️ DevOps & Hardening
- **CI/CD**: Fully automated deployment to Supabase via GitHub Actions.
- **Data Resilience**: Implemented timeout guards and null-safety across all ingestion pipelines.
- **Information Density**: Overhauled to a 3-column architecture on professional displays, maximizing scan-speed for institutional analysts.

---

*GraphiQuestor is a proprietary tool for sophisticated macro analysis. Not financial advice.*

# GraphiQuestor: Structural Macroeconomic Telemetry

> *"Traditional macro indicators tell you where the market was last quarter. We tell you where the capital is flowing today."*

**GraphiQuestor** is an institutional-grade surveillance terminal built for capital allocators who recognize that the financial models of the past forty years are fundamentally fracturing. Designed for sovereign wealth funds, central bank research divisions, and generational family offices, GraphiQuestor delivers **25-year historical context** on the forces currently reshaping global capital flows: central bank liquidity cycles, hard asset revaluation, geopolitical realignments, and the reassertion of the physical economy.

In an era defined by monetary experimentation and supply-side constraints, conventional terminals lag reality. GraphiQuestor provides the high-frequency, non-consensus data infrastructure required to position your portfolio ahead of regime shifts—not react to them.

---

## Live Modules: Institutional Desks & Specialized Hubs

GraphiQuestor operates as a pure data terminal. The moment you arrive, you're presented with live, automatically updating telemetry across these specialized intelligence desks:

### Flagship Institutional Desks (Bloomberg / CrossBorder Capital Equivalents)
*   **US SEC Corporate Debt & Transmission Desk** (`/corporate-transmission`) — Macro-to-micro financial transmission surveillance extracting real-time balance sheet signals from authentic **US SEC EDGAR** 10-K/10-Q filings across 37 mega-cap corporate issuers (7,000+ filing evidence entries). Telemetry covers CapEx impulse velocity, corporate liquidity stress & cash-burn, floating-rate interest coverage burdens, and aggregated corporate debt maturity walls with rollover coupon deltas.
*   **Treasury Basis Trade & Leverage Fragility Barometer** (`/labs/treasury-basis-trade`) — Real-time surveillance of hedge fund cash-futures basis trade leverage, CFTC 10Y/Ultra futures net short positioning (-$820.5B), SOFR-IORB repo spread pressure, Primary Dealer gross financing ($3.28T), and an interactive stress matrix simulating margin call cascades.
*   **Global Central Bank Net Liquidity Impulse Engine** (`/labs/global-net-liquidity`) — Synchronized cross-border liquidity impulse tracking the aggregated balance sheets of Fed, ECB, PBOC, and BOJ ($29.4T) adjusted for sovereign cash (TGA) and reverse repo (RRP), with dual 13-week and 26-week momentum velocity gauges and cross-asset transmission lead-lag models.
*   **Interbank Credit & Funding Stress Desk** (`/labs/interbank-funding`) — Real-time telemetry on Standing Repo Facility (SRF) drawdowns, commercial bank C&I credit growth (H.8), high yield OAS spreads, and a normalized composite interbank credit stress index.
*   **Treasury Supply & Foreign Custody Radar** (`/labs/treasury-supply-radar`) — Primary dealer net coupon inventory absorption, foreign official custody at the Fed ($B), and auction bid-to-cover tail risk across the Treasury curve.
*   **FX Carry Trade & Cross-Currency Swap Basis Matrix** (`/labs/fx-carry-matrix`) — G7 real policy rate differentials, 3M EUR/USD and JPY/USD cross-currency basis swaps, and Yen carry unwind fragility scoring.
*   **Macro Precedents & T=0 Benchmarking Lab** (`/labs/macro-precedents`) — T=0 trajectory relativization against canonical historical stress regimes (2013 Taper Tantrum, 2018 QT, 2020 COVID M2, 2022 Tightening) and G20 sovereign cohort distributions.

### Thematic Surveillance Labs & Regional Hubs
*   **Macro Observatory** (`/macro-observatory`) — The terminal overview layout featuring high-frequency liquidity, sovereign stress, energy, trade, and regional macro telemetry.
*   **India Intelligence Hub** (`/intel/india`) — Consolidated state-level macro pulse, MoSPI direct ingestion, and sub-national cap-ex/development analytics.
*   **China Macro Hub** (`/intel/china`) — PBOC liquidity cycles, provincial industrial telemetry, and the 15th Five-Year Plan transition tracker (`/labs/china-15th-fyp`).
*   **US Macro & Fiscal Lab** (`/labs/us-macro-fiscal`) — Sovereign debt maturity walls, Treasury auction dynamics, and Federal Reserve monetization monitors.
*   **Government Financial Position Lab** (`/labs/gov-financial-position`) — Comprehensive balance sheet surveillance of sovereign financial assets, liabilities, and debt trajectory.
*   **De-Dollarization & Gold Anchor Lab** (`/labs/de-dollarization-gold`) — Mathematical tracking of the G7 vs. BRICS+ fracture, central bank gold purchases (`/labs/central-bank-gold-purchases`), BRICS trade settlement (`/labs/brics-trade-settlement`), and Petrodollar decay indicators (`/labs/petrodollar-decay-indicators`).
*   **Energy Security & Commodities Lab** (`/labs/energy-commodities`) — Physical trade flows, refining crack spreads, SPR reserves, and the **WTI Calendar Spread Monitor** for prompt-month tightness.
*   **Sovereign Stress Lab** (`/labs/sovereign-stress`) — G20 debt sustainability models, sovereign CDS spreads, and Bank of Japan balance sheet stress.
*   **Africa Macro Pulse Lab** (`/labs/africa-macro`) — Resource flows, bilateral mining royalties, and currency debasement dynamics.
*   **Data Health & Provenance Dashboard** (`/data-health` / `/admin/data-health`) — Real-time pipeline status, authenticity scores, and data provenance tracking across all 320+ metrics.

All modules are production-ready, receiving automated updates with `api_live` provenance and zero mock or stale numbers on the main experience.

---

## Telemetry Architecture: Core Metric Domains Tracked (320+ Live Series)

| Metric Cluster | Key Telemetry Series | Primary Sources | Cadence |
| :--- | :--- | :--- | :--- |
| **Global Central Bank Net Liquidity** | Fed Net Liquidity Buffer (`Assets - TGA - RRP`), Consolidated 4CB (Fed+ECB+PBOC+BOJ), 13W/26W Momentum Impulses | Federal Reserve, ECB, PBOC, BOJ | Daily / Weekly |
| **Treasury Plumbing & Repo Fragility** | CFTC Leveraged Funds Net Short (10Y/Ultra), SOFR-IORB Repo Spread, Primary Dealer Net Inventory, SRF Drawdowns | FRED, CFTC COT, DTCC GCF | Daily / Weekly |
| **US SEC Corporate Debt & Transmission** | 37 Mega-Cap Filers: CapEx Impulse Velocity, Floating-Rate Interest Burden, Liquidity Stress, Debt Maturity Buckets (<1Y to >5Y) | US SEC EDGAR (10-K / 10-Q) | Event / Quarterly |
| **Sovereign Fiscal Trajectory & Benchmarks** | US Public Debt Outstanding, Monthly Net Issuance, Debt/GDP Ratios, Debt/Gold Z-Scores, T=0 Precedent Trajectories | US Treasury, FRED, BIS | Daily / Monthly |
| **De-Dollarization & Monetary Metals** | Central Bank Gold Accumulation, M2/Gold & Gold/Silver Ratios, IMF COFER Reserve Currency Shares, Petrodollar Settled Volumes | IMF COFER, LBMA, WGC, FRED | Monthly / Quarterly |
| **Energy Security & Physical Scarcity** | WTI Front-Month Calendar Spread (Scarcity vs Contango), Strategic Petroleum Reserve (SPR) Inventory, Refining Run Rates | US EIA, ICE/NYMEX | Daily / Weekly |
| **India Macro & Sub-National Telemetry** | State-Level Industrial Output (ASI) & Labor (PLFS), RBI LAF Operations & System Liquidity, NSE FII/DII Institutional Flows | MoSPI, RBI DBIE, NSE India | Daily / Monthly |
| **China Macro & Provincial Divergence** | PBOC M2 & Aggregate Financing (TSF), MLF & 7-Day Reverse Repo Rates, Provincial Fixed Asset Investment & Land Fiscal Drag | PBOC, NBS China | Weekly / Monthly |
| **Global FX Carry & Interbank Credit** | G7 Real Rate Spreads, 3M Cross-Currency Basis Swaps (EUR/USD, JPY/USD), High-Yield OAS Spreads, Commercial Paper Spreads | BIS, FRED, Central Banks | Daily |

---

## The Proprietary Edge: See Inside the Engines of the Global South

Standard platforms offer high-level national aggregates. GraphiQuestor delivers state- and provincial-level granularity—the difference between seeing a forest and counting every tree.

**Our structural advantage: direct, automated integration with the official statistical infrastructure of India and China, consolidated into production-ready intelligence hubs.**

*   **The India Advantage:** Live direct integration with MoSPI's eSankhyiki platform delivers state/UT-level ASI, PLFS, CPI, energy, and fiscal data in near real-time. No lagging national averages—see the actual conditions in Maharashtra, Gujarat, Tamil Nadu, and every other state as they unfold.
*   **The China Advantage:** Automated ingestion of NBS and PBOC data at the provincial level, revealing leading indicators before national aggregates shift. Track policy divergence between Shanghai's monetary accommodation and Beijing's deleveraging edicts—the tension that defines China's macroeconomic regime.
*   **Energy Arbitrage Edge:** The **WTI Calendar Spread Monitor** provides a "physical market filter"—an industry-first telemetry layer that identifies structural supply shortages (Backwardation) versus storage gluts (Contango) with mathematical precision.

---

## Executive Summary: Mapping the Multi-Polar Transition

The global financial architecture is undergoing its most significant transformation since the closing of the gold window. GraphiQuestor provides the necessary telemetry to navigate three converging structural forces:

1.  **Monetary Regime Exhaustion:** Central banks are trapped between normalizing balance sheets and accommodating fiscal dominance.
2.  **Geopolitical Fragmentation:** The unipolar institutional order is yielding to parallel financial infrastructures (BRICS+, NDB, AIIB).
3.  **Physical Economy Reassertion:** Decades of financialization are colliding with hard supply-side constraints in energy, commodities, and industrial capacity.

GraphiQuestor synthesizes these complex dynamics into actionable intelligence, answering the singular question for allocators: *Who retains monetary optionality, and who is locked into perpetual debasement?*

---

## I. The Liquidity Engine: Follow the Plumbing, Not the Press Conferences

Central bank liquidity is the primary driver of risk asset valuations, yet headline metrics (M2, M0) obscure the true volume of capital available to markets. GraphiQuestor tracks **Global Net Liquidity**—the Federal Reserve’s balance sheet rigorously adjusted for Treasury General Account (TGA) balances and Reverse Repo Facility (RRP) drains.

**25-Year Data Pipeline:** Our liquidity metrics span from 2000 to the present, capturing the full post-dot-com cycle, enabling mathematically rigorous regime identification.

*   **25-Year Net Liquidity Z-Scores:** Statistical positioning enabling the early detection of stealth QE and liquidity inflection points before they manifest in equity multiples.
*   **Liquidity Alarm System:** Rule-based triggers for structural TGA builds and RRP drainage patterns—historical precursors to acute market volatility.
*   **Bank of Japan (BoJ) Stress Monitor:** Synchronous tracking of BoJ balance sheet expansion versus monetary base growth—identifying the limits of yen defense and liquidity support.
*   **Shanghai Divergence Tracker (Proprietary):** Identifying the precise moment PBOC easing efforts are constrained by Beijing’s deleveraging edicts.

**Institutional Application:** Position sizing for risk assets must scale with Net Liquidity Z-scores. Historical analysis confirms that when Net Liquidity exceeds +1σ, equity drawdowns are statistically improbable. Conversely, readings below -1σ have preceded every major structural correction since 2008.

---

## II. The Monetary Anchor: Mathematical Certainties of Fiscal Dominance

> *"Gold is money. Everything else is credit." — J.P. Morgan, 1912*

In an environment of unprecedented sovereign debt issuance, hard assets serve as the ultimate constitutional check on fiat debasement. GraphiQuestor provides institutional-grade surveillance of the monetary metal complex relative to paper claims.

*   **Debt / Gold Z-Score (Proprietary):** A standardized, 25-year measure of sovereign debt burden relative to official sector gold reserves. This metric starkly reveals which nations retain monetary optionality (e.g., India, Russia, China with negative z-scores) versus those locked into a perpetual refinancing loop (e.g., US, Japan exceeding +2σ).
*   **M2 / Gold Ratio:** The true inflation gauge. When broad money supply outpaces gold's market capitalization, purchasing power is systematically transferred from savers to debtors. Our 50-year historical context identifies structural valuation floors.
*   **Silver Cycle Analysis:** Z-score positioning of the gold-to-silver ratio against its 200-year mean, pinpointing historical asymmetries in the monetary metal complex.
*   **Central Bank Accumulation Maps:** Tracking of official sector purchases with a specific focus on non-Western central banks—the leading indicator for de-dollarization intent. 

**Institutional Application:** Family offices and sovereign wealth funds utilize these ratios for strategic, generational asset allocation. Elevated M2/Gold ratios historically signal elevated debasement risk, warranting a rapid reassessment of hard asset weighting.

---

## III. The Geopolitical Pivot: Capital Has a New Flag

The post-Cold War era is over. Infrastructure financing, rather than military presence, now determines global spheres of influence. GraphiQuestor maps the “Great Game 2.0”—the silent, systemic competition for the Global South between Western institutions (World Bank/IMF) and Eastern alternatives (AIIB/NDB).

*   **Loan-to-Job Efficiency Ratio (Proprietary):** The true measure of productive capital. We attribute institutional inflows to actual employment and GVA creation at the Indian state level, utilizing MoSPI’s PLFS (labor force) and ASI (industrial output) data. This explicitly isolates productive investment hubs (e.g., Maharashtra, Gujarat) from rent-seeking regions.
*   **Development Finance Cartography:** Interactive mapping of World Bank versus AIIB/NDB project financing across Asia, Africa, and Latin America, revealing real-time shifts in institutional allegiance.
*   **Reserve Currency Composition:** Visualization of IMF COFER data, tracking the secular decline of the USD reserve share (currently 58%, down from 71% in 2000) alongside simultaneous gold and RMB allocations.
*   **BRICS+ Expansion Tracker:** Monitoring the rapidly developing alternative payment and settlement systems (mBridge, bilateral swap lines) designed to bypass dollar hegemony.

**Institutional Application:** Sovereign wealth funds use this intelligence to front-run currency realignments. Nations exhibiting significant AIIB/NDB financing flows are statistically likelier to pivot toward RMB trade settlement and diversify reserves away from US Treasuries.

---

## IV. Energy Security: The Physical Constraint on Financial Assets

> *"You cannot print barrels of oil."*

Energy is the master resource. As the global economy transitions from an era of presumed energy abundance to one of structural scarcity, energy security is the paramount geopolitical imperative.

*   **Energy Dependency Ratio (Proprietary):** The percentage of total energy consumption sourced from imports, calculated at the granular state level for India (via MoSPI). This separates states acutely vulnerable to external supply shocks (>80% import-dependent) from those enjoying domestic energy sovereignty.
*   **Crude Import Dependency Mapping:** Sankey diagrams charting oil flows from the Persian Gulf and Urals to major consuming hubs (India, China, EU), immediately revealing critical chokepoint vulnerabilities.
*   **WTI Calendar Spread Monitor (Industry First):** The primary signal for physical oil market regimes. By tracking the spread between front-month and next-month contracts, we identify the transition from Backwardation (physical scarcity) to Contango (storage surplus), providing a lead indicator for spot price volatility.
*   **Strategic Reserve Dynamics:** Tracking US SPR drawdowns against simultaneous China/India accumulation—the ultimate leading indicator of medium-term supply-demand imbalances.
*   **Refining Capacity Utilization:** Identifying the global refining bottlenecks that act as a hidden, structural tax on economic growth when capacity constraints begin to bite.

**Institutional Application:** Energy security is the new currency of foreign policy. Nations controlling diversified supply sources and strategic reserves possess greater monetary autonomy than import-dependent peers. This intelligence directly informs sovereign bond positioning and structural currency hedging.

---

## V. India & China Intelligence Hubs: Granular Telemetry, Real-Time

Conventional platforms offer only high-level national aggregates. GraphiQuestor delivers state- and province-level intelligence on the two most critical growth engines of the multipolar era.

**India Intelligence Hub** (Consolidated 2026)
Through direct integration with India's Ministry of Statistics & Programme Implementation (MoSPI) via our eSankhyiki-MCP server, we provide unprecedented depth:
*   **Global Trade Intelligence:** A high-velocity telemetry layer tracking 2nd-digit HS chapter exports across 20+ major economies. Reveals the real-time ebb and flow of global manufacturing and identifies emerging "manufacturing hubs" before national GDP prints.
*   **Manufacturing Shift Tracker (India vs China):** Side-by-side comparative analysis of 6-digit HS codes for strategic sectors (EVs, Smartphones, Solar, Semiconductors). Tracks the "China+1" narrative with ruthless, data-driven precision.
*   **India Macro Pulse:** Unified dashboard synthesizing RBI liquidity, state fiscal stress, credit cycles, and debt maturity walls.
*   **State-Level Granularity:** Industrial output (ASI), employment efficiency (PLFS), energy dependency, and fiscal allocation tracking down to the state/UT level.

**China Macro Hub** (Consolidated Q1 2026)
Real-time tracking of policy divergence and real-economy dynamics across China's vast administrative landscape:
* **PBOC Liquidity Monitor:** MLF operations, reverse repos, M2 growth, and regime identification—highlighting moments when Shanghai's monetary accommodation conflicts with Beijing's deleveraging mandates.
* **Provincial Industrial Telemetry:** Tracking production, investment, and energy transition metrics across provinces to identify leading indicators before national aggregates shift.

**Institutional Application:** The India and China hubs provide sovereign wealth funds and EM-dedicated allocators with the granularity required to identify productive capital allocation versus rent-seeking, to position ahead of policy pivots, and to understand the real-economy demand that drives commodity markets and currency realignments.


---

## VI. Glossary Intelligence: The Distributed Dashboard

GraphiQuestor transforms the traditional financial glossary into a **distributed real-time intelligence dashboard**. We bridge static terminology to live macroeconomic telemetry, ensuring that every definition is grounded in current reality.

*   **Cross-Pollination Engine:** 24+ institutional terms (SRF, BTFP, Excess Reserves, Debt/GDP) are dynamically wired to live database hooks.
*   **Institutional Interpretation:** Every live metric includes an interpretation engine that applies Z-scores and macro thresholds to provide regime-based labeling (e.g., *Fiscal Dominance Risk*, *Monetary Easing*, *Liquidity Stress*).
*   **Semantic SEO Infrastructure:** Every glossary page injects triple-schema JSON-LD (**DefinedTerm**, **FAQPage**, **Dataset**), ensuring that live macro readings are extractable and citable by AI search systems (ChatGPT, Perplexity, Gemini).
*   **Staleness Guard:** Automated real-time monitoring of data freshness. High-frequency metrics trigger **"Elevated Staleness"** warnings if the ingestion pipeline exceeds a 7-day latency threshold.

**Institutional Application:** Risk managers use the glossary as a "First Responder" terminal. Instead of searching for data, they search for the *concept* and receive a live reading of the systemic signal, its historical z-score, and its immediate macro implication.

---

## Technical Architecture: Institutional Rigor Guaranteed

GraphiQuestor is engineered to meet the exacting standards of sovereign wealth funds and tier-one research teams.

*   **Autonomous 25-Year Ingestion Pipelines:** Serverless Edge Functions (Supabase/Deno) autonomously harvest data from official sources (BIS, US SEC EDGAR, MoSPI, FRED, EIA, RBI, CFTC) daily. Our time-series metrics span from 2000 to the present, capturing the dot-com crash, the GFC, the QE era, and COVID-19 stimulus perfectly for reliable Z-score calculation.
*   **Data Hub Orchestration Pattern:** A centralized telemetry orchestrator (`useGlossaryDataHub`) consolidates 20+ specialized hooks into a single, memoized data resolver, ensuring sub-millisecond dashboard performance across the entire intelligence suite.
*   **Institutional-Grade Data Health & Provenance:** Every data point is tagged with a `provenance` certificate (`api_live`, `fallback_snapshot`), providing full transparency on data origin. Our **Authenticity Score** provides a real-time "trust percentage" for all active dashboards.
*   **Materialized Performance Layer:** High-frequency metrics are served via a **trigger-synchronized materialization layer** (`vw_latest_metrics`), ensuring sub-millisecond dashboard responsiveness even during massive volatility spikes.
*   **Resilient, Self-Healing Operations:** Automatic schema drift detection and API rate limit management. If source structures change, the system gracefully logs discrepancies and maintains operational continuity via granular telemetry (`status_code`, `api_latency_ms`).
*   **Secure Infrastructure & High Availability:** Row-Level Security (RLS) policies, parameterized queries to prevent injection attacks, redundant database replicas, and global CDN distribution ensure robust security, fast load times, and reliable uptime during periods of acute market stress.

### Technology Stack

```
Frontend Architecture:
├── Framework: Vite 8 + React 18 + TypeScript (SPA deployed to Netlify)
├── Design System: Stitch MCP Dark Glassmorphic Institutional Terminal
├── UI Primitives: Tailwind CSS + MUI v5 + shadcn/ui (Radix primitives)
├── Data Fetching: TanStack Query v5 (stale-while-revalidate, 30m staleTime)
├── Charts & Visuals: Recharts, @nivo/sankey, react-simple-maps, Leaflet
└── Routing: React Router v7 (lazy-loaded named export chunks)

Backend & Ingestion Engine:
├── Database: Supabase Postgres (time-series engine + materialized views)
├── Serverless Workers: Deno Edge Functions (automated via pg_cron)
├── Data Feeds: US SEC EDGAR, FRED, RBI DBIE, MoSPI, EIA, CFTC, PBOC, BOJ, ECB, BIS, UN Comtrade
└── API Delivery: Cloudflare Workers MCP Server + REST Endpoints
```

### Data Flow Pipeline

```
Official Data Feeds (US SEC, FRED, RBI, MoSPI, EIA, CFTC, PBOC, BOJ, ECB, UN Comtrade)
   │
   ▼
Deno Edge Functions (Ingestion & Normalization)
   │
   ▼
Supabase Postgres: `metric_observations` (Raw Time-Series)
   │
   ▼
Postgres View: `vw_latest_metrics` (Staleness Flags + Current Value + History)
   │
   ▼
TanStack Query Hooks: `useLatestMetric(metricId)`
   │
   ▼
Institutional Terminal Desks & Surveillance Labs (React Components)
```

### Local Development & Verification Commands

```bash
# Install dependencies
npm install

# Start Vite dev server with hot reload
npm run dev

# Run full TypeScript validation and production build (prerenders 560+ routes)
npm run build

# Run ESLint with zero-warning gate (strict institutional standard)
npm run lint

# Run Vitest smoke & unit tests
npm run test

# Run a single test file
npx vitest run src/smoke.test.tsx

# Preview the production build locally
npm run preview
```

---

## Data Sources & Institutional Partnerships

GraphiQuestor synthesizes intelligence from the world's most authoritative institutions. All data is ingested automatically via hardened, production-grade serverless pipelines with full provenance tracking and self-healing capabilities.

### India-Specific Intelligence (Proprietary Edge)
*   **MoSPI (Ministry of Statistics, Govt. of India):** Direct integration via eSankhyiki-MCP for real-time access to PLFS (labor), CPI, IIP, ASI (industries), NAS, WPI, and Energy Statistics—all with state/UT granularity.
*   **RBI (Reserve Bank of India):** Daily LAF operations, FX defense interventions, gold reserves, system liquidity, and monetary policy signals.
*   **NSE (National Stock Exchange of India):** Daily institutional FII/FPI and DII equity and derivative flow telemetry, turnover, and cross-border portfolio positioning.

### US Regulatory & Corporate Intelligence (SEC EDGAR)
*   **US SEC EDGAR (Securities and Exchange Commission):** Automated, primary-source ingestion of 10-K and 10-Q balance sheets, income statements, and debt schedules across 37 mega-cap corporate bellwethers. Provides auditable evidence archives linked directly to `sec.gov`, debt maturity schedules, weighted-average coupons, and macro transmission signals (CapEx velocity, liquidity stress, interest burden).
*   **CFTC (Commodity Futures Trading Commission):** Commitments of Traders (COT) institutional positioning tracking leveraged fund net short positions across 10-Year, Ultra-10, and 2-Year Treasury futures.

### China Macro Data
*   **NBS & PBOC Publications:** Industrial production, retail sales, credit impulse, M2/aggregate financing, and policy rate decisions.
*   **Customs & Energy Administration:** Import/export flows, energy dependency metrics, and strategic commodity consumption.
*   **Provincial Statistical Bureaus:** Sub-national data for detecting leading indicators before national aggregates shift.

### Global Monetary & Financial Data
*   **FRED (Federal Reserve Economic Data):** 25-year US macro series (balance sheets, yields, labor, gold).
*   **BIS (Bank for International Settlements):** Cross-border banking, reserve metrics, and global liquidity aggregates.
*   **IMF (International Monetary Fund):** COFER reserve composition, SDR allocations, and World Economic Outlook database.
*   **LBMA & Official Reserve Repositories:** London Bullion Market Association benchmark fixings and central bank official sector gold acquisition volumes.
*   **World Bank, AIIB & NDB:** Development financing projects and institutional lending flows across the Global South.

### Energy, Commodities & Geopolitics
*   **EIA (U.S. Energy Information Administration):** Global refining capacity, crude import/export flows, SPR dynamics, and oil market balances.
*   **Physical Trade & Geopolitics:** UN Comtrade physical commodity flows (Crude, Metals, Agriculture) and GDELT geopolitical risk & conflict event feeds.
*   **Market Data Feeds:** Alpha Vantage, Finnhub, and trading economics for real-time commodity and volatility metrics.

---

## Access & Integration

GraphiQuestor is designed for seamless integration into existing institutional workflows.

*   **Live Terminal:** [https://graphiquestor.com](https://graphiquestor.com)
*   **RSS Feed:** [https://graphiquestor.com/rss.xml](https://graphiquestor.com/rss.xml)
*   **REST API:** [https://graphiquestor.com/api-docs](https://graphiquestor.com/api-docs) — 320+ metrics, regime signals, composite scores
*   **MCP Server (AI Agents):** [`mcp/graphiquestor/`](mcp/graphiquestor/) — Smithery registry [`graphiquestor/macro-intelligence`](https://smithery.ai/servers/graphiquestor/macro-intelligence) with 8 tools (`get_regime_current`, `get_india_summary`, `discover_graphiquestor`, etc.). One-command install:
    ```bash
    npx -y @smithery/cli@latest mcp add graphiquestor/macro-intelligence --client cursor
    ```
    Remote MCP URL: `https://macro-intelligence--graphiquestor.run.tools` · Worker: `https://graphiquestor-mcp.graphiquestor.workers.dev/mcp` · Docs: [graphiquestor.com/mcp](https://graphiquestor.com/mcp)
*   **API Access (Institutional):** Contact us directly for institutional API licensing and customized white-label deployment architectures.

---

## Philosophical Foundation

GraphiQuestor is built upon a singular, unwavering premise: **Reality is non-negotiable.**

In an era characterized by narrative-driven markets and politically massaged statistics, those allocating profound sums of capital require unvarnished truth. We do not attempt to forecast the future; we observe the present with ruthless, algorithmic precision. We do not offer investment advice; we provide the raw structural intelligence required for survival and outperformance.

The platform is engineered exclusively for those who understand that:
1.  Central bank balance sheets dictate outcomes more forcefully than central bank rhetoric.
2.  Hard assets function as the mathematical check on unchecked fiat debasement.
3.  Geopolitical alignment increasingly dictates the direction and cost of capital.
4.  Physical constraints—in energy, commodities, and industrial capacity—will ultimately override financial engineering.

In the words of the late Paul Volcker: *"It is a government's obligation to provide a stable currency. When it fails to do so, citizens have the right to protect themselves."*

GraphiQuestor is the infrastructure for that protection.

---

## License & Attribution

GraphiQuestor is an open-source project licensed under MIT. All source data is utilized under fair use and public domain terms. We extend our gratitude to the institutions cited above for making high-quality data openly accessible.

**Disclaimer:** GraphiQuestor provides data and analytical tools exclusively for informational and research purposes. It does not constitute investment or financial advice. Users must conduct their own independent due diligence before making investment decisions. Past performance is not indicative of future results.

---

*"The era of passive, index-hugging investing is over. Welcome to the age of active survival and structural alpha."*

**GraphiQuestor** — Structural Intelligence for the Multipolar Era.

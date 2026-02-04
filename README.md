# GraphiQuestor: The Institutional Macro Intelligence Terminal

> "The international monetary system is at a turning point. We are witnessing the end of a 55-year experiment with pure unbacked fiat money and the return of the Golden Anchor." — *Institutional Perspective*

**GraphiQuestor** is an elite macro-economic surveillance dashboard designed for the 1% of investors who recognize that the "Great Reset" is not a theory, but a deterministic sequence of liquidity shifts, sovereign insolvency, and de-dollarization. 

Inspired by the structural analysis of **Jim Rickards** (The New Case for Gold) and the monetary history of **Willem Middelkoop** (The Big Reset), this terminal provides the raw data and Z-score analytics required to navigate the transition to a multi-polar monetary world.

## New Features (v2.0 Update)

### 📄 Downloadable Briefing Packs
Institutional-grade reporting is now built-in.
- **Export to PDF**: Generate A4-formatted briefing documents with timestamped metadata and source attribution.
- **Export to PNG**: Capture high-resolution (retina) snapshots of any chart or section for presentation decks.
- **Watermarking**: Automated attribution footer ("GraphiQuestor Intelligence | Generated: {Date}") ensures provenance.

### ⚡ Today's Brief Panel
A 30-second "Executive Summary" at the top of the dashboard.
- **Regime State**: Current macro weather (Expansion, Contraction, Reset) calculated from real-time Z-scores.
- **Liquidity Pulse**: 7-Day Delta of Global Net Liquidity.
- **3 Key Moves**: Automatically identifies the top 3 biggest macro movers (e.g., "DXY ↑ +2.3%") for immediate attention.

### 🦅 Presidential Policy Tracker (Trump 2.0)
Systematic tacking of the new administration's impact.
- **Asset Impact Chips**: Direct correlation mapping (e.g., "Tariffs announced → DXY Bullish").
- **Narrative Tags**: Contextual framing for policy events.
- **Macro Analogues**: Interactive "History Rhymes" section comparing current events to 2018 or 1980 equivalents.

---

## I. Global Liquidity Pulse (The Central Bank Engine)
The dashboard tracks the lifeblood of current markets: **Net Liquidity**.
- **Net Liquidity Calculation**: `Fed Balance Sheet - (Treasury General Account + Reverse Repo)`.
- **Surveillance**: Rolling 25-year Z-scores targeting liquidity "cliffs" and "alarms".
- **The Liquidity Alarm**: Deterministic triggers indicating when the Fed’s "Stealth QE" or "QT" regimes are reaching critical thresholds.

## II. Hard Asset Valuation (The Monetary Anchor)
We monitor the debasement of the Dollar through the lens of Gold—the only financial asset with no counterparty risk.
- **M2 / Gold Ratio**: Measuring the amount of currency printing relative to the monetary anchor.
- **DEBT / Gold (Bn)**: Tracking the US Total Public Debt scaled by the world's gold supply (Billion Ounces), uncovering the true scale of sovereign over-leverage.
- **SPX / Gold**: Gauging the value of the S&P 500 in real money terms (Pricing the bubble).
- **Gold / Silver Ratio**: Historical 50-year context vs. modern 25-year Z-score cycles to identify silver’s undervaluation.

## III. De-Dollarization & The BRICS Ascent
The shift from a West-centric to a multi-polar system is captured in real-time.
- **Global Gold Share (%)**: Surveillance of COFER data indicating the shift in global central bank reserves from USD to XAU.
- **BRICS Tracker**: Aggregate GDP, Gold Holdings, and Debt profile of the BRICS+ alliance vs. the G7.
- **Sovereign Stress**: Monitoring G20 bond yield spreads and "Real Rate Proxies" to detect the next sovereign debt default cycle.

## IV. Technical Architecture (The Pipeline)
GraphiQuestor is built on an institutional-grade stack for sub-second data integrity.
- **Edge Functions**: Automated Deno-based ingestors for **FRED**, **IMF (COFER)**, **Yahoo Finance**, and **US Treasury (FiscalData)**.
- **Database Architecture**: Supabase (Postgres) with heavily optimized materialized views and `pg_cron` scheduling for monthly/quarterly data releases.
- **Frontend**: A high-contrast, premium "Bloomberg-Dark" interface using Vite + React, optimized for fast-scan macro surveillance.

---

## V. Methodology
All Z-scores are calculated using a **rolling 25-year window** (9125 observations) to capture more than one full credit cycle, ensuring depth and significance. Percentiles are derived from the entire historical observation set since 1971 (Abandonment of Bretton Woods).

> "Data is the new gold, but only when refined through the lens of history."

---

*GraphiQuestor is a proprietary tool for sophisticated macro analysis. Not financial advice.*

---

## 🛠️ Backend & DevOps (CI/CD)

### Automated Edge Function Deployment
Edge Functions are automatically deployed to Supabase via GitHub Actions when changes are pushed to the `main` branch under the `supabase/functions/` directory.

#### Setup Requirements
To maintain the CI/CD pipeline, the following **GitHub Secrets** must be configured in your repository (`Settings > Secrets and variables > Actions`):

1.  `SUPABASE_ACCESS_TOKEN`: Your personal access token. [Generate one here](https://supabase.com/dashboard/account/tokens).
2.  `SUPABASE_PROJECT_ID`: The project reference ID (`debdriyzfcwvgrhzzzre`).

#### CI/CD Workflow
- **File**: `.github/workflows/deploy-supabase-functions.yml`
- **Trigger**: Pushes to `main` branch affecting `supabase/functions/**`.
- **Manual Trigger**: Can be run manually via the "Actions" tab in GitHub.

#### Token Rotation
If you need to rotate your access token: 
1. Generate a new token in the Supabase Dashboard.
2. Update the `SUPABASE_ACCESS_TOKEN` secret in GitHub.
3. The next deployment will use the new token automatically.

> [!CAUTION]  
> **Source of Truth**  
> Do not use the Supabase web editor to modify Edge Functions. All changes must be committed to the repository to avoid being overwritten by the CI/CD pipeline.

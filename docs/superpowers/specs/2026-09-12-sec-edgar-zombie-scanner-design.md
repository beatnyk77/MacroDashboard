# Specification: SEC EDGAR Zombie Firm & Corporate Rollover Stress Engine

**Date:** 2026-09-12  
**Status:** Approved for Implementation  
**Target Platform:** GraphiQuestor Macro Intelligence Terminal (`graphiquestor.com`)  
**Design Reference:** Stitch Screen `de57720df77442d69957ae2a375e2ece` (Project `3303994937711585097`)  

---

## 1. Executive Summary & Thesis

GraphiQuestor surfaces real-time macro telemetry for tier-one capital allocators, central bank research desks, and sovereign wealth managers. While headline benchmark indices (e.g., S&P 500) appear resilient due to cash-rich mega-cap tech balance sheets, an estimated 15% to 20%+ of small/mid-cap filers (e.g., Russell 2000 debt filers) operate with structural cash-flow deficits.

Many of these companies survived the 2022–2025 rate tightening cycle purely because their debt was locked in at 2.5%–4.0% fixed coupons issued in 2020–2021. As the **$6.58T Corporate Debt Maturity Wall** arrives over 2026–2028, these firms must refinance into prevailing market yields (SOFR + spread, currently 6.5%–9.0%+).

This specification defines the end-to-end architecture to:
1. Ingest standardized US-GAAP / IFRS financial statements directly from the **SEC EDGAR XBRL Companyfacts API** (`data.sec.gov`).
2. Calculate deterministic trailing **Interest Coverage Ratios ($\text{ICR}$)** and simulate forward-looking **Pro-Forma Refinancing $\text{ICR}$ Shock**.
3. Surface a dual-layered institutional visual interface:
   - A **Zombie Distress Overlay** on the existing `CorporateDebtMaturityWall` component.
   - An interactive **Corporate Rollover Risk & Zombie Scanner** on the `CorporateTransmissionPage` with a live refinancing rate-shock scenario slider, inspired by modern institutional data tables and 21st.dev primitives.

---

## 2. SEC EDGAR Data Architecture & XBRL Mapping

### 2.1 Target SEC EDGAR Endpoints
The pipeline connects directly to the SEC's public REST APIs with strict compliance to SEC fair-access guidelines (`User-Agent` declaration, rate ceiling $\le 10$ req/sec, connection pooling):

* **Company Facts API**: `https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json`
  Returns all standardized XBRL fact sets across all filed 10-K, 10-Q, 8-K, and 20-F documents.
* **Company Submissions API**: `https://data.sec.gov/submissions/CIK{cik}.json`
  Provides filing metadata, accession numbers, primary documents, and report dates.

### 2.2 Target XBRL US-GAAP Concepts (`secCorporateConcepts.ts`)

| Financial Dimension | US-GAAP Primary Concept | Alternative / Fallback Concept | IFRS Equivalent (20-F) |
| :--- | :--- | :--- | :--- |
| **Operating Income (EBIT)** | `us-gaap:OperatingIncomeLoss` | `GrossProfit` minus `OperatingExpenses` | `ifrs-full:OperatingProfitLoss` |
| **Interest Expense** | `us-gaap:InterestExpense` | `InterestAndDebtExpense`, `InterestExpenseDebt` | `ifrs-full:FinanceCosts` |
| **Long-Term Debt** | `us-gaap:LongTermDebtNoncurrent` | `LongTermDebtAndCapitalLeaseObligations` | `ifrs-full:LongtermBorrowings` |
| **Current / Maturing Debt** | `us-gaap:DebtCurrent` | `LongTermDebtCurrent`, `ShortTermBorrowings` | `ifrs-full:CurrentPortionOfLongTermBorrowings` |
| **Cash & Liquidity** | `us-gaap:CashAndCashEquivalentsAtCarryingValue` | `CashCashEquivalentsRestrictedCashAnd...` | `ifrs-full:CashAndCashEquivalents` |
| **Operating Cash Flow** | `us-gaap:NetCashProvidedByUsedInOperatingActivities` | — | `ifrs-full:CashFlowsFromUsedInOperatingActivities` |

---

## 3. Quantitative Refinancing Stress Model

### 3.1 Mathematical Definitions

#### Trailing 12-Month Operating Earnings ($\text{EBIT}$)
For any observation period $t$, $\text{EBIT}$ is the sum of the last 4 reported quarters (or the most recent 10-K annual value if intra-year 10-Qs are not reported):
$$\text{EBIT}_{\text{TTM}} = \sum_{q=0}^{3} \text{OperatingIncomeLoss}_{t-q}$$

#### Trailing 12-Month Interest Expense ($\text{Int}$)
$$\text{Int}_{\text{TTM}} = \sum_{q=0}^{3} \text{InterestExpense}_{t-q}$$

#### Current Interest Coverage Ratio ($\text{ICR}_{\text{current}}$)
$$\text{ICR}_{\text{current}} = \frac{\text{EBIT}_{\text{TTM}}}{\max(1.0, \text{Int}_{\text{TTM}})}$$

#### Implied Weighted-Average Existing Coupon ($\text{Coupon}_{\text{existing}}$)
$$\text{Coupon}_{\text{existing}} = \frac{\text{Int}_{\text{TTM}}}{\text{Total Debt}}$$

#### Pro-Forma Refinancing Shock Formula
Let $D_{\text{maturing}}$ be the principal debt maturing within the next 24 months ($\le 2\text{Y}$). When this maturing tranche rolls over at the prevailing simulated market yield $R_{\text{refi}}$ (e.g., benchmark SOFR + credit spread $\approx 7.00\%$), the pro-forma annual interest burden becomes:
$$\text{Int}_{\text{pro-forma}} = (D_{\text{total}} - D_{\text{maturing}}) \times \text{Coupon}_{\text{existing}} + (D_{\text{maturing}} \times R_{\text{refi}})$$

$$\text{ICR}_{\text{pro-forma}} = \frac{\text{EBIT}_{\text{TTM}}}{\text{Int}_{\text{pro-forma}}}$$

### 3.2 Institutional Stress Tiers

1. 🔴 **Confirmed Zombie**:
   * Condition: $\text{ICR}_{\text{current}} < 1.0$
   * Interpretation: Core operating business is structurally underwater. Operating income is insufficient to service current low-coupon debt.
2. 🟠 **Rollover Zombie (The Hidden Distress)**:
   * Condition: $\text{ICR}_{\text{current}} \ge 1.0$ AND $\text{ICR}_{\text{pro-forma}} < 1.0$
   * Interpretation: The core "Big Short" vulnerability. Appears compliant today under legacy 2020–2021 borrowing rates, but interest coverage collapses below 1.0x upon refinancing.
3. 🟡 **Vulnerable / Compressed**:
   * Condition: $1.0 \le \text{ICR}_{\text{pro-forma}} < 1.75$ OR Cash Runway $< 4$ quarters
   * Interpretation: Extremely narrow margin of safety. Susceptible to credit rating downgrades, covenant breaches, or working capital squeezes.
4. 🟢 **Solvent / Fortress**:
   * Condition: $\text{ICR}_{\text{pro-forma}} \ge 1.75$ AND Cash Runway $\ge 8$ quarters (or Net Cash balance sheet)
   * Interpretation: Strong capital position capable of absorbing higher-for-longer refinancing yields.

---

## 4. Database Schema & Migration Plan

### 4.1 Table Extensions: `sec_corporate_signals`
Stores deterministic time-series signal states computed per issuer:
* `signal_id`:
  * `'interest_coverage_ratio'` (Numeric value = current ICR)
  * `'pro_forma_refi_icr'` (Numeric value = post-refi ICR)
  * `'debt_to_ebit'` (Numeric value = leverage multiple)
  * `'zombie_tier'` (String value in payload: `confirmed_zombie`, `rollover_zombie`, `vulnerable`, `solvent`)

### 4.2 Materialized Rollup View: `vw_corporate_zombie_stress_summary`
Aggregates macro telemetry across the active issuer universe:
* `active_issuers_count`: Total issuers scanned.
* `confirmed_zombies_count`: Issuers with $\text{ICR}_{\text{current}} < 1.0$.
* `confirmed_zombies_pct`: Share of total issuers.
* `rollover_zombies_count`: Issuers flipping sub-1.0 upon refi.
* `total_debt_at_risk_usd`: Total debt held by sub-1.0 ICR cohorts ($B / $T).
* `median_cash_runway_quarters`: Median quarters of cash runway for distressed issuers.
* `as_of_date`: Timestamp of latest SEC XBRL filing observation.

---

## 5. UI/UX Interface Architecture

Reflecting the dark precision glassmorphism aesthetic (`#051424` canvas, `#0b0f19` panels, `#1e293b` hairline borders, Space Grotesk headings, JetBrains Mono numbers):

### 5.1 Corporate Debt Maturity Wall Overlay (`CorporateDebtMaturityWall.tsx`)
* **Mode Switch**: Added to the chart controls: `[ Aggregate Face Value | ⚡ Zombie Distress Overlay ]`.
* **Stacked Tenor Bars**:
  * Visualizes the share of each maturity bucket (`<1Y`, `1–3Y`, `3–5Y`, `>5Y`) that represents debt owed by **Confirmed Zombies** (Crimson `#f43f5e`), **Rollover Risk** (Amber `#f59e0b`), and **Solvent Debt** (Emerald/Blue).
* **Dynamic Warning Badge**:
  * Alerts allocators when $> 20\%$ of near-term ($<2\text{Y}$) corporate debt maturities reside in sub-1.0 ICR issuers.

### 5.2 Corporate Rollover Risk & Zombie Scanner (`CorporateTransmissionPage.tsx`)
* **Bento Metric Header**:
  1. *Confirmed Zombies*: Share and count of structural zombies ($\text{ICR} < 1.0$).
  2. *Rollover Zombie Shock*: Count of issuers failing post-refi coverage.
  3. *Total Zombie Debt Burden*: Cumulative debt volume at risk ($T).
  4. *Median Cash Runway*: Liquidity burn-out runway (quarters).
* **Interactive Refinancing Rate Shock Slider**:
  * Allows allocators to adjust the simulated refinancing rate:
    * Preset 1: `5.50% SOFR Baseline`
    * Preset 2: `7.00% BBB/HY Current Market` (Default)
    * Preset 3: `8.50% Severe Squeeze`
  * Real-time reactive recalculation of pro-forma ICRs across all issuers in the client-side TanStack Query cache.
* **Faceted SEC Screener & Evidence Table**:
  * Ticker, CIK, Company Name, Sector Tag.
  * TTM EBIT ($M), Total Debt ($M), Implied Current Coupon (%).
  * Current ICR Badge $\rightarrow$ Stressed Pro-Forma ICR Badge (with visual warning pulse).
  * 12–24M Maturing Debt ($M) and Cash Runway Quarters.
  * Direct SEC EDGAR Provenance Link: Clickable link leading to the exact SEC accession URL (`https://www.sec.gov/Archives/edgar/data/...`).

---

## 6. Verification & Testing Strategy

### 6.1 Automated Tests
* **Unit Math Tests (`corporateSignalMath.test.ts`)**:
  * Validate $\text{ICR}$ calculation under normal, zero-interest, and negative-EBIT scenarios.
  * Validate Pro-Forma Refi Shock calculation with various debt maturity proportions.
  * Validate tier classification boundaries.
* **Ingestion Tests (`ingest-sec-corporate.test.ts`)**:
  * Verify parsing of `OperatingIncomeLoss` and `InterestExpense` from mock SEC XBRL payloads.
  * Verify foreign filer IFRS fallback mapping (`OperatingProfitLoss`, `FinanceCosts`).
* **Frontend Component Tests (`CorporateDebtMaturityWall.test.tsx`, `CorporateTransmissionPage.test.tsx`)**:
  * Verify rendering of stacked bar distress overlay.
  * Verify slider state updates and screener table filter interactions.

### 6.2 Manual Verification
* Compare computed ICR against known corporate filings (e.g., Walgreens Boots Alliance, AMC Entertainment, Lumen Technologies) to verify 100% accuracy against official SEC 10-K notes.
* Run full TypeScript compilation (`npm run build`) and ESLint verification (`npm run lint`).

# Design Specification: Institutional Desks Expansion

**Topic**: Interbank Credit Stress, Treasury Custody & Dealer Absorption, and FX Swap Basis / Carry Unwind Matrix  
**Date**: 2026-09-10  
**Target Project**: GraphiQuestor Macro Terminal  

---

## 1. Executive Summary & Goals

This specification outlines the technical design for expanding GraphiQuestor into 3 new institutional macro intelligence desks:
1. **Interbank Credit & Funding Stress Desk** (`/labs/interbank-funding`)
2. **Treasury Supply & Foreign Custody Radar** (`/labs/treasury-supply-radar`)
3. **FX Carry & Cross-Currency Basis Matrix** (`/labs/fx-carry-matrix`)

All metrics will be ingested via existing Supabase Edge Functions (`ingest-us-macro`, `ingest-us-macro-fiscal`, `ingest-central-banks`) to guarantee 100% compliance with Supabase Free Tier quotas.

---

## 2. Backend Data Ingestion Architecture

### Zero-Function Strategy
No new Edge Functions or `pg_cron` jobs will be deployed. New metric IDs will piggyback on existing daily and weekly schedules.

```
+-----------------------------------------------------------------------------------+
|                              EXTERNAL DATA SOURCES                                |
|   FRED API (St. Louis Fed)  |  NY Fed Primary Dealer Data  |  US Treasury Fiscal  |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                            EXISTING EDGE FUNCTIONS                                |
|                                                                                   |
|  1. ingest-us-macro:                                                              |
|     - US_SRF_UTILIZATION_BN (SRFOFFSHORE)                                         |
|     - US_BANK_CREDIT_H8_YOY (BUSLOANS, REALLN)                                    |
|     - US_HY_CREDIT_OAS_BPS (BAMLH0A0HYM2)                                         |
|     - Derived: INTERBANK_CREDIT_STRESS_INDEX                                      |
|                                                                                   |
|  2. ingest-us-macro-fiscal:                                                       |
|     - FOREIGN_OFFICIAL_UST_CUSTODY_BN (WDFBAL)                                    |
|     - PRIMARY_DEALER_UST_INVENTORY_BN (PDINTT)                                    |
|     - UST_AUCTION_BID_TO_COVER_10Y                                                |
|     - Derived: PRIMARY_DEALER_ABSORPTION_STRESS                                   |
|                                                                                   |
|  3. ingest-central-banks:                                                         |
|     - EURUSD_3M_SWAP_BASIS_BPS                                                    |
|     - JPYUSD_3M_SWAP_BASIS_BPS                                                    |
|     - G7_REAL_POLICY_RATE_MATRIX                                                  |
|     - Derived: JPY_CARRY_UNWIND_RISK_SCORE                                        |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                               POSTGRES DATABASE                                   |
|               metric_observations table  -->  vw_latest_metrics view              |
+-----------------------------------------+-----------------------------------------+
```

---

## 3. Stitch MCP Generated Screen Specifications

Designs generated in Stitch MCP project `GraphiQuestor - Institutional Macro Terminal` (`3303994937711585097`):

### A. Interbank Credit Stress Desk (`/labs/interbank-funding`)
* **Theme**: Obsidian void (`#050810`), hairline borders (`#1e293b`), status halos for credit shocks.
* **Layout**:
  - Top Ribbon: SRF Utilization, H.8 Bank Credit YoY %, HY OAS Spread (bps), Composite Interbank Stress Z-score.
  - Central Visual: 3-Year HY OAS vs. Bank Lending Growth correlation chart with credit squeeze inflection markers.
  - Data Table: Detailed interbank repo breakdown and H.8 loan categories.

### B. Treasury Supply Radar (`/labs/treasury-supply-radar`)
* **Theme**: Gold/Slate accents, high-density telemetry.
* **Layout**:
  - Top Ribbon: Foreign Custody at Fed ($B), Primary Dealer Net Inventory ($B), 10Y Bid-to-Cover Ratio, Dealer Absorption Stress Score.
  - Central Visual: Foreign Custody vs US Treasury Net Refunding pace stacked timeline.
  - Auction Telemetry Table: 2Y, 5Y, 10Y, 30Y auction tails, dealer allotment %, and indirect bidder participation.

### C. FX Carry & Swap Basis Matrix (`/labs/fx-carry-matrix`)
* **Theme**: Cyan/Emerald neon luminescence.
* **Layout**:
  - Top Ribbon: JPY Carry Unwind Risk Score (0–100), 3M EUR/USD Basis, 3M JPY/USD Basis, G7 Real Policy Spread.
  - Central Visual: Heatmap matrix of G7 Real Policy Rates (Central Bank Rate minus 12M CPI).
  - Volatility & Unwind Monitor: JPY/USD implied volatility vs 10Y JGB yield velocity.

---

## 4. Frontend Component Structure

* **New Pages**:
  - `src/pages/labs/InterbankFundingLab.tsx`
  - `src/pages/labs/TreasurySupplyRadar.tsx`
  - `src/pages/labs/FxCarryMatrixLab.tsx`
* **Shared Primitives**: Reusable `MetricCard`, `FreshnessChip`, `DataHealthBanner`, Recharts `ResponsiveContainer`.
* **Routing**: Registered in `src/App.tsx` and listed in `src/pages/labs/ThematicLabsIndexPage.tsx`.

---

## 5. Verification & Test Plan

1. **TypeScript & Linting**: `npx tsc --noEmit` and `npm run lint` (`--max-warnings 0`).
2. **Vitest Unit Tests**: `npm run test` ensuring all existing 399+ tests pass.
3. **Build & Prerender**: `npm run build` validating bundle budget and SEO meta tags.

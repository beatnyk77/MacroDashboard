# Design Document: Sub-Project 1 – Positioning & Physical Flow Telemetry

**Date**: 2026-08-29  
**Status**: Draft  
**Target Subsystem**: Data Ingestion Engine & Institutional Desk Telemetry

---

## 1. Objectives

Provide institutional capital allocators with actionable market positioning and physical flow telemetry without requiring $25,000+/yr subscription terminals (Bloomberg, Eikon, Refinitiv):
1. **CFTC Commitments of Traders (COT) & Squeeze Radar**: Track speculative vs. commercial net positioning across 10Y Treasuries, Gold, WTI Crude, DXY, and S&P 500 futures, with rolling 3-year percentile ranks to detect extreme positioning and squeeze risks.
2. **EIA 3:2:1 Refinery Crack Spread & US SPR Telemetry**: Track physical refining margins and emergency strategic petroleum reserve levels.
3. **US Net Liquidity Index**: Compute the canonical macro liquidity formula ($\text{Fed Assets} - \text{TGA} - \text{RRP}$) with daily deltas and 30-day z-scores.

---

## 2. Ingestion Architecture & Data Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ Scheduled Ingestion Workers (GitHub Actions & Edge Workers) │
│                                                             │
│  • CFTC Ingestor: Downloads weekly CFTC Financial & Com.    │
│    Futures reports (Fridays 20:30 UTC).                     │
│  • EIA / Market Ingestor: Computes 3:2:1 Crack Spread and   │
│    fetches weekly SPR inventory levels.                     │
│  • Net Liquidity Compute: Evaluates Fed - TGA - RRP daily.  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Supabase Postgres Warehouse (`metric_observations`)          │
│                                                             │
│  • COT_UST_10Y_NET_SPEC, COT_GOLD_NET_SPEC, etc.            │
│  • CRACK_SPREAD_321_USD, OIL_SPR_LEVEL_US                   │
│  • US_NET_LIQUIDITY_USD_BN                                  │
│  • source_ref: live_api:cftc:cot, live_api:eia:petroleum    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ GraphiQuestor Terminal & Hooks Layer                        │
│                                                             │
│  • `useCOTPositioning()` hook with squeeze risk scoring     │
│  • `useRefineryCrackSpread()` & `useNetLiquidity()` hooks   │
│  • `COTPositioningCard` and `NetLiquidityGauge` components  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Metrics Specification

| Metric ID | Description | Source | Frequency | Unit |
| :--- | :--- | :--- | :--- | :--- |
| `COT_UST_10Y_NET_SPEC` | 10Y Treasury Speculator Net Position | CFTC Financial Futures | Weekly (Fri) | contracts |
| `COT_GOLD_NET_SPEC` | Gold Futures Speculator Net Position | CFTC Disaggregated | Weekly (Fri) | contracts |
| `COT_OIL_WTI_NET_SPEC`| WTI Crude Speculator Net Position | CFTC Disaggregated | Weekly (Fri) | contracts |
| `COT_DXY_NET_SPEC` | US Dollar Index Net Position | CFTC Financial Futures | Weekly (Fri) | contracts |
| `COT_SP500_NET_SPEC` | E-Mini S&P 500 Net Spec Position | CFTC Financial Futures | Weekly (Fri) | contracts |
| `CRACK_SPREAD_321_USD`| 3:2:1 Refinery Crack Spread | Market / EIA | Daily | USD/bbl |
| `OIL_SPR_LEVEL_US` | US Strategic Petroleum Reserve Level | US EIA API | Weekly | M bbl |
| `US_NET_LIQUIDITY_USD_BN` | US Net Liquidity (Fed - TGA - RRP)| FRED / US Treasury | Daily | USD Bn |

---

## 4. Derived Intelligence & Squeeze Score Algorithm

For each CFTC series, the system calculates a rolling 3-year percentile ($P$) and z-score ($Z$):
- **$P \le 5\%$ (or $Z \le -2.0$)**: `BULL_SQUEEZE_RISK` — Extreme short positioning by speculative funds; vulnerable to sharp upside short-covering rallies.
- **$P \ge 95\%$ (or $Z \ge +2.0$)**: `CROWDED_LONG_RISK` — Extreme speculative euphoria; vulnerable to long liquidation cascades.
- **$5\% < P < 95\%$**: `NEUTRAL_RANGE` — Balanced structural exposure.

---

## 5. UI Components & Terminal Integration

1. **`COTSqueezeRadarCard`**:
   - Interactive visual radar displaying net contracts, 3Y percentile bars, and color-coded squeeze alerts.
   - Toggle between Treasuries, Commodities, Currencies, and Equities.
2. **`NetLiquidityRow` Update**:
   - Upgrades existing Net Liquidity widget with 30-day liquidity momentum and equity multiple correlation overlay.
3. **`RefineryCrackSpreadCard`**:
   - Surfaces real physical margin health alongside Brent/WTI curves.

---

## 6. Implementation Plan & Milestones

1. **Backend & Ingestion**:
   - Create `scripts/ingest_cftc_cot.py` with direct parsing of CFTC zip/CSV feeds.
   - Update `.github/workflows/ingest-market-data.yml` to trigger Friday weekly COT ingestion.
   - Add crack spread calculation to daily market ingestion script.
2. **Registry & Types**:
   - Register new IDs in `src/constants/metricIds.ts`.
3. **Frontend Hooks & Components**:
   - Create `src/hooks/useCOTPositioning.ts`.
   - Create `src/components/COTSqueezeRadar.tsx` and integrate into Terminal / Thematic Labs.

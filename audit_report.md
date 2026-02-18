# GraphiQuestor: Pre-Launch End-to-End Audit Report

**Date**: 2026-02-18
**Audience**: Institutional & Central Banking Users
**System Status**: Degraded (Data Latency Detected)

---

## 1. What’s Working Well
*   **Aesthetics & Elite Branding**: The glassmorphic high-contrast dark mode meets institutional standards for premium clinical visualization.
*   **Infrastructure Stability**: The SPA architecture is robust; no runtime crashes or endless loading loops detected during stress tests.
*   **Health Transparency**: The `DataHealthBanner` successfully identifies and reports the current delay in feeds (currently reporting delays in 9/17 feeds).
*   **Visual Logic**: The "Macro Heartbeat" and "Liquidity Impulse" logic is sound and matches institutional terminology.

## 2. Needs Immediate Fix (P1 – Critical)
*   **Data Ingestion (Finnhub)**: `ingest-macro-events` is failing with `403 Forbidden`. This results in stale "Key Alpha" events.
    *   - **Finnhub Ingestion**: [FAILED] Still hitting 403 Forbidden even after key rotation. Mock fallback is active.
*   **Economic Calendar**: [STALE] Pending live key propagation. Actual values for February 11-15 are missing despite the date being Feb 18.
    *   *Root Cause*: Upstream limitation or ingestion bug in the `ingest-macro-events` function.
*   **Stale Metrics**: 14 identified (Top 5 listed below).
*   **Systemic Risk Indicators (No Data)**: `SOFR_OIS_SPREAD` and `GLOBAL_OIL_REFINING_UTILIZATION` are currently empty in the database.
*   **Geopolitical Pulse**: Reporting "All Quiet" while feed status is "Degraded" creates an intelligence blind spot.

## 3. Needs Polish (P2/P3 – Improvements)
*   **Typography (A11y)**: Significant use of `0.55rem` (8.8px) and `0.65rem` (10.4px) text in `TodaysBriefPanel`. This fails accessibility checks and is too small for professional readability.
*   **Mobile Experience**: 
    *   Chart detail loss: Recharts bar widths become nearly invisible at 375px.
    *   Header Overlap: "GraphiQuestor" brand overlaps the Status Indicator on small viewports.
*   **Newsletter Pipeline**: Currently doesn't check for "Staleness" when generating the `Regime Digest`. It may compare 1-year old data points and present them as recent "Changes".

---

## Prioritized Task List

| ID | Component | Type | Priority | Safety | Action |
|:---|:---|:---|:---|:---|:---|
| 01 | `src/features/dashboard/.../TodaysBriefPanel.tsx` | A11y | P2 | ✅ Safe | Increase font sizes from 8.8px to 12px min. |
| 02 | `src/components/DataHealthBanner.tsx` | UI | P2 | ✅ Safe | Add responsive padding to prevent mobile overlap. |
| 03 | `supabase/functions/ingest-macro-events` | Data | P1 | ⚠️ Invasive | Update Finnhub API Key and verify scope. |
| 04 | `supabase/functions/generate-newsletter` | Automation | P2 | ⚠️ Invasive | Add `last_observation_date` check to halt generation if data > 7D stale. |
| 05 | `src/components/USDebtMaturityWall.tsx` | A11y | P3 | ✅ Safe | Add ARIA labels to SVG legend items. |

## Stale Metrics & Fallback Strategy

| Metric ID | Name | Overdue (Days) | Proposed Fix |
|---|---|---|---|
| `EU_DEBT_GDP_PCT` | Euro Area Govt Debt | 5892 | Update source to ECB SDMX API. |
| `PMI_US_SERVICES` | US Services PMI | 2209 | Switch to S&P Global direct release or FRED. |
| `TED_SPREAD` | TED Spread | 1489 | **REPLACE**: Discontinued (LIBOR). Use SOFR-OIS Spread. |
| `BR_DEBT_GDP_PCT` | Brazil Govt Debt | 1144 | Fallback to BCB (Central Bank of Brazil) API. |
| `TR_DEBT_GDP_PCT` | Turkey Govt Debt | 1144 | Fallback to TCMB (Central Bank of Turkey) API. |

---

## Technical Debt & Compliance Fixes Applied
- [x] **Accessibility**: Added ARIA roles/labels to all legends and status icons.
- [x] **Responsive**: Fixed overlap in `DataHealthBanner` on small screens.
- [x] **Typography**: Increased micro-text size (>0.7rem) for better legibility.
- [x] **Safety**: Implemented staleness-guard in `generate-newsletter` (halts if data > 7D stale).
- [x] **Fallback UI**: Implemented "Data Delayed" pulsing amber badges for stale metrics in Dashboard.

## Final Launch Readiness Checklist
- [ ] **Data Freshness**: All P1 ingestion failures fixed.
- [ ] **No Errors**: 0 console errors on dashboard load.
- [ ] **Accessibility**: Contrast > 4.5:1 and min font size 12px for body text.
- [ ] **Mobile Test**: Charts readable at 375px.
- [ ] **Newsletter**: Test digest generation with current fresh data.

> [!IMPORTANT]
> **Total Stale Metrics Post-Audit**: 14
> **Stale Feeds Count**: 9/17
> Launch is **NOT RECOMMENDED** until the Finnhub ingestion is restored.

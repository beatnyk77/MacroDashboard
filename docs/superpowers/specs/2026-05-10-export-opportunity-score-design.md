# Export Opportunity Score – Design Spec

**Date:** 2026-05-10

## Overview
We will enrich the existing trade data (Comtrade imports/exports) with additional dimensions and compute a composite **Export Opportunity Score (EOS)** for each 6‑digit HS code. The EOS will be displayed on the Trade Intelligence page and used for ranking, filtering, and visual cues.

## Architecture
1. **Data Enrichment Pipeline** (backend)
   - Extend the `supabase` edge function that pulls Comtrade data to also fetch:
     * Latest average FOB price per HS code (via external price API).
     * Tariff rates for major target markets (via WTO/UN data).
     * Logistics cost proxy (distance, port fees).
     * ESG risk flags (if available).
   - Store enriched rows in a new view `vw_enriched_trade` (or materialised table) with columns for each factor.
2. **Scoring Service** (backend)
   - Implement a Python function `compute_eos(row)` that normalises each factor (0‑1) and applies weights (configurable via `config.yaml`).
   - Insert the EOS into `trade_opportunity` table keyed by `hs_code`.
3. **API Layer** (gateway)
   - Add endpoint `/api/trade/eos?hs=XXXXXX` returning `{hs_code, eos, components}`.
   - Cache results for 5 min.
4. **Frontend Integration** (React)
   - Extend `HSCodeSearch` results to include `eos` bar and numeric badge.
   - Add a filter dropdown “Minimum EOS” in `TradeIntelligencePage`.
   - Highlight top‑5 codes with a glowing outline.

## Scoring Algorithm (default weights)
| Factor                | Normalisation | Weight |
|-----------------------|---------------|--------|
| Growth trend (5‑yr)   | Z‑score → 0‑1 | 0.30   |
| Price advantage       | Inverse price → 0‑1 | 0.20 |
| Tariff barrier (avg)  | 1‑(tariff/100) → 0‑1 | 0.20 |
| Logistics cost index  | Inverse cost → 0‑1 | 0.15 |
| ESG risk (binary)     | 1‑risk → 0‑1 | 0.15 |

EOS = Σ(weight × normalised_factor).
Weights are overridable in `config.yaml` under `trade.opportunity.weights`.

## UI Mockup (textual)
- **Search Result Card** – add a horizontal bar under the HS description showing EOS (green‑to‑red gradient). Tooltip displays component breakdown.
- **Filter Bar** – slider ranging 0‑1 to hide low‑score codes.
- **Detail Pane** – when a code is selected, show a radar chart of component contributions.

## Testing Plan
1. **Unit Tests** – Python tests for `compute_eos` covering edge cases (missing factors → defaults).
2. **Integration Tests** – API returns EOS for known HS codes; cache header present.
3. **Snapshot Tests** – React component renders EOS bar correctly for sample data.
4. **Performance** – Ensure EOS computation < 100 ms per request under load (use `locust` script).

## Open Questions
- Which external price API shall we use? (e.g., Quandl, World Bank?)
- Should we expose weight overrides to power users via UI?

---
*Design written per superpowers brainstorming workflow. Ready for review and commit.*
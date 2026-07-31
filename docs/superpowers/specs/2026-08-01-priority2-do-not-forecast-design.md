# Priority 2 — "Do Not Forecast" Positioning (FOMC Minutes)

**Status:** Approved direction B (de-specify) · implement 2026-08-01  
**Scope:** `check-fomc-minutes` prompt + `FOMCMinutesAnalysisCard` + historical advisory fields

## Problem

The FOMC analysis pipeline instructed an "elite CIO" persona to produce **tactical trade advisory** (`actionable_insight`), rendered in an amber "Actionable sovereign portfolio Advisory" block — contradicting GraphiQuestor's tagline: *Observe structural reality; do not forecast.*

## Direction B (chosen)

Rewrite generation and presentation so content describes **observable regime / minutes structure**, not trades. Keep JSON column names for zero schema churn.

## Changes

1. **Prompt** — system/user: minutes reader, no forecasts, no tickers/price targets/buy-sell/overweight. Redefine `capital_implications` → structural regime implications; `actionable_insight` → primary structural takeaway; `raw_analysis` → extended minutes analysis (no CIO persona).
2. **UI** — neutral structural takeaway block (not amber advisory); relabel implications; "Full minutes analysis"; quiet strip: interpretive summary · not a forecast or investment advice. Omit empty fields.
3. **Historical** — null `actionable_insight` and `capital_implications` on existing rows so trade-call text is not shown.
4. **Ops** — Discord alert: structural takeaway, not CIO insight; optional `force=true` to re-analyze latest meeting after prompt change.

## Non-goals

- GQ Research View product surface  
- Renaming DB columns  
- Touching morning brief / regime digests (already clean)

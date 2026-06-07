-- ============================================================
-- Migration: seed_brief
-- Date: 2026-06-07
-- Purpose: Inserts a seed macro brief for today's date so that the landing page renders immediately.
-- ============================================================

INSERT INTO daily_macro_briefs (
  brief_date,
  focus_areas,
  content,
  regime_score,
  regime_label,
  model_used
) VALUES (
  CURRENT_DATE,
  ARRAY['gold_dedollarization', 'india', 'us_macro'],
  '{
    "what_changed": [
      "India FX reserves rose $2.4bn WoW to $665.4bn — RBI buffer strengthening ahead of monsoon season",
      "US 10Y yield +6bps overnight to 4.48% — real yield approaching 2% resistance level",
      "Gold held $2,340/oz despite dollar strength — central bank bid floor confirmed at $2,300",
      "India Manufacturing PMI at 58.1 — fourth consecutive month above 57, strongest in 3 years"
    ],
    "regime_status": "Macro regime remains Neutral at 55/100 with liquidity conditions supportive despite restrictive policy backdrop. The USD-Gold divergence is the primary contradiction to monitor — historically resolves in favor of gold when fiscal dominance dynamics dominate.",
    "focus_observations": [
      "India credit cycle in Downturn quadrant — CD ratio 80.2% signals RBI liquidity management ahead",
      "Debt/Gold ratio at 29.1x — structural bid for hard assets as US debt monetization ratio approaches 20%",
      "US Treasury auction bid-to-cover at 2.52x — institutional demand holding, but 10Y weak relative to bills"
    ],
    "watch_today": [
      "RBI MPC decision Friday — watch Governor Malhotra speech for forward guidance on liquidity stance",
      "US 30Y auction — demand score vs 5-year average will signal foreign central bank appetite",
      "Gold $2,350 resistance — break would confirm central bank accumulation phase continuation"
    ]
  }'::jsonb,
  55,
  'Neutral',
  'seed-data'
) ON CONFLICT (brief_date, focus_areas) DO NOTHING;

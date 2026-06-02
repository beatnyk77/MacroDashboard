-- ============================================================
-- Migration: vw_country_trade_imports
-- Date: 2026-06-03
-- Purpose: Readable view over trade_global_aggregates for the
--   Imports section on /trade. Computes YoY growth inline
--   by self-joining on year-1. Only exposes rows where
--   import_value_usd is populated.
-- ============================================================

CREATE OR REPLACE VIEW public.vw_country_trade_imports AS
SELECT
    cur.reporter_iso3,
    cur.hs_code,
    cur.year,
    cur.import_value_usd,
    -- Inline YoY growth (override stored value which may be NULL for imports)
    CASE
        WHEN prev.import_value_usd IS NOT NULL
             AND prev.import_value_usd > 0
        THEN ROUND(
            ((cur.import_value_usd::NUMERIC - prev.import_value_usd::NUMERIC)
              / prev.import_value_usd::NUMERIC) * 100,
            2
        )
        ELSE cur.yoy_growth_pct
    END AS yoy_growth_pct,
    -- Share of this reporter's total imports in this year
    CASE
        WHEN totals.total_imports > 0
        THEN ROUND(
            (cur.import_value_usd::NUMERIC / totals.total_imports::NUMERIC) * 100,
            3
        )
        ELSE cur.share_of_total_pct
    END AS share_of_total_pct,
    cur.untapped_score,
    cur.fetched_at
FROM public.trade_global_aggregates cur
-- Self-join for previous year
LEFT JOIN public.trade_global_aggregates prev
    ON prev.reporter_iso3 = cur.reporter_iso3
    AND prev.hs_code     = cur.hs_code
    AND prev.year        = cur.year - 1
-- Aggregate totals for share calculation
LEFT JOIN (
    SELECT reporter_iso3, year, SUM(import_value_usd) AS total_imports
    FROM public.trade_global_aggregates
    WHERE import_value_usd IS NOT NULL
      AND import_value_usd > 0
    GROUP BY reporter_iso3, year
) totals
    ON totals.reporter_iso3 = cur.reporter_iso3
    AND totals.year         = cur.year
WHERE cur.import_value_usd IS NOT NULL
  AND cur.import_value_usd > 0;

-- Public read (views inherit underlying table RLS policies)
GRANT SELECT ON public.vw_country_trade_imports TO anon, authenticated;

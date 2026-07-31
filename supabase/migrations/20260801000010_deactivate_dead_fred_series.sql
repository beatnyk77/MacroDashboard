-- Dead/invalid FRED series IDs that soft-fail every ingest-fred run (HTTP 400 series does not exist).
-- Verified live invoke 2026-08-01 after Priority 1 deploy.
UPDATE public.metrics
SET is_active = false,
    metadata = metadata || jsonb_build_object(
        'deactivation_reason',
        'FRED series ID returns HTTP 400 series does not exist (verified 2026-08-01). Deactivated rather than leave silently orphaned.'
    )
WHERE id IN (
    'MOVE_INDEX',              -- metadata.fred_id = MOVE (not published on free FRED)
    'IN_CREDIT_TOTAL',         -- INDCBRLOANSTOTL
    'IN_WPI_MFG_YOY',          -- WPIITMN01INM657N
    'IN_RETAIL_SALES_YOY',     -- INDRETT01INM661N
    'IN_GOLD_RESERVES_TONNES'  -- INTLRESGOLDINM193N
);

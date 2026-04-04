-- Migration: Expand Metric Categories (Safe Drop)
-- Purpose: Remove the restrictive CHECK constraint on the metrics table 
--          to allow for flexible category additions (e.g., 'capital_flows', 'monetary_policy').
--          This is a safer approach than guessing every existing category in a live DB.

BEGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'metrics_category_check') THEN
        ALTER TABLE metrics DROP CONSTRAINT metrics_category_check;
    END IF;
END $$;

-- Instead of a CHECK constraint, we will enforce category integrity at the application level
-- or re-add a validated comprehensive constraint in a future audit phase.

COMMIT;

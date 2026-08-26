-- supabase/migrations/20260802214500_fix_gsc_performance_unique_index.sql
--
-- gsc_performance's only unique index was an expression index
-- (COALESCE(country,''), COALESCE(device,'')), which Postgres's
-- ON CONFLICT (column-list) inference can never match — the gsc-sync
-- function's upsert would fail on every call once its auth bug was fixed.
-- UNIQUE NULLS NOT DISTINCT (native to Postgres 15+, this project runs 17)
-- gives the same NULL-safe dedup semantics as the COALESCE trick, but as a
-- plain-column index that ON CONFLICT can actually bind to.

DROP INDEX IF EXISTS public.idx_gsc_performance_unique;

-- The schema may already contain this constraint when the migration history
-- was repaired after an earlier manual application. Keep the migration
-- replay-safe so CI can reconcile history without failing on 42P07.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.gsc_performance'::regclass
          AND conname = 'gsc_performance_unique'
    ) THEN
        ALTER TABLE public.gsc_performance
            ADD CONSTRAINT gsc_performance_unique
            UNIQUE NULLS NOT DISTINCT (date, page, query, country, device);
    END IF;
END
$$;

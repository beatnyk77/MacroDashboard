-- ============================================================
-- Migration: daily_macro_briefs
-- Date: 2026-06-04
-- Purpose: Stores pre-generated morning macro briefs.
--   One row per (brief_date, focus_areas[]).
--   The Edge Function upserts daily at 05:30 UTC.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_macro_briefs (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  brief_date      date        NOT NULL,
  focus_areas     text[]      NOT NULL DEFAULT '{}',
  content         jsonb       NOT NULL,
  regime_score    integer,
  regime_label    text,
  generated_at    timestamptz DEFAULT now(),
  model_used      text,
  tokens_used     integer,
  CONSTRAINT daily_macro_briefs_unique_date_focus
    UNIQUE (brief_date, focus_areas)
);

CREATE INDEX IF NOT EXISTS idx_daily_macro_briefs_date
  ON public.daily_macro_briefs (brief_date DESC);

-- RLS: read-only for anonymous (needed for client-side fetch)
ALTER TABLE public.daily_macro_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_macro_briefs_select"
  ON public.daily_macro_briefs
  FOR SELECT
  TO anon, authenticated
  USING (true);

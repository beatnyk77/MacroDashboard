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

-- Schema Documentation
COMMENT ON TABLE public.daily_macro_briefs IS 'Pre-generated daily macro briefs. One row per (brief_date, focus_areas[]) combination. Upserted daily at 05:30 UTC by generate-morning-brief edge function.';
COMMENT ON COLUMN public.daily_macro_briefs.brief_date IS 'Date the brief covers (YYYY-MM-DD).';
COMMENT ON COLUMN public.daily_macro_briefs.focus_areas IS 'Sorted array of focus area codes (e.g., [''gold'', ''india'', ''us'']). Used as part of unique key.';
COMMENT ON COLUMN public.daily_macro_briefs.content IS 'JSONB: {what_changed: string[], regime_status: string, focus_observations: string[], watch_today: string[]}';
COMMENT ON COLUMN public.daily_macro_briefs.regime_score IS 'Macro regime score 0-100 from daily_macro_signal at generation time.';
COMMENT ON COLUMN public.daily_macro_briefs.model_used IS 'Model identifier used for generation, or ''fallback-template'' if AI call failed.';
COMMENT ON COLUMN public.daily_macro_briefs.tokens_used IS 'Total tokens consumed by the AI call (for cost tracking). 0 for fallback briefs.';

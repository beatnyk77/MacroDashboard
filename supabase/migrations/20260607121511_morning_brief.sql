-- ============================================================
-- Migration: morning_brief
-- Date: 2026-06-07
-- Purpose: Schema for daily morning macro briefs.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_macro_briefs (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  brief_date      date        NOT NULL,
  focus_areas     text[]      NOT NULL DEFAULT '{}',
  content         jsonb       NOT NULL DEFAULT '{}',
  regime_score    integer,
  regime_label    text,
  generated_at    timestamptz DEFAULT now(),
  model_used      text,
  tokens_used     integer,
  CONSTRAINT daily_macro_briefs_unique_date_focus UNIQUE(brief_date, focus_areas)
);

CREATE INDEX IF NOT EXISTS idx_daily_macro_briefs_date 
  ON public.daily_macro_briefs(brief_date DESC);

-- Enable RLS for public read access
ALTER TABLE public.daily_macro_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_macro_briefs_select"
  ON public.daily_macro_briefs
  FOR SELECT
  TO anon, authenticated
  USING (true);

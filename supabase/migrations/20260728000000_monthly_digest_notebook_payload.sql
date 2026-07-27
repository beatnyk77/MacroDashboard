-- Monthly Regime Notebook: frozen structured payload for edition pages
ALTER TABLE public.monthly_regime_digests
  ADD COLUMN IF NOT EXISTS notebook_payload JSONB;

COMMENT ON COLUMN public.monthly_regime_digests.notebook_payload IS
  'Structured Monthly Regime Notebook (v1): board, thesis, movers, regime, quality. Source of truth for UI.';

-- Optional helper index for quality ops queries
CREATE INDEX IF NOT EXISTS idx_monthly_regime_digests_notebook_quality
  ON public.monthly_regime_digests ((notebook_payload -> 'quality' ->> 'overall'));

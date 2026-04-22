-- ============================================================
-- Daily Macro Layer: Schema Migration
-- Creates: daily_signal, daily_changes, macro_brief, macro_contradictions
-- ============================================================

-- 1. DAILY SIGNAL — one authoritative row per calendar day
CREATE TABLE IF NOT EXISTS public.daily_signal (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_date       date NOT NULL,
    regime            text NOT NULL CHECK (regime IN ('RISK_ON', 'NEUTRAL', 'RISK_OFF')),
    score             numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    confidence_pct    numeric(5,2) NOT NULL CHECK (confidence_pct >= 0 AND confidence_pct <= 100),
    score_delta       numeric(6,2) DEFAULT 0,    -- vs yesterday
    regime_changed    boolean DEFAULT false,
    key_driver        text,
    watch_item        text,
    component_scores  jsonb DEFAULT '{}',        -- {liquidity,rates,dollar,vol,metals}
    computed_at       timestamptz DEFAULT now(),
    CONSTRAINT daily_signal_date_unique UNIQUE (signal_date)
);

-- 2. DAILY CHANGES — significant metric movements for the day
CREATE TABLE IF NOT EXISTS public.daily_changes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_date     date NOT NULL REFERENCES public.daily_signal(signal_date) ON DELETE CASCADE,
    metric_id       text NOT NULL,
    metric_label    text NOT NULL,
    prev_value      numeric,
    curr_value      numeric,
    abs_delta       numeric,
    pct_delta       numeric,
    significance    text NOT NULL CHECK (significance IN ('HIGH', 'MEDIUM')),
    direction       text NOT NULL CHECK (direction IN ('UP', 'DOWN', 'FLAT')),
    interpretation  text,
    created_at      timestamptz DEFAULT now()
);

-- 3. MACRO BRIEF — the 3-4 line morning brief
CREATE TABLE IF NOT EXISTS public.macro_brief (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_date    date NOT NULL REFERENCES public.daily_signal(signal_date) ON DELETE CASCADE,
    regime_line    text NOT NULL,
    driver_line    text,
    watch_line     text,
    context_line   text,
    generated_at   timestamptz DEFAULT now(),
    CONSTRAINT macro_brief_date_unique UNIQUE (signal_date)
);

-- 4. MACRO CONTRADICTIONS — cross-market divergences
CREATE TABLE IF NOT EXISTS public.macro_contradictions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_date         date NOT NULL REFERENCES public.daily_signal(signal_date) ON DELETE CASCADE,
    contradiction_key   text NOT NULL,
    title               text NOT NULL,
    interpretation      text NOT NULL,
    severity            text NOT NULL CHECK (severity IN ('NOTABLE', 'EXTREME')),
    metric_a            text,
    metric_b            text,
    created_at          timestamptz DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_daily_signal_date
    ON public.daily_signal(signal_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_changes_date
    ON public.daily_changes(signal_date DESC);

CREATE INDEX IF NOT EXISTS idx_macro_contradictions_date
    ON public.macro_contradictions(signal_date DESC);

-- ============================================================
-- RLS Policies — public read, service_role write
-- ============================================================
ALTER TABLE public.daily_signal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_brief ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_contradictions ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "daily_signal_public_read"
    ON public.daily_signal FOR SELECT USING (true);

CREATE POLICY "daily_changes_public_read"
    ON public.daily_changes FOR SELECT USING (true);

CREATE POLICY "macro_brief_public_read"
    ON public.macro_brief FOR SELECT USING (true);

CREATE POLICY "macro_contradictions_public_read"
    ON public.macro_contradictions FOR SELECT USING (true);

-- Service role write
CREATE POLICY "daily_signal_service_write"
    ON public.daily_signal FOR ALL
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "daily_changes_service_write"
    ON public.daily_changes FOR ALL
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "macro_brief_service_write"
    ON public.macro_brief FOR ALL
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "macro_contradictions_service_write"
    ON public.macro_contradictions FOR ALL
    TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- Convenience view: latest signal with brief
-- ============================================================
CREATE OR REPLACE VIEW public.vw_latest_daily_signal AS
SELECT
    ds.signal_date,
    ds.regime,
    ds.score,
    ds.confidence_pct,
    ds.score_delta,
    ds.regime_changed,
    ds.key_driver,
    ds.watch_item,
    ds.component_scores,
    ds.computed_at,
    mb.regime_line,
    mb.driver_line,
    mb.watch_line,
    mb.context_line
FROM public.daily_signal ds
LEFT JOIN public.macro_brief mb ON mb.signal_date = ds.signal_date
ORDER BY ds.signal_date DESC
LIMIT 1;

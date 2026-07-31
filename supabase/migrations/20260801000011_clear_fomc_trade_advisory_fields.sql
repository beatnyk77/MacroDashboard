-- Priority 2: remove historical FOMC trade-advisory framing from the terminal.
-- Columns are NOT NULL — use empty string so the UI omits blocks (hasText).
-- Prompt rewrite stops generating trade calls; blanking prevents old
-- CIO/tactical-trade copy until a force re-analysis fills structural text.
UPDATE public.fomc_minutes_analysis
SET actionable_insight = '',
    capital_implications = ''
WHERE length(coalesce(actionable_insight, '')) > 0
   OR length(coalesce(capital_implications, '')) > 0;

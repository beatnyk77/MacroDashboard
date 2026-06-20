-- China Debt Phase 4: Weekly digest China debt section

ALTER TABLE public.weekly_regime_digests
    ADD COLUMN IF NOT EXISTS china_debt_section JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.weekly_regime_digests.china_debt_section IS
    'China public sector debt intelligence block — iceberg composites, layer snapshot, watch items';
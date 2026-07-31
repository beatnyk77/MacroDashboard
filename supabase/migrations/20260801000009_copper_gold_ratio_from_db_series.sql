-- LBMA gold fix series GOLDAMGBD228NLBM was removed from FRED (IBA 2022).
-- COPPER_GOLD_RATIO is now derived in ingest-fred from COPPER_PRICE_USD and
-- GOLD_PRICE_USD observations already in metric_observations (same pattern as CNY_INR_RATE).
UPDATE public.metrics
SET metadata = (metadata - 'fred_id_numerator' - 'fred_id_denominator')
    || jsonb_build_object(
        'derived_from', jsonb_build_array('COPPER_PRICE_USD', 'GOLD_PRICE_USD'),
        'derivation_note', 'Copper/gold ratio from DB series; LBMA FRED gold series discontinued 2022'
    )
WHERE id = 'COPPER_GOLD_RATIO';

-- GOLD_PRICE_USD still pointed at the dead LBMA series — clear so ingest-fred
-- does not keep soft-failing on it (other pipelines write GOLD_PRICE_USD).
UPDATE public.metrics
SET metadata = metadata - 'fred_id'
    || jsonb_build_object(
        'fred_id_removed', 'GOLDAMGBD228NLBM',
        'fred_id_removal_reason', 'IBA LBMA gold series removed from FRED 2022; live gold comes from non-FRED writers'
    )
WHERE id = 'GOLD_PRICE_USD'
  AND metadata->>'fred_id' = 'GOLDAMGBD228NLBM';

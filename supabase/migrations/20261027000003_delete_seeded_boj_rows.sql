-- Six seeded BoJ rows (written 2026-02-03) on weekly dates FRED JPNASSETS and BoJ MABS1AN11 never
-- publish, stepping by exact round amounts (assets 749.5/750.0/750.5 tn JPY after the unit fix vs
-- a real Jan 2026 of 682.9; base 604000/604500/605000 raw). Approved by the site owner.
DELETE FROM public.metric_observations
WHERE metric_id IN ('BOJ_TOTAL_ASSETS_TRJPY', 'BOJ_MONETARY_BASE_TRJPY')
  AND as_of_date IN ('2026-01-17', '2026-01-24', '2026-01-31');

-- Stale-data audit 2026-10-27: remove rows written from hard-coded constants or broken formulas
-- by ingest-central-banks (<= v8) and ingest-us-macro-fiscal before 2026-10-26. Approved by the
-- site owner. Each DELETE matches the exact fabricated value so a later real write is untouched.

-- FX carry block: constant swap bases (-18.4 / -42.8), G7 matrix and JPY carry score derived from them.
DELETE FROM public.metric_observations WHERE metric_id = 'EURUSD_3M_SWAP_BASIS_BPS'    AND value = -18.4;
DELETE FROM public.metric_observations WHERE metric_id = 'JPYUSD_3M_SWAP_BASIS_BPS'    AND value = -42.8;
DELETE FROM public.metric_observations WHERE metric_id = 'G7_REAL_POLICY_RATE_MATRIX'  AND value = 1.63;
DELETE FROM public.metric_observations WHERE metric_id = 'JPY_CARRY_UNWIND_RISK_SCORE' AND value = 67;

-- PBOC constants (MLF 2.00, RRR 9.50, 7D reverse repo 1.50, MLF minus a fixed 4.33 fed funds).
DELETE FROM public.metric_observations WHERE metric_id = 'CN_MLF_RATE'        AND value = 2.0;
DELETE FROM public.metric_observations WHERE metric_id = 'CN_RRR_LARGE'       AND value = 9.5;
DELETE FROM public.metric_observations WHERE metric_id = 'CN_REVERSE_REPO_7D' AND value = 1.5;
DELETE FROM public.metric_observations WHERE metric_id = 'CN_PBOC_FED_GAP'    AND value = -2.33;
DELETE FROM public.metric_observations
  WHERE metric_id = 'CN_POLICY_RATE' AND value = 2.0 AND source_ref IS NULL;
DELETE FROM public.china_pboc_ops
  WHERE source = 'FRED/PBoC' AND mlf_rate = 2.0 AND rrr_rate_large = 9.5 AND reverse_repo_7d = 1.5;

-- Treasury supply radar: hard-coded 10Y bid-to-cover and the stress score computed from it.
DELETE FROM public.metric_observations
  WHERE metric_id = 'UST_AUCTION_BID_TO_COVER_10Y' AND as_of_date = '2026-09-09' AND value = 2.48;
DELETE FROM public.metric_observations
  WHERE metric_id = 'PRIMARY_DEALER_ABSORPTION_STRESS' AND as_of_date = '2026-09-09' AND value = 51;

-- Global liquidity composite: TGA scaled as billions instead of millions plus a constant PBOC term.
DELETE FROM public.metric_observations
  WHERE metric_id = 'GLOBAL_NET_LIQUIDITY_USD_TR' AND as_of_date = '2026-10-26' AND value = -932.79;

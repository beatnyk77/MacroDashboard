-- supabase/migrations/20260731000001_gov_financial_position_views.sql
-- Government Financial Position: serving views for ranks, HHI, and narrative inputs

-- Prefer original (non-restated) FRUSG rows
CREATE OR REPLACE VIEW public.vw_frusg_net_cost_yearly AS
SELECT
  stmt_fiscal_year,
  restmt_flag,
  agency_nm,
  net_cost_bil,
  gross_cost_bil,
  earned_revenue_bil,
  record_date,
  CASE
    WHEN lower(agency_nm) = 'total' THEN true
    ELSE false
  END AS is_total_row
FROM public.frusg_net_cost
WHERE restmt_flag = 'N';

CREATE OR REPLACE VIEW public.vw_frusg_net_cost_concentration AS
WITH agency AS (
  SELECT stmt_fiscal_year, agency_nm, net_cost_bil
  FROM public.vw_frusg_net_cost_yearly
  WHERE NOT is_total_row
    AND net_cost_bil IS NOT NULL
    AND net_cost_bil > 0
),
-- Positive agency sum used only as share/HHI denominator
agency_tot AS (
  SELECT stmt_fiscal_year, sum(net_cost_bil) AS agency_sum_net_cost
  FROM agency
  GROUP BY 1
),
-- Prefer FRUSG "Total" row for headline total_net_cost (consolidations differ from agency sum)
stmt_tot AS (
  SELECT stmt_fiscal_year, net_cost_bil AS stmt_total_net_cost
  FROM public.vw_frusg_net_cost_yearly
  WHERE is_total_row
    AND net_cost_bil IS NOT NULL
),
ranked AS (
  SELECT
    a.stmt_fiscal_year,
    a.agency_nm,
    a.net_cost_bil,
    a.net_cost_bil / nullif(t.agency_sum_net_cost, 0) AS share,
    row_number() OVER (PARTITION BY a.stmt_fiscal_year ORDER BY a.net_cost_bil DESC) AS rnk
  FROM agency a
  JOIN agency_tot t ON t.stmt_fiscal_year = a.stmt_fiscal_year
)
SELECT
  r.stmt_fiscal_year,
  sum(CASE WHEN r.rnk <= 5 THEN r.share ELSE 0 END) AS top5_share,
  sum(CASE WHEN r.rnk <= 10 THEN r.share ELSE 0 END) AS top10_share,
  sum(r.share * r.share) AS hhi,
  coalesce(max(st.stmt_total_net_cost), max(at.agency_sum_net_cost)) AS total_net_cost
FROM ranked r
JOIN agency_tot at ON at.stmt_fiscal_year = r.stmt_fiscal_year
LEFT JOIN stmt_tot st ON st.stmt_fiscal_year = r.stmt_fiscal_year
GROUP BY r.stmt_fiscal_year;

-- Balance sheet summary: totals from Total assets / Total liabilities rows.
-- net_position is derived (assets - liabilities), NOT a SUM of "Net position" lines
-- (those can appear multiple times / double-count across accounts).
CREATE OR REPLACE VIEW public.vw_frusg_balance_sheet_summary AS
SELECT
  stmt_fiscal_year,
  max(record_date) AS record_date,
  sum(CASE WHEN lower(line_item_desc) = 'total assets' THEN position_bil END) AS total_assets_bil,
  sum(CASE WHEN lower(line_item_desc) = 'total liabilities' THEN position_bil END) AS total_liabilities_bil,
  sum(CASE WHEN lower(line_item_desc) = 'total assets' THEN position_bil END)
    - sum(CASE WHEN lower(line_item_desc) = 'total liabilities' THEN position_bil END) AS net_position_bil
FROM public.frusg_balance_sheet
WHERE restmt_flag = 'N'
GROUP BY stmt_fiscal_year;

CREATE OR REPLACE VIEW public.vw_frusg_bs_line_items AS
SELECT stmt_fiscal_year, record_date, account_desc, line_item_desc, position_bil, src_line_nbr
FROM public.frusg_balance_sheet
WHERE restmt_flag = 'N';

CREATE OR REPLACE VIEW public.vw_frusg_net_position_summary AS
SELECT stmt_fiscal_year, record_date, account_desc, line_item_desc,
       consolidated_bil, non_dedicated_funds_bil, dedicated_funds_bil, eliminations_bil
FROM public.frusg_net_position
WHERE restmt_flag = 'N';

CREATE OR REPLACE VIEW public.vw_frusg_reconciliation_summary AS
SELECT stmt_fiscal_year, record_date, account_desc, component_desc, line_item_desc, position_bil
FROM public.frusg_reconciliations
WHERE restmt_flag = 'N';

CREATE OR REPLACE VIEW public.vw_frusg_cash_balance_summary AS
SELECT stmt_fiscal_year, record_date, account_desc, component_desc, line_item_desc, position_bil
FROM public.frusg_cash_balance
WHERE restmt_flag = 'N';

-- MTS: detail rows only (data_type_cd = 'D'); exclude totals/subtotals and blank amounts.
-- Negatives kept (offsetting receipts / adjustments); amounts are raw dollars.
CREATE OR REPLACE VIEW public.vw_mts_agency_outlays_monthly AS
SELECT
  record_date,
  classification_id,
  parent_id,
  classification_desc,
  current_month_net_outly,
  current_fytd_net_outly,
  prior_fytd_net_outly,
  sequence_level_nbr,
  data_type_cd,
  line_code_nbr
FROM public.mts_agency_outlays
WHERE current_month_net_outly IS NOT NULL
  AND data_type_cd = 'D'
  AND classification_desc !~* '^total';

CREATE OR REPLACE VIEW public.vw_mts_agency_outlays_rank AS
WITH latest AS (
  SELECT max(record_date) AS record_date FROM public.mts_agency_outlays
),
month_rows AS (
  SELECT m.*
  FROM public.mts_agency_outlays m
  JOIN latest l ON m.record_date = l.record_date
  WHERE m.current_month_net_outly IS NOT NULL
    -- Prefer detail; exclude totals (T) / subtotals (S) and labels starting with Total
    AND m.data_type_cd = 'D'
    AND m.classification_desc !~* '^total'
),
tot AS (
  -- Share denominator: positive outlays only so negatives don't distort total.
  -- Share for a negative row may be negative; rank still includes all detail rows.
  SELECT sum(CASE WHEN current_month_net_outly > 0 THEN current_month_net_outly ELSE 0 END) AS total_outly
  FROM month_rows
),
hist AS (
  SELECT classification_desc,
         stddev_samp(current_month_net_outly) AS vol_12m
  FROM public.mts_agency_outlays
  WHERE record_date >= (SELECT record_date - interval '12 months' FROM latest)
    AND current_month_net_outly IS NOT NULL
    AND data_type_cd = 'D'
    AND classification_desc !~* '^total'
  GROUP BY 1
)
SELECT
  m.record_date,
  m.classification_desc,
  m.current_month_net_outly,
  m.current_fytd_net_outly,
  m.prior_fytd_net_outly,
  CASE
    WHEN m.prior_fytd_net_outly IS NOT NULL AND m.prior_fytd_net_outly <> 0
    THEN (m.current_fytd_net_outly - m.prior_fytd_net_outly) / abs(m.prior_fytd_net_outly)
    ELSE NULL
  END AS yoy_fytd,
  m.current_month_net_outly / nullif(t.total_outly, 0) AS share,
  h.vol_12m,
  row_number() OVER (ORDER BY m.current_month_net_outly DESC) AS rnk
FROM month_rows m
CROSS JOIN tot t
LEFT JOIN hist h ON h.classification_desc = m.classification_desc;

CREATE OR REPLACE VIEW public.vw_receipts_by_agency_yearly AS
SELECT
  extract(year from r.record_date)::int AS fiscal_year_end_year,
  r.record_date,
  r.aid_cd,
  coalesce(m.agency_name, r.aid_cd) AS agency_name,
  sum(r.receipt_amt) AS receipt_amt
FROM public.treasury_receipts_by_dept r
LEFT JOIN public.agency_code_map m ON m.aid_cd = r.aid_cd
GROUP BY 1, 2, 3, 4;

CREATE OR REPLACE VIEW public.vw_gfp_narrative_inputs AS
WITH latest_fy AS (
  SELECT max(stmt_fiscal_year) AS fy FROM public.vw_frusg_net_cost_yearly
),
conc AS (
  SELECT c.* FROM public.vw_frusg_net_cost_concentration c
  JOIN latest_fy l ON c.stmt_fiscal_year = l.fy
),
bs AS (
  SELECT b.* FROM public.vw_frusg_balance_sheet_summary b
  JOIN latest_fy l ON b.stmt_fiscal_year = l.fy
),
prior_bs AS (
  SELECT b.* FROM public.vw_frusg_balance_sheet_summary b
  JOIN latest_fy l ON b.stmt_fiscal_year = l.fy - 1
)
SELECT
  (SELECT fy FROM latest_fy) AS latest_fy,
  conc.top5_share,
  conc.top10_share,
  conc.hhi,
  conc.total_net_cost,
  bs.total_assets_bil,
  bs.total_liabilities_bil,
  bs.net_position_bil,
  bs.net_position_bil - prior_bs.net_position_bil AS net_position_yoy_bil
FROM conc
CROSS JOIN bs
LEFT JOIN prior_bs ON true;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
-- Views inherit via table grants in many setups; ensure:
GRANT SELECT ON public.vw_frusg_net_cost_yearly TO anon, authenticated;
GRANT SELECT ON public.vw_frusg_net_cost_concentration TO anon, authenticated;
GRANT SELECT ON public.vw_frusg_balance_sheet_summary TO anon, authenticated;
GRANT SELECT ON public.vw_frusg_bs_line_items TO anon, authenticated;
GRANT SELECT ON public.vw_frusg_net_position_summary TO anon, authenticated;
GRANT SELECT ON public.vw_frusg_reconciliation_summary TO anon, authenticated;
GRANT SELECT ON public.vw_frusg_cash_balance_summary TO anon, authenticated;
GRANT SELECT ON public.vw_mts_agency_outlays_monthly TO anon, authenticated;
GRANT SELECT ON public.vw_mts_agency_outlays_rank TO anon, authenticated;
GRANT SELECT ON public.vw_receipts_by_agency_yearly TO anon, authenticated;
GRANT SELECT ON public.vw_gfp_narrative_inputs TO anon, authenticated;

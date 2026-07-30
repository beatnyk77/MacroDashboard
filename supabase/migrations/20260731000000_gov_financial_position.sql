-- supabase/migrations/20260731000000_gov_financial_position.sql
-- Government Financial Position: FRUSG accrual + MTS outlays + receipts by dept

CREATE TABLE IF NOT EXISTS public.frusg_net_cost (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  stmt_fiscal_year integer NOT NULL,
  restmt_flag text NOT NULL CHECK (restmt_flag IN ('Y', 'N')),
  agency_nm text NOT NULL,
  gross_cost_bil numeric,
  earned_revenue_bil numeric,
  change_assumptions_bil numeric,
  net_cost_bil numeric,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v2/accounting/od/statement_net_cost',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stmt_fiscal_year, restmt_flag, agency_nm, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.frusg_balance_sheet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  stmt_fiscal_year integer NOT NULL,
  restmt_flag text NOT NULL CHECK (restmt_flag IN ('Y', 'N')),
  account_desc text NOT NULL,
  line_item_desc text NOT NULL,
  position_bil numeric,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v2/accounting/od/balance_sheets',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stmt_fiscal_year, restmt_flag, account_desc, line_item_desc, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.frusg_net_position (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  stmt_fiscal_year integer NOT NULL,
  restmt_flag text NOT NULL CHECK (restmt_flag IN ('Y', 'N')),
  account_desc text NOT NULL,
  line_item_desc text NOT NULL,
  non_dedicated_funds_bil numeric,
  dedicated_funds_bil numeric,
  eliminations_bil numeric,
  consolidated_bil numeric,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v1/accounting/od/net_position',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stmt_fiscal_year, restmt_flag, account_desc, line_item_desc, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.frusg_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  stmt_fiscal_year integer NOT NULL,
  restmt_flag text NOT NULL CHECK (restmt_flag IN ('Y', 'N')),
  account_desc text NOT NULL,
  component_desc text,
  line_item_desc text NOT NULL,
  position_bil numeric,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v1/accounting/od/reconciliations',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stmt_fiscal_year, restmt_flag, account_desc, line_item_desc, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.frusg_cash_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  stmt_fiscal_year integer NOT NULL,
  restmt_flag text NOT NULL CHECK (restmt_flag IN ('Y', 'N')),
  account_desc text NOT NULL,
  component_desc text,
  line_item_desc text NOT NULL,
  position_bil numeric,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v1/accounting/od/cash_balance',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stmt_fiscal_year, restmt_flag, account_desc, line_item_desc, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.mts_agency_outlays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  classification_id text NOT NULL,
  parent_id text,
  classification_desc text NOT NULL,
  current_month_net_outly numeric,
  current_fytd_net_outly numeric,
  prior_fytd_net_outly numeric,
  data_type_cd text,
  record_type_cd text,
  sequence_level_nbr text,
  line_code_nbr text,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v1/accounting/mts/mts_table_5',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (record_date, classification_id, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.treasury_receipts_by_dept (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  receipt_line_item_nm text NOT NULL,
  aid_cd text NOT NULL,
  a_cd text,
  main_cd text NOT NULL,
  sub_cd text NOT NULL,
  receipt_amt numeric,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v1/accounting/od/receipts_by_department',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (record_date, aid_cd, main_cd, sub_cd, receipt_line_item_nm, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.agency_code_map (
  aid_cd text PRIMARY KEY,
  agency_name text NOT NULL,
  notes text
);

-- Seed major AID codes (OMB A-11 Appendix C subset; extend as needed)
INSERT INTO public.agency_code_map (aid_cd, agency_name) VALUES
  ('000', 'Government-wide / Unassigned'),
  ('005', 'Government Accountability Office'),
  ('010', 'The Judiciary'),
  ('011', 'Executive Office of the President'),
  ('012', 'Department of Agriculture'),
  ('013', 'Department of Commerce'),
  ('014', 'Department of the Interior'),
  ('015', 'Department of Justice'),
  ('016', 'Department of Labor'),
  ('017', 'Department of the Navy'),
  ('019', 'Department of State'),
  ('020', 'Department of the Treasury'),
  ('021', 'Department of the Army'),
  ('024', 'Office of Personnel Management'),
  ('025', 'National Credit Union Administration'),
  ('028', 'Social Security Administration'),
  ('029', 'Federal Trade Commission'),
  ('031', 'Nuclear Regulatory Commission'),
  ('033', 'Smithsonian Institution'),
  ('036', 'Department of Veterans Affairs'),
  ('047', 'General Services Administration'),
  ('049', 'National Science Foundation'),
  ('050', 'Securities and Exchange Commission'),
  ('051', 'Federal Deposit Insurance Corporation'),
  ('057', 'Department of the Air Force'),
  ('068', 'Environmental Protection Agency'),
  ('069', 'Department of Transportation'),
  ('070', 'Department of Homeland Security'),
  ('072', 'Agency for International Development'),
  ('073', 'Small Business Administration'),
  ('075', 'Department of Health and Human Services'),
  ('080', 'National Aeronautics and Space Administration'),
  ('086', 'Department of Housing and Urban Development'),
  ('089', 'Department of Energy'),
  ('091', 'Department of Education'),
  ('097', 'Department of Defense (Military Programs)')
ON CONFLICT (aid_cd) DO UPDATE SET agency_name = EXCLUDED.agency_name;

-- RLS helper: enable + public read + service write for each table
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'frusg_net_cost','frusg_balance_sheet','frusg_net_position',
    'frusg_reconciliations','frusg_cash_balance','mts_agency_outlays',
    'treasury_receipts_by_dept','agency_code_map'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Allow public read access on '||t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO public USING (true)',
      'Allow public read access on '||t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Allow service role full access on '||t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      'Allow service role full access on '||t, t
    );
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_frusg_net_cost_fy ON public.frusg_net_cost (stmt_fiscal_year, restmt_flag);
CREATE INDEX IF NOT EXISTS idx_frusg_bs_fy ON public.frusg_balance_sheet (stmt_fiscal_year, restmt_flag);
CREATE INDEX IF NOT EXISTS idx_mts_outlays_date ON public.mts_agency_outlays (record_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_date_aid ON public.treasury_receipts_by_dept (record_date, aid_cd);

COMMENT ON TABLE public.frusg_net_cost IS 'FRUSG Statement of Net Cost by agency ($B accrual). Source: Fiscal Data statement_net_cost.';
COMMENT ON TABLE public.mts_agency_outlays IS 'MTS Table 5 agency/program net outlays (cash). Source: Fiscal Data mts_table_5.';

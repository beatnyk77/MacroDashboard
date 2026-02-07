-- =====================================================
-- Institutional Lending Dominance Schema
-- =====================================================

-- Table: institutional_loans
-- Tracks stocks (balances) and flows (disbursements) from Western vs Eastern institutions
CREATE TABLE IF NOT EXISTS institutional_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id TEXT NOT NULL, -- e.g., 'IMF', 'WORLD_BANK', 'NDB', 'JICA'
  lender_bloc TEXT NOT NULL CHECK (lender_bloc IN ('WEST', 'EAST')),
  recipient_region TEXT NOT NULL, -- e.g., 'Africa', 'SE_Asia', 'Latin_America'
  recipient_income_bracket TEXT NOT NULL CHECK (recipient_income_bracket IN ('Low', 'Lower_Middle', 'Upper_Middle', 'High')),
  loan_type TEXT NOT NULL CHECK (loan_type IN ('Stock', 'Flow')),
  amount_usd NUMERIC NOT NULL,
  as_of_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lender_id, recipient_region, recipient_income_bracket, loan_type, as_of_date)
);

COMMENT ON TABLE institutional_loans IS 'Tracks institutional lending by regional and income blocks to reveal power dynamics.';

-- View: vw_institutional_dominance
-- Aggregates data for the "Money Wars" dashboard
CREATE OR REPLACE VIEW vw_institutional_dominance AS
WITH bloc_aggregates AS (
  SELECT
    recipient_region,
    recipient_income_bracket,
    loan_type,
    as_of_date,
    SUM(CASE WHEN lender_bloc = 'WEST' THEN amount_usd ELSE 0 END) as west_total,
    SUM(CASE WHEN lender_bloc = 'EAST' THEN amount_usd ELSE 0 END) as east_total
  FROM institutional_loans
  GROUP BY 1, 2, 3, 4
)
SELECT
  *,
  (west_total + east_total) as total_volume,
  CASE 
    WHEN (west_total + east_total) = 0 THEN 0
    ELSE (east_total / (west_total + east_total)) * 100 
  END as east_dominance_pct,
  CASE 
    WHEN (west_total + east_total) = 0 THEN 'NEUTRAL'
    WHEN (west_total / (west_total + east_total)) > 0.6 THEN 'WEST_DOMINANT'
    WHEN (east_total / (west_total + east_total)) > 0.6 THEN 'EAST_DOMINANT'
    ELSE 'CONTESTED'
  END as dominance_status
FROM bloc_aggregates;

-- Seed initial proxy data for 2024-2025 to show the "Money Wars" signal
INSERT INTO institutional_loans (lender_id, lender_bloc, recipient_region, recipient_income_bracket, loan_type, amount_usd, as_of_date) VALUES
-- Africa (East gaining ground in Low/Middle income)
('WORLD_BANK', 'WEST', 'Africa', 'Low', 'Stock', 45000000000, '2025-12-31'),
('CN_POLICY_BANKS', 'EAST', 'Africa', 'Low', 'Stock', 62000000000, '2025-12-31'),
('IMF', 'WEST', 'Africa', 'Low', 'Flow', 5200000000, '2025-12-31'),
('NDB', 'EAST', 'Africa', 'Low', 'Flow', 4800000000, '2025-12-31'),

-- SE Asia (Contested/East Dominant flow)
('ADB', 'WEST', 'SE_Asia', 'Lower_Middle', 'Stock', 38000000000, '2025-12-31'),
('CN_POLICY_BANKS', 'EAST', 'SE_Asia', 'Lower_Middle', 'Stock', 41000000000, '2025-12-31'),
('JICA', 'EAST', 'SE_Asia', 'Lower_Middle', 'Flow', 2100000000, '2025-12-31'),
('WB', 'WEST', 'SE_Asia', 'Lower_Middle', 'Flow', 1800000000, '2025-12-31'),

-- Latin America (West still dominant but East velocity high)
('IMF', 'WEST', 'Latin_America', 'Upper_Middle', 'Stock', 85000000000, '2025-12-31'),
('CN_POLICY_BANKS', 'EAST', 'Latin_America', 'Upper_Middle', 'Stock', 22000000000, '2025-12-31'),
('WB', 'WEST', 'Latin_America', 'Upper_Middle', 'Flow', 3200000000, '2025-12-31'),
('NDB', 'EAST', 'Latin_America', 'Upper_Middle', 'Flow', 4500000000, '2025-12-31')
ON CONFLICT DO NOTHING;

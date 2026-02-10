-- Migration: Add JAPAN bloc to institutional_loans and update ternary dominance view

-- 1. Drop the old view that depends on the constraint
DROP VIEW IF EXISTS vw_institutional_dominance;

-- 2. Update the check constraint to include 'JAPAN'
ALTER TABLE institutional_loans DROP CONSTRAINT IF EXISTS institutional_loans_lender_bloc_check;
ALTER TABLE institutional_loans ADD CONSTRAINT institutional_loans_lender_bloc_check 
CHECK (lender_bloc IN ('WEST', 'EAST', 'JAPAN'));

-- 3. Recreate the view with ternary aggregation
CREATE OR REPLACE VIEW vw_institutional_dominance AS
WITH bloc_aggregates AS (
  SELECT
    recipient_region,
    recipient_income_bracket,
    loan_type,
    as_of_date,
    SUM(CASE WHEN lender_bloc = 'WEST' THEN amount_usd ELSE 0 END) as west_total,
    SUM(CASE WHEN lender_bloc = 'EAST' THEN amount_usd ELSE 0 END) as east_total,
    SUM(CASE WHEN lender_bloc = 'JAPAN' THEN amount_usd ELSE 0 END) as japan_total
  FROM institutional_loans
  GROUP BY 1, 2, 3, 4
)
SELECT
  *,
  (west_total + east_total + japan_total) as total_volume,
  CASE 
    WHEN (west_total + east_total + japan_total) = 0 THEN 0
    ELSE (east_total / (west_total + east_total + japan_total)) * 100 
  END as east_dominance_pct,
  CASE 
    WHEN (west_total + east_total + japan_total) = 0 THEN 0
    ELSE (japan_total / (west_total + east_total + japan_total)) * 100 
  END as japan_dominance_pct,
  CASE 
    WHEN (west_total + east_total + japan_total) = 0 THEN 'NEUTRAL'
    WHEN west_total >= east_total AND west_total >= japan_total AND west_total > 0 THEN 'WEST_DOMINANT'
    WHEN east_total >= west_total AND east_total >= japan_total AND east_total > 0 THEN 'EAST_DOMINANT'
    WHEN japan_total >= west_total AND japan_total >= east_total AND japan_total > 0 THEN 'JAPAN_DOMINANT'
    ELSE 'CONTESTED'
  END as dominance_status
FROM bloc_aggregates;

-- 4. Correct JICA classification in existing data
UPDATE institutional_loans 
SET lender_bloc = 'JAPAN' 
WHERE lender_id = 'JICA';

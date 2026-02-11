-- =====================================================
-- Seed India Institutional Loan Data for ASI Correlation
-- =====================================================

-- We are adding 'India' as a distinct region to support the ASI x Spheres correlation.
-- West: World Bank, ADB, JICA (treated as West-aligned for this model due to democratic values/Quad)
-- East: AIIB, NDB (BRICS Bank)

INSERT INTO institutional_loans (lender_id, lender_bloc, recipient_region, recipient_income_bracket, loan_type, amount_usd, as_of_date) VALUES
-- WEST / QUAD ALIGNED
('WORLD_BANK', 'WEST', 'India', 'Lower_Middle', 'Stock', 28000000000, '2025-12-31'),
('ADB', 'WEST', 'India', 'Lower_Middle', 'Stock', 18000000000, '2025-12-31'),
('JICA', 'WEST', 'India', 'Lower_Middle', 'Stock', 32000000000, '2025-12-31'), -- High speed rail etc.

-- EAST / BRICS ALIGNED
('AIIB', 'EAST', 'India', 'Lower_Middle', 'Stock', 9000000000, '2025-12-31'),
('NDB', 'EAST', 'India', 'Lower_Middle', 'Stock', 7500000000, '2025-12-31')

ON CONFLICT (lender_id, recipient_region, recipient_income_bracket, loan_type, as_of_date) 
DO UPDATE SET amount_usd = EXCLUDED.amount_usd;

-- =====================================================
-- Migration: Smart Money Collective View
-- Created: 2026-03-31
-- Purpose: Aggregate institutional 13-F data for collective signals
-- =====================================================

-- =====================================================
-- Migration: Smart Money Collective View
-- Created: 2026-03-31
-- Purpose: Aggregate institutional 13-F data for collective signals
-- =====================================================

-- Create or replace view for collective smart money signals
CREATE OR REPLACE VIEW vw_smart_money_collective AS
WITH latest_holdings AS (
    SELECT DISTINCT ON (cik) *
    FROM institutional_13f_holdings
    WHERE asset_class_allocation IS NOT NULL
    ORDER BY cik, as_of_date DESC
)
SELECT
    MAX(as_of_date) as as_of_date,
    SUM(total_aum) as total_aum,
    AVG((asset_class_allocation->>'equity_pct')::NUMERIC) as avg_equity,
    AVG((asset_class_allocation->>'bond_pct')::NUMERIC) as avg_bond,
    AVG((asset_class_allocation->>'gold_pct')::NUMERIC) as avg_gold,
    AVG((asset_class_allocation->>'other_pct')::NUMERIC) as avg_other,
    AVG(regime_z_score) as avg_regime_z,
    AVG(CASE WHEN concentration_score IS NOT NULL THEN concentration_score END) as avg_concentration,
    COUNT(*) as institution_count,
    -- Determine collective risk signal based on average equity allocation
    CASE
        WHEN AVG((asset_class_allocation->>'equity_pct')::NUMERIC) > 65 THEN 'RISK_ON'
        WHEN AVG((asset_class_allocation->>'equity_pct')::NUMERIC) < 40 THEN 'RISK_OFF'
        ELSE 'NEUTRAL'
    END as risk_signal,
    -- Regime label based on average z-score
    CASE
        WHEN AVG(regime_z_score) > 0.5 THEN 'BULLISH'
        WHEN AVG(regime_z_score) < -0.5 THEN 'BEARISH'
        ELSE 'NEUTRAL'
    END as regime_label
FROM latest_holdings
WHERE total_aum > 0;

-- Add comment
COMMENT ON VIEW vw_smart_money_collective IS 'Aggregated smart money signals across all tracked institutions with AUM-weighted allocations and regime detection';
COMMENT ON COLUMN vw_smart_money_collective.total_aum IS 'Total AUM monitored (sum of all institutions)';
COMMENT ON COLUMN vw_smart_money_collective.avg_equity IS 'Average equity allocation (%) across institutions';
COMMENT ON COLUMN vw_smart_money_collective.risk_signal IS 'Collective risk posture: RISK_ON, RISK_OFF, NEUTRAL';
COMMENT ON COLUMN vw_smart_money_collective.regime_label IS 'Regime classification based on z-score: BULLISH/BEARISH/NEUTRAL';
COMMENT ON COLUMN vw_smart_money_collective.equity_z_score IS 'Z-score of equity allocation vs historical average';

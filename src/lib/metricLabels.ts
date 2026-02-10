/**
 * Metric Label Mapping Utility
 * 
 * Provides human-readable labels for internal metric IDs used in the Macro Regime Dashboard.
 * Each label includes proper units and context for better user experience.
 */

const METRIC_LABELS: Record<string, string> = {
    // Capital Flows
    'CAPITAL_FROM_TREASURIES_BN': 'Capital from Treasuries (bn USD)',
    'CAPITAL_FROM_EM_DEBT_BN': 'Capital from EM Debt (bn USD)',
    'CAPITAL_FROM_GOLD_ETF_BN': 'Capital from Gold ETFs (bn USD)',
    'CAPITAL_FROM_EQUITY_ETF_BN': 'Capital from Equity ETFs (bn USD)',
    'FLOW_TO_RISK_ASSETS': 'Flow to Risk Assets',
    'FLOW_TO_SAFE_HAVENS': 'Flow to Safe Havens',

    // Inflation Regime
    'INFLATION_HEADLINE_YOY': 'Headline Inflation (YoY %)',
    'INFLATION_CORE_YOY': 'Core Inflation (YoY %)',
    'INFLATION_BREAKEVEN_5Y': '5Y Breakeven Inflation (%)',
    'INFLATION_EXPECTATIONS_UM': 'Inflation Expectations (UM)',
    'INFLATION_REGIME_SCORE': 'Inflation Regime Score',

    // Balance of Payments
    'BOP_CURRENT_ACCOUNT_GDP': 'Current Account (% GDP)',
    'BOP_RESERVES_MONTHS': 'Reserves (months)',
    'BOP_SHORT_TERM_DEBT_GDP': 'Short-Term Debt (% GDP)',
    'BOP_VULNERABILITY_SCORE': 'BOP Vulnerability Score',

    // Housing Cycle
    'HOUSING_PRICE_INDEX': 'Housing Price Index',
    'HOUSING_MEDIAN_INCOME_RATIO': 'Price-to-Income Ratio',
    'HOUSING_MORTGAGE_RATE_30Y': '30Y Mortgage Rate (%)',
    'HOUSING_REGIME_SCORE': 'Housing Regime Score',

    // Activity Regime
    'PMI_US_MFG': 'US Manufacturing PMI',
    'PMI_US_SERVICES': 'US Services PMI',
    'PMI_EA_COMPOSITE_PROXY': 'EA Composite PMI',
    'ACTIVITY_REGIME_SCORE': 'Activity Regime Score',

    // Labor Market
    'LABOR_VACANCIES_JOLTS': 'Job Vacancies (JOLTS)',
    'LABOR_UNEMPLOYMENT_RATE': 'Unemployment Rate (%)',
    'LABOR_WAGE_GROWTH_YOY': 'Wage Growth (YoY %)',
    'LABOR_TIGHTNESS_SCORE': 'Labor Tightness Score',
};

/**
 * Get human-readable label for a metric ID
 * @param metricId - Internal metric identifier
 * @returns Human-readable label with units, or the original ID if not found
 */
export function getMetricLabel(metricId: string): string {
    return METRIC_LABELS[metricId] || metricId;
}

/**
 * Check if a metric ID has a defined label
 * @param metricId - Internal metric identifier
 * @returns True if label exists
 */
export function hasMetricLabel(metricId: string): boolean {
    return metricId in METRIC_LABELS;
}

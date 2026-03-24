/**
 * Metric Risk Interpretation Configuration
 * 
 * Defines how to interpret directional changes for each metric in the metric risk interpretation.
 * - riskOnDirection: 'up' means higher values = risk-on (green), 'down' means lower values = risk-on (green)
 * - displayUnit: unit to show in delta display
 * - deltaDecimals: decimal places for delta formatting
 */

export interface MetricRiskConfig {
    riskOnDirection: 'up' | 'down';
    displayUnit: string;
    deltaDecimals: number;
}

export const METRIC_RISK_CONFIG: Record<string, MetricRiskConfig> = {
    // Yields & Rates - Higher = Tighter = Risk-Off
    'UST_10Y_YIELD': {
        riskOnDirection: 'down', // Lower yields = easing = risk-on
        displayUnit: 'bps',
        deltaDecimals: 1,
    },
    'UST_10Y_2Y_SPREAD': {
        riskOnDirection: 'up', // Steeper curve = risk-on
        displayUnit: 'bps',
        deltaDecimals: 1,
    },
    'SOFR_RATE': {
        riskOnDirection: 'down', // Lower SOFR = easing = risk-on
        displayUnit: 'bps',
        deltaDecimals: 1,
    },

    // Dollar - Higher = Risk-Off (flight to safety)
    'DXY_INDEX': {
        riskOnDirection: 'down', // Weaker dollar = risk-on
        displayUnit: '',
        deltaDecimals: 2,
    },

    // Commodities - Higher = Risk-On (growth/inflation expectations)
    'GOLD_PRICE_USD': {
        riskOnDirection: 'up', // Higher gold = safe haven demand (but also inflation hedge)
        displayUnit: '%',
        deltaDecimals: 1,
    },
    'SILVER_PRICE_USD': {
        riskOnDirection: 'up', // Higher silver = industrial demand = risk-on
        displayUnit: '%',
        deltaDecimals: 1,
    },
    'WTI_CRUDE_PRICE': {
        riskOnDirection: 'up', // Higher oil = growth expectations = risk-on
        displayUnit: '%',
        deltaDecimals: 1,
    },

    // Crypto - Higher = Risk-On
    'BITCOIN_PRICE_USD': {
        riskOnDirection: 'up', // Higher BTC = risk appetite
        displayUnit: '%',
        deltaDecimals: 1,
    },

    // Volatility - Higher = Risk-Off
    'VIX_INDEX': {
        riskOnDirection: 'down', // Lower VIX = calm markets = risk-on
        displayUnit: '',
        deltaDecimals: 1,
    },
    'US_401K_DISTRESS_Z': {
        riskOnDirection: 'down', // Lower distress = consumer health = risk-on
        displayUnit: '',
        deltaDecimals: 1,
    },
};

/**
 * Get risk interpretation for a metric based on its delta
 * @param metricId - Metric identifier
 * @param delta - Week-over-week change
 * @returns 'risk-on' | 'risk-off' | 'neutral'
 */
export function getRiskInterpretation(
    metricId: string,
    delta: number | null | undefined
): 'risk-on' | 'risk-off' | 'neutral' {
    if (delta === null || delta === undefined || delta === 0) {
        return 'neutral';
    }

    const config = METRIC_RISK_CONFIG[metricId];
    if (!config) {
        return 'neutral';
    }

    const isUp = delta > 0;
    const isRiskOn = (config.riskOnDirection === 'up' && isUp) ||
        (config.riskOnDirection === 'down' && !isUp);

    return isRiskOn ? 'risk-on' : 'risk-off';
}

/**
 * Get display configuration for a metric
 * @param metricId - Metric identifier
 * @returns MetricRiskConfig or default config
 */
export function getMetricConfig(metricId: string): MetricRiskConfig {
    return METRIC_RISK_CONFIG[metricId] || {
        riskOnDirection: 'up',
        displayUnit: '',
        deltaDecimals: 1,
    };
}

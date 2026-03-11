/**
 * GraphiQuestor 2.0: Sovereign Solvency & Monetary Optionality Logic
 * Derived metrics for institutional-grade macro surveillance.
 */

export interface SolvencyInputs {
    m2: number;
    gold_price: number;
    fx_reserves: number;
    gold_reserves_ounces: number;
    short_term_debt: number;
    gva_nominal: number;
}

export interface SolvencyMetrics {
    debt_gold_ratio: number;           // Standardized debasement pressure
    monetary_optionality_index: number; // Ability to defend currency / pivot
    real_gva_gold: number;              // Economic output in "hard" terms
}

/**
 * Calculates derived institutional metrics.
 */
export function calculateSolvencyMetrics(inputs: SolvencyInputs): SolvencyMetrics {
    const { 
        m2, 
        gold_price, 
        fx_reserves, 
        gold_reserves_ounces, 
        short_term_debt, 
        gva_nominal 
    } = inputs;

    // 1. Total Hard/Liquid Reserves (FX + Gold at market value)
    const gold_reserves_value = gold_reserves_ounces * gold_price;
    const total_liquid_reserves = fx_reserves + gold_reserves_value;

    // 2. Monetary Optionality Index
    // (Total Reserves) / (Short Term Claims + M2 Expansion Pressure)
    // Values > 1.0 indicate high resilience. Values < 0.2 indicate extreme debasement risk.
    const optionality = total_liquid_reserves / (short_term_debt + (m2 * 0.1));

    // 3. Debt to Gold Ratio (Standardized)
    // We use M2 as a proxy for total circulating claims relative to the gold anchor.
    const debt_gold = m2 / gold_price;

    // 4. Real GVA in hard terms
    const real_gva = gva_nominal / gold_price;

    return {
        debt_gold_ratio: debt_gold,
        monetary_optionality_index: optionality,
        real_gva_gold: real_gva
    };
}

/**
 * Normalizes metrics into Z-Scores using provided window stats.
 * Institutional users prioritize 25-year structural z-scores.
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
}


/**
 * Deterministic regime classification logic.
 * 
 * Rules:
 * - If M2/Gold z-score > 1.5 AND SOFR spread > 15bps -> "Tightening Risk"
 * - If M2/Gold z-score < -1.5 -> "Liquidity Expansion"
 * - Else -> "Neutral / Mixed"
 * 
 * @param m2ZScore - Z-score of Money Supply (M2) relative to trend/gold
 * @param sofrSpread - Spread in basis points (e.g., SOFR - Fed Funds)
 * @returns Regime label string
 */
export const determineRegime = (m2ZScore: number, sofrSpread: number): string => {
    if (m2ZScore > 1.5 && sofrSpread > 15) {
        return "Tightening Risk";
    }
    if (m2ZScore < -1.5) {
        return "Liquidity Expansion";
    }
    return "Neutral / Mixed";
};

/**
 * Helper to get regime color for UI badges
 */
export const getRegimeColor = (regime: string): 'error' | 'success' | 'warning' | 'info' | 'default' => {
    switch (regime) {
        case "Tightening Risk":
            return "error"; // Red
        case "Liquidity Expansion":
            return "success"; // Green
        case "Neutral / Mixed":
        default:
            return "info"; // Blue/Neutral
    }
};

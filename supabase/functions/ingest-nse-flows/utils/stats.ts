/**
 * Computes Z-score for a value given a mean and standard deviation.
 * Z = (Value - Mean) / StdDev
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number | null {
    if (stdDev === 0) return null
    return (value - mean) / stdDev
}

/**
 * Basic incremental statistics update or simple window calculation.
 * For this MVP, we might just assume we fetch recent history to compute stats 
 * or rely on a DB view. 
 * 
 * If we want to compute it in ingestion, we need historical context.
 * A simpler approach for "in ingestion" is to just return the raw value 
 * and let a DB Trigger or periodic SQL job update the z-scores 
 * based on the full moving window.
 * 
 * However, if we MUST do it here, we'd need to fetch history.
 * 
 * For now, we will provide the math utility.
 */
export function computeStats(values: number[]): { mean: number; stdDev: number } | null {
    if (values.length < 2) return null

    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1) // Sample std dev
    const stdDev = Math.sqrt(variance)

    return { mean, stdDev }
}

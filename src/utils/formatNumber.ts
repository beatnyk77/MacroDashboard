/**
 * Number Formatting Utilities for MacroDashboard
 * Provides consistent, institutional-grade number formatting across all components
 */

export interface FormatOptions {
    notation?: 'compact' | 'standard' | 'engineering';
    prefix?: string;
    suffix?: string;
    decimals?: number;
    largeNumberUnit?: 'B' | 'T' | 'M' | 'auto';
    showSign?: boolean; // Show + for positive numbers
}

/**
 * Main number formatting function with smart defaults
 * @param value - Number to format (null/undefined returns '—')
 * @param options - Formatting options
 * @returns Formatted string
 * 
 * @example
 * formatNumber(1234567890) // "1.23B"
 * formatNumber(1234567890, { prefix: '$', decimals: 2 }) // "$1.23B"
 * formatNumber(0.0567, { suffix: '%', decimals: 2 }) // "0.06%"
 */
export const formatNumber = (
    value: number | null | undefined,
    options?: FormatOptions
): string => {
    if (value === null || value === undefined || isNaN(value)) {
        return '—';
    }

    const {
        notation = 'compact',
        prefix = '',
        suffix = '',
        decimals = 2,
        showSign = false
    } = options || {};

    const sign = showSign && value > 0 ? '+' : '';

    // Compact notation for large numbers
    if (notation === 'compact' && Math.abs(value) >= 1e6) {
        if (Math.abs(value) >= 1e12) {
            return `${sign}${prefix}${(value / 1e12).toFixed(decimals)}T${suffix}`;
        }
        if (Math.abs(value) >= 1e9) {
            return `${sign}${prefix}${(value / 1e9).toFixed(decimals)}B${suffix}`;
        }
        if (Math.abs(value) >= 1e6) {
            return `${sign}${prefix}${(value / 1e6).toFixed(decimals)}M${suffix}`;
        }
    }

    // Standard notation with commas
    const formatted = value.toLocaleString(undefined, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals
    });

    return `${sign}${prefix}${formatted}${suffix}`;
};

/**
 * Currency formatting (defaults to USD)
 * @example
 * formatCurrency(1234567890) // "$1.23B"
 * formatCurrency(1234.56) // "$1,234.56"
 */
export const formatCurrency = (
    value: number | null | undefined,
    options?: Omit<FormatOptions, 'prefix'>
): string => {
    return formatNumber(value, { ...options, prefix: '$' });
};

/**
 * Percentage formatting
 * @example
 * formatPercentage(0.0567) // "5.67%"
 * formatPercentage(2.345, { decimals: 1 }) // "2.3%"
 */
export const formatPercentage = (
    value: number | null | undefined,
    options?: Omit<FormatOptions, 'suffix'>
): string => {
    if (value === null || value === undefined || isNaN(value)) {
        return '—';
    }
    return formatNumber(value, { ...options, suffix: '%' });
};

/**
 * Compact number formatting (forces compact notation)
 * @example
 * formatCompact(1234567890) // "1.23B"
 * formatCompact(1234567890, { largeNumberUnit: 'T' }) // "1.23B"
 */
export const formatCompact = (
    value: number | null | undefined,
    options?: Omit<FormatOptions, 'notation'>
): string => {
    return formatNumber(value, { ...options, notation: 'compact' });
};

/**
 * Delta/change formatting with sign and color hint
 * @example
 * formatDelta(2.34) // "+2.34"
 * formatDelta(-1.23, { decimals: 1 }) // "-1.2"
 */
export const formatDelta = (
    value: number | null | undefined,
    options?: FormatOptions
): string => {
    return formatNumber(value, { ...options, showSign: true });
};

/**
 * Billion-specific formatting (for treasury holdings)
 * @example
 * formatBillions(5714) // "5,714B"
 * formatBillions(5714.234, { decimals: 1 }) // "5,714.2B"
 */
export const formatBillions = (
    value: number | null | undefined,
    options?: Omit<FormatOptions, 'suffix' | 'notation'>
): string => {
    return formatNumber(value, { ...options, suffix: 'B', notation: 'standard' });
};

/**
 * Trillion-specific formatting
 * @example
 * formatTrillions(1.234) // "1.23T"
 */
export const formatTrillions = (
    value: number | null | undefined,
    options?: Omit<FormatOptions, 'suffix' | 'notation'>
): string => {
    return formatNumber(value, { ...options, suffix: 'T', notation: 'standard' });
};

/**
 * Per-metric scale configuration for values whose raw storage unit doesn't
 * match a generic 1e3/1e6/1e9/1e12 heuristic. Add an entry here — with a
 * verified divisor and a plausible historical range — before displaying a
 * new metric through formatScaledMetric.
 */
export interface ScaledMetricConfig {
    /** Raw value is divided by this to reach the display unit. */
    divisor: number;
    /** Unit suffix appended after scaling (e.g. 'T', 'B'). */
    suffix: string;
    /** Plausible historical range for the *scaled* value: [min, max]. */
    sanityRange: [number, number];
}

export const SNAPSHOT_METRIC_SCALES: Record<string, ScaledMetricConfig> = {
    // Raw value from FRED WALCL, stored in millions of USD.
    FED_BALANCE_SHEET: { divisor: 1e6, suffix: 'T', sanityRange: [1, 15] },
    // Raw value from FRED WTREGEN, stored in millions of USD despite the
    // "_BN" suffix in the metric id — see ingest-nyfed-markets/index.ts.
    TGA_BALANCE_BN: { divisor: 1e3, suffix: 'B', sanityRange: [50, 2000] },
};

/**
 * Format a raw metric value using its configured scale/suffix.
 * Returns null when the metric has no entry in SNAPSHOT_METRIC_SCALES so
 * callers can fall back to their own logic. Never throws — logs a warning
 * if the scaled value falls outside its plausible historical range, since
 * this runs on the render path and a bad data point shouldn't crash the UI.
 */
export const formatScaledMetric = (metricId: string, rawValue: number): string | null => {
    const config = SNAPSHOT_METRIC_SCALES[metricId];
    if (!config) return null;

    const scaled = rawValue / config.divisor;
    const [min, max] = config.sanityRange;
    if (scaled < min || scaled > max) {
        console.warn(
            `formatScaledMetric: ${metricId} resolved to ${scaled.toFixed(2)}${config.suffix}, outside plausible range [${min}, ${max}]${config.suffix}. Raw value: ${rawValue}.`
        );
    }

    return `${scaled.toFixed(2)}${config.suffix}`;
};

/**
 * Strict sanity-range check for CI/tests: throws if the metric is unmapped
 * or if its scaled value falls outside the configured plausible range.
 * Not called from render paths — use formatScaledMetric there instead.
 */
export const assertMetricSanityRange = (metricId: string, rawValue: number): void => {
    const config = SNAPSHOT_METRIC_SCALES[metricId];
    if (!config) {
        throw new Error(`assertMetricSanityRange: no scale config for metric "${metricId}"`);
    }

    const scaled = rawValue / config.divisor;
    const [min, max] = config.sanityRange;
    if (scaled < min || scaled > max) {
        throw new Error(
            `${metricId} resolved to ${scaled.toFixed(2)}${config.suffix}, outside plausible range [${min}, ${max}]${config.suffix} (raw value: ${rawValue})`
        );
    }
};

/**
 * Get signal label from numeric status
 * Maps status values to brief labels for traffic-light styling
 */
export const getSignalLabel = (
    status: 'safe' | 'warning' | 'danger' | 'neutral' | string
): string => {
    const labels: Record<string, string> = {
        safe: 'Stable',
        warning: 'Caution',
        danger: 'Alert',
        neutral: 'Normal',
        expansion: 'Expansion',
        tightening: 'Tightening',
        recovery: 'Recovery',
        slowdown: 'Slowdown'
    };

    return labels[status.toLowerCase()] || status;
};

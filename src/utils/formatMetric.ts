export type MetricType = 'trillion' | 'billion' | 'percent' | 'bps' | 'index' | 'ratio' | 'currency' | 'number';

export interface FormatOptions {
    decimals?: number;
    showUnit?: boolean;
    prefix?: string;
}

/**
 * Format a metric value with consistent styling
 * Handles null/undefined gracefully with em dash
 * Provides breathing room with proper spacing between number and unit
 */
export const formatMetric = (
    value: number | null | undefined,
    type: MetricType,
    options: FormatOptions = {}
): string => {
    if (value == null || isNaN(value)) return '—';

    const {
        decimals = getDefaultDecimals(type),
        showUnit = true,
        prefix = ''
    } = options;

    const formatted = value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    const unit = showUnit ? getUnit(type) : '';
    const space = unit ? ' ' : '';

    return `${prefix}${formatted}${space}${unit}`;
};

/**
 * Get default decimal places based on metric type
 * Financial metrics (trillion/billion) use 2 decimals
 * Percentages and bps use 2 and 1 respectively for precision
 */
const getDefaultDecimals = (type: MetricType): number => {
    switch (type) {
        case 'trillion':
        case 'billion':
            return 2;
        case 'percent':
            return 2;
        case 'bps':
            return 1;
        case 'index':
        case 'ratio':
            return 2;
        case 'currency':
            return 2;
        default:
            return 2;
    }
};

/**
 * Get unit label for metric type
 */
const getUnit = (type: MetricType): string => {
    switch (type) {
        case 'trillion': return 'T';
        case 'billion': return 'B';
        case 'percent': return '%';
        case 'bps': return 'bps';
        default: return '';
    }
};

/**
 * Format delta (change) values
 * Returns null for zero/insignificant changes to reduce visual noise
 * Uses arrows for directional clarity
 */
export const formatDelta = (
    delta: number | null | undefined,
    options: { threshold?: number; unit?: string; decimals?: number } = {}
): string | null => {
    const { threshold = 0.01, unit = '', decimals = 2 } = options;

    if (delta == null || Math.abs(delta) < threshold) return null;

    const sign = delta > 0 ? '↗' : '↘';
    const formatted = Math.abs(delta).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    const space = unit ? ' ' : '';
    return `${sign} ${formatted}${space}${unit}`;
};

/**
 * Format large numbers in compact form (5.2T, 1.3B, etc.)
 * Useful for space-constrained displays
 */
export const formatCompact = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return '—';

    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (abs >= 1e12) {
        return `${sign}${(abs / 1e12).toFixed(2)} T`;
    } else if (abs >= 1e9) {
        return `${sign}${(abs / 1e9).toFixed(2)} B`;
    } else if (abs >= 1e6) {
        return `${sign}${(abs / 1e6).toFixed(2)} M`;
    }

    return `${sign}${abs.toFixed(2)}`;
};

import type { MonthlyRatePoint } from '../lib/invoicingTypes';

/**
 * Fallback monthly cross-rates when live FRED-derived telemetry is unavailable.
 * Source convention: USD/INR ÷ USD/CNY. Verify against RBI/FRED for execution.
 */
export const ILLUSTRATIVE_INVOICING_RATES: MonthlyRatePoint[] = [
    { month: '2024-06', usdInr: 83.41, cnyInr: 11.48 },
    { month: '2024-07', usdInr: 83.72, cnyInr: 11.58 },
    { month: '2024-08', usdInr: 83.95, cnyInr: 11.72 },
    { month: '2024-09', usdInr: 84.07, cnyInr: 11.85 },
    { month: '2024-10', usdInr: 84.04, cnyInr: 11.79 },
    { month: '2024-11', usdInr: 84.42, cnyInr: 11.68 },
    { month: '2024-12', usdInr: 85.1, cnyInr: 11.65 },
    { month: '2025-01', usdInr: 86.24, cnyInr: 11.84 },
    { month: '2025-02', usdInr: 87.01, cnyInr: 12.06 },
    { month: '2025-03', usdInr: 86.42, cnyInr: 11.92 },
    { month: '2025-04', usdInr: 84.63, cnyInr: 11.71 },
    { month: '2025-05', usdInr: 84.21, cnyInr: 11.58 },
    { month: '2025-06', usdInr: 84.52, cnyInr: 12.18 },
    { month: '2025-07', usdInr: 84.83, cnyInr: 12.64 },
    { month: '2025-08', usdInr: 84.31, cnyInr: 12.89 },
    { month: '2025-09', usdInr: 84.71, cnyInr: 13.21 },
    { month: '2025-10', usdInr: 85.22, cnyInr: 13.56 },
    { month: '2025-11', usdInr: 85.64, cnyInr: 13.44 },
    { month: '2025-12', usdInr: 85.91, cnyInr: 13.72 },
    { month: '2026-01', usdInr: 85.38, cnyInr: 13.89 },
    { month: '2026-02', usdInr: 84.82, cnyInr: 13.98 },
    { month: '2026-03', usdInr: 84.51, cnyInr: 14.12 },
    { month: '2026-04', usdInr: 84.12, cnyInr: 14.23 },
    { month: '2026-05', usdInr: 84.04, cnyInr: 14.28 },
    { month: '2026-06', usdInr: 84.1, cnyInr: 14.31 },
];
export type IllustrativeRatePoint = {
    date: string;
    spot: number;
    volProxy: number;
};

/** Illustrative USD/INR monthly closes — used when live telemetry is unavailable or invalid. */
export const ILLUSTRATIVE_USD_INR_RATES: IllustrativeRatePoint[] = [
    { date: '2025-01', spot: 86.2, volProxy: 0.8 },
    { date: '2025-02', spot: 86.8, volProxy: 0.9 },
    { date: '2025-03', spot: 85.6, volProxy: 1.1 },
    { date: '2025-04', spot: 84.4, volProxy: 0.7 },
    { date: '2025-05', spot: 84.0, volProxy: 0.6 },
    { date: '2025-06', spot: 84.1, volProxy: 0.6 },
];

export const ILLUSTRATIVE_USD_INR_SPOT =
    ILLUSTRATIVE_USD_INR_RATES[ILLUSTRATIVE_USD_INR_RATES.length - 1].spot;
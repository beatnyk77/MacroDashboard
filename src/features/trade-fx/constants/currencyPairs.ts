import { METRIC_IDS as MID } from '@/constants/metricIds';
import type { CurrencyPair, TimeHorizon } from '../lib/tradeFxTypes';

export type CurrencyPairConfig = {
    pair: CurrencyPair;
    label: string;
    baseCurrency: string;
    quoteCurrency: string;
    metricId: string | null;
    pipValue: number;
    hasLiveTelemetry: boolean;
    dataNote?: string;
};

export const CURRENCY_PAIRS: CurrencyPairConfig[] = [
    {
        pair: 'USD/INR',
        label: 'USD/INR',
        baseCurrency: 'USD',
        quoteCurrency: 'INR',
        metricId: MID.USD_INR_RATE,
        pipValue: 0.01,
        hasLiveTelemetry: true,
    },
    {
        pair: 'EUR/INR',
        label: 'EUR/INR',
        baseCurrency: 'EUR',
        quoteCurrency: 'INR',
        metricId: null,
        pipValue: 0.01,
        hasLiveTelemetry: false,
        dataNote: 'Limited telemetry — USD/INR depth available. EUR cross derived post-MVP.',
    },
    {
        pair: 'CNY/INR',
        label: 'CNY/INR',
        baseCurrency: 'CNY',
        quoteCurrency: 'INR',
        metricId: null,
        pipValue: 0.0001,
        hasLiveTelemetry: false,
        dataNote: 'Limited telemetry — USD/INR depth available. CNY corridor context via De-Dol Lab.',
    },
];

export const TIME_HORIZONS: { id: TimeHorizon; label: string; days: number }[] = [
    { id: '1M', label: '1M', days: 30 },
    { id: '3M', label: '3M', days: 90 },
    { id: '6M', label: '6M', days: 180 },
    { id: '1Y', label: '1Y', days: 365 },
    { id: 'YTD', label: 'YTD', days: 0 },
];

export function getPairConfig(pair: CurrencyPair): CurrencyPairConfig {
    const config = CURRENCY_PAIRS.find((p) => p.pair === pair);
    if (!config) return CURRENCY_PAIRS[0];
    return config;
}

/** Rough forward points estimate (annualised %) by horizon for illustrative payoff diagrams. */
export function estimateForwardRate(spot: number, horizon: TimeHorizon): number {
    const annualisedPremiumPct = 2.5;
    const horizonDays = TIME_HORIZONS.find((h) => h.id === horizon)?.days ?? 90;
    const factor = horizon === 'YTD'
        ? (new Date().getMonth() + 1) / 12
        : horizonDays / 365;
    return spot * (1 + (annualisedPremiumPct / 100) * factor);
}
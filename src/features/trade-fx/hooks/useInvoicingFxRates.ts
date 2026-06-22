import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getStaleness } from '@/hooks/useStaleness';
import type { FreshnessStatus } from '@/components/FreshnessChip';
import { ILLUSTRATIVE_INVOICING_RATES } from '../constants/illustrativeInvoicingRates';
import type { MonthlyRatePoint } from '../lib/invoicingTypes';

type FxMonthlyRow = {
    month: string;
    usd_inr: number;
    usd_cny: number;
    cny_inr: number;
    observation_count: number;
};

export type InvoicingFxRatesResult = {
    monthlyRates: MonthlyRatePoint[];
    isLive: boolean;
    freshness: string;
    staleness: FreshnessStatus;
    isLoading: boolean;
    hasError: boolean;
};

function aggregateDailyToMonthly(
    rows: { date: string; usd_inr?: number; usd_cny?: number }[],
): MonthlyRatePoint[] {
    const buckets = new Map<string, { usd: number[]; cny: number[] }>();

    rows.forEach((row) => {
        const month = row.date.slice(0, 7);
        if (!buckets.has(month)) buckets.set(month, { usd: [], cny: [] });
        const b = buckets.get(month)!;
        if (row.usd_inr != null && row.usd_inr > 0) b.usd.push(row.usd_inr);
        if (row.usd_cny != null && row.usd_cny > 0) b.cny.push(row.usd_cny);
    });

    return Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, b]) => {
            const usdInr = b.usd.reduce((s, v) => s + v, 0) / b.usd.length;
            const usdCny = b.cny.reduce((s, v) => s + v, 0) / b.cny.length;
            return {
                month,
                usdInr,
                cnyInr: usdCny > 0 ? usdInr / usdCny : 0,
            };
        })
        .filter((r) => r.usdInr > 0 && r.cnyInr > 0);
}

async function fetchMonthlyFromView(): Promise<MonthlyRatePoint[]> {
    const { data, error } = await supabase
        .from('vw_fx_monthly_cross_rates')
        .select('month, usd_inr, cny_inr')
        .order('month', { ascending: true })
        .limit(36);

    if (error) throw error;
    if (!data?.length) return [];

    return (data as FxMonthlyRow[]).map((row) => ({
        month: row.month,
        usdInr: Number(row.usd_inr),
        cnyInr: Number(row.cny_inr),
    }));
}

async function fetchMonthlyFromObservations(): Promise<MonthlyRatePoint[]> {
    const { data, error } = await supabase
        .from('metric_observations')
        .select('metric_id, as_of_date, value')
        .in('metric_id', ['USD_INR_RATE', 'USD_CNY_RATE'])
        .order('as_of_date', { ascending: false })
        .limit(4000);

    if (error) throw error;
    if (!data?.length) return [];

    const byDate = new Map<string, { date: string; usd_inr?: number; usd_cny?: number }>();
    data.forEach((row) => {
        const date = String(row.as_of_date);
        if (!byDate.has(date)) byDate.set(date, { date });
        const entry = byDate.get(date)!;
        if (row.metric_id === 'USD_INR_RATE') entry.usd_inr = Number(row.value);
        if (row.metric_id === 'USD_CNY_RATE') entry.usd_cny = Number(row.value);
    });

    return aggregateDailyToMonthly(Array.from(byDate.values()));
}

export function useInvoicingFxRates(): InvoicingFxRatesResult {
    const query = useQuery({
        queryKey: ['invoicing-fx-monthly-rates'],
        queryFn: async () => {
            try {
                const fromView = await fetchMonthlyFromView();
                if (fromView.length >= 12) {
                    return { rates: fromView, isLive: true };
                }
            } catch {
                // fall through to observations
            }

            const fromObs = await fetchMonthlyFromObservations();
            if (fromObs.length >= 12) {
                return { rates: fromObs.slice(-36), isLive: true };
            }

            return { rates: ILLUSTRATIVE_INVOICING_RATES, isLive: false };
        },
        staleTime: 30 * 60 * 1000,
        gcTime: 2 * 60 * 60 * 1000,
    });

    const monthlyRates = query.data?.rates ?? ILLUSTRATIVE_INVOICING_RATES;
    const isLive = query.data?.isLive ?? false;
    const freshness = monthlyRates[monthlyRates.length - 1]?.month
        ? `${monthlyRates[monthlyRates.length - 1].month}-01`
        : new Date().toISOString();

    const staleness = useMemo(
        () => getStaleness(freshness, 'monthly').state,
        [freshness],
    );

    return {
        monthlyRates,
        isLive,
        freshness,
        staleness,
        isLoading: query.isLoading,
        hasError: query.isError,
    };
}
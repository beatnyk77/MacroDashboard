import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLatestOilSpread } from './useOilSpread';

export interface EnergyRegime {
    wtiSpread: number;
    wtiRegime: string;
    brentPrice: number;
    brentChangePct: number;
    refineryUtil: number;
    euGasStorage: number;
    isAnyStale: boolean;
    overallNarrative: string;
    lastUpdated: string | null;
}

export function buildNarrative(regime: string, refineryUtil: number): string {
    if (regime === 'EXTREME' || regime === 'STRESSED') {
        return 'Physical oil markets in acute stress — immediate supply shortage risk. Monitor chokepoint exposure.';
    }
    if (regime === 'TIGHTENING' && refineryUtil > 90) {
        return 'Market tightening with refinery utilization at capacity ceiling — supply-side shock risk elevated.';
    }
    if (regime === 'TIGHTENING') {
        return 'Market tightening — physical buyers front-loading deliveries. Refinery utilization within normal range.';
    }
    if (regime === 'OVERSUPPLY') {
        return 'Oversupply conditions with storage pressure building — watch for OPEC+ response.';
    }
    if (refineryUtil < 80) {
        return 'Refinery slack signals demand weakness or scheduled maintenance cycle — no acute stress.';
    }
    return 'Balanced physical flows with high refinery utilization — monitor for demand-side shocks.';
}

const REGIME_METRICS = [
    'OIL_BRENT_PRICE_USD',
    'OIL_REFINERY_UTILIZATION_US',
    'EU_GAS_STORAGE_PCT',
] as const;

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — weekly ingestion cadence

export const useEnergyRegime = (): EnergyRegime => {
    const { data: spread } = useLatestOilSpread();

    const { data: metrics } = useQuery({
        queryKey: ['energy-regime-metrics', ...REGIME_METRICS],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value')
                .in('metric_id', REGIME_METRICS)
                .order('as_of_date', { ascending: false })
                .limit(30); // 10 rows per metric — safe for both daily and weekly cadences
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 120,
    });

    const byMetric = (id: string) =>
        (metrics ?? []).filter(m => m.metric_id === id);

    const brentRows = byMetric('OIL_BRENT_PRICE_USD');
    const utilRows = byMetric('OIL_REFINERY_UTILIZATION_US');
    const gasRows = byMetric('EU_GAS_STORAGE_PCT');

    const brentPrice = brentRows[0] ? Number(brentRows[0].value) : 0;
    const brentPrev = brentRows[1] ? Number(brentRows[1].value) : brentPrice;
    const brentChangePct = brentPrev > 0
        ? ((brentPrice - brentPrev) / brentPrev) * 100
        : 0;
    const refineryUtil = utilRows[0] ? Number(utilRows[0].value) : 0;
    const euGasStorage = gasRows[0] ? Number(gasRows[0].value) : 0;

    const wtiSpread = spread?.spread ?? 0;
    const wtiRegime = spread?.regime ?? 'NORMAL';

    // Staleness: spread is stale OR any observation metric is older than the weekly threshold
    const oldestObsDate = metrics && metrics.length > 0
        ? new Date(metrics[metrics.length - 1].as_of_date as string).getTime()
        : null;
    const obsIsStale = oldestObsDate !== null
        ? Date.now() - oldestObsDate > STALE_THRESHOLD_MS
        : false;
    const isAnyStale = (spread?.is_stale ?? false) || obsIsStale;

    // lastUpdated: the oldest as_of_date across all metrics (weakest link)
    const lastUpdated = oldestObsDate
        ? new Date(oldestObsDate).toISOString()
        : (spread?.computed_at ?? null);

    return {
        wtiSpread,
        wtiRegime,
        brentPrice,
        brentChangePct,
        refineryUtil,
        euGasStorage,
        isAnyStale,
        overallNarrative: buildNarrative(wtiRegime, refineryUtil),
        lastUpdated,
    };
};

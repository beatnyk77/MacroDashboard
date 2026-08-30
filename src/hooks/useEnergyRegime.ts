import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLatestOilSpread } from './useOilSpread';
import { getStaleness } from './useStaleness';
import { METRIC_IDS as MID } from '@/constants/metricIds';

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
    MID.BRENT_CRUDE_PRICE,
    MID.OIL_REFINERY_UTILIZATION_US,
    MID.EU_GAS_STORAGE_PCT,
] as const;

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

    const brentRows = byMetric(MID.BRENT_CRUDE_PRICE);
    const utilRows = byMetric(MID.OIL_REFINERY_UTILIZATION_US);
    const gasRows = byMetric(MID.EU_GAS_STORAGE_PCT);

    const brentPrice = brentRows[0] ? Number(brentRows[0].value) : 0;
    const brentPrev = brentRows[1] ? Number(brentRows[1].value) : brentPrice;
    const brentChangePct = brentPrev > 0
        ? ((brentPrice - brentPrev) / brentPrev) * 100
        : 0;
    const refineryUtil = utilRows[0] ? Number(utilRows[0].value) : 0;
    const euGasStorage = gasRows[0] ? Number(gasRows[0].value) : 0;

    const wtiSpread = spread?.spread ?? 0;
    const wtiRegime = spread?.regime ?? 'NORMAL';

    // Staleness: check latest observation for each individual metric against its native cadence
    const brentLatest = brentRows[0]?.as_of_date;
    const utilLatest = utilRows[0]?.as_of_date;
    const gasLatest = gasRows[0]?.as_of_date;

    const brentStale = brentLatest ? getStaleness(brentLatest, 'daily').state !== 'fresh' : false;
    const utilStale = utilLatest ? getStaleness(utilLatest, 'weekly').state !== 'fresh' : false;
    const gasStale = gasLatest ? getStaleness(gasLatest, 'monthly').state !== 'fresh' : false;
    const obsIsStale = brentStale || utilStale || gasStale;

    const isAnyStale = (spread?.is_stale ?? false) || obsIsStale;

    // lastUpdated: the most recent price observation or spread compute date
    const latestDate = brentLatest || utilLatest || spread?.date || null;
    const lastUpdated = latestDate
        ? new Date(latestDate).toISOString()
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

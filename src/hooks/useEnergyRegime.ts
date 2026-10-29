import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLatestOilSpread } from './useOilSpread';
import { getStaleness } from './useStaleness';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export interface EnergyRegime {
    /** CL1 − CL2 in USD. null when no spread row exists — never defaulted to 0. */
    wtiSpread: number | null;
    /** null when the spread is missing; the UI must render "insufficient data", not NORMAL. */
    wtiRegime: string | null;
    /** Brent front-month (ICE BZ=F). Not Dated Brent spot. */
    brentPrice: number | null;
    brentChangePct: number | null;
    refineryUtil: number | null;
    euGasStorage: number | null;
    isAnyStale: boolean;
    overallNarrative: string;
    lastUpdated: string | null;
}

export function buildNarrative(regime: string | null, refineryUtil: number | null): string {
    if (regime === null) {
        return 'Insufficient data — the WTI calendar spread is unavailable, so no regime is asserted.';
    }
    if (regime === 'EXTREME' || regime === 'STRESSED') {
        return 'Physical oil markets in acute stress — immediate supply shortage risk. Monitor chokepoint exposure.';
    }
    if (regime === 'TIGHTENING' && refineryUtil !== null && refineryUtil > 90) {
        return 'Market tightening with refinery utilization at capacity ceiling — supply-side shock risk elevated.';
    }
    if (regime === 'TIGHTENING') {
        return 'Market tightening — physical buyers front-loading deliveries.'
            + (refineryUtil === null ? ' Refinery utilization unavailable.' : ' Refinery utilization within normal range.');
    }
    if (regime === 'OVERSUPPLY') {
        return 'Oversupply conditions with storage pressure building — watch for OPEC+ response.';
    }
    if (refineryUtil === null) {
        return 'Curve structure normal. Refinery utilization unavailable.';
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

/** Latest rows per metric, fetched separately so a daily series can never crowd out a monthly one. */
const ROWS_PER_METRIC = 2;

type RegimeRow = { as_of_date: string; value: number | string };

export const useEnergyRegime = (): EnergyRegime => {
    const { data: spread } = useLatestOilSpread();

    const { data: metrics } = useQuery({
        queryKey: ['energy-regime-metrics', ...REGIME_METRICS],
        queryFn: async (): Promise<Record<string, RegimeRow[]>> => {
            const results = await Promise.all(
                REGIME_METRICS.map(async id => {
                    const { data, error } = await supabase
                        .from('metric_observations')
                        .select('as_of_date, value')
                        .eq('metric_id', id)
                        .order('as_of_date', { ascending: false })
                        .limit(ROWS_PER_METRIC);
                    if (error) throw error;
                    return [id, (data ?? []) as RegimeRow[]] as const;
                }),
            );
            return Object.fromEntries(results);
        },
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 120,
    });

    const brentRows = metrics?.[MID.BRENT_CRUDE_PRICE] ?? [];
    const utilRows = metrics?.[MID.OIL_REFINERY_UTILIZATION_US] ?? [];
    const gasRows = metrics?.[MID.EU_GAS_STORAGE_PCT] ?? [];

    const latest = (rows: RegimeRow[]) => (rows[0] ? Number(rows[0].value) : null);

    const brentPrice = latest(brentRows);
    const brentPrev = brentRows[1] ? Number(brentRows[1].value) : null;
    const brentChangePct = brentPrice !== null && brentPrev !== null && brentPrev > 0
        ? ((brentPrice - brentPrev) / brentPrev) * 100
        : null;

    const wtiSpread = spread?.spread ?? null;
    const wtiRegime = spread?.regime ?? null;

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

    const refineryUtil = latest(utilRows);

    return {
        wtiSpread,
        wtiRegime,
        brentPrice,
        brentChangePct,
        refineryUtil,
        euGasStorage: latest(gasRows),
        isAnyStale,
        overallNarrative: buildNarrative(wtiRegime, refineryUtil),
        lastUpdated,
    };
};

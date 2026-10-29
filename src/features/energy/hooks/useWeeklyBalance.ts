import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import type { WeeklyPoint } from '@/features/energy/lib/weeklyBalance';

/** EIA series as stored by ingest-eia-weekly. `divisor` converts to the unit the desk displays. */
const SERIES = {
    crude: { metricId: 'EIA_WKLY_CRUDE_STOCKS_KBBL', divisor: 1000 },
    cushing: { metricId: 'EIA_WKLY_CUSHING_STOCKS_KBBL', divisor: 1000 },
    gasoline: { metricId: 'EIA_WKLY_GASOLINE_STOCKS_KBBL', divisor: 1000 },
    distillate: { metricId: 'EIA_WKLY_DISTILLATE_STOCKS_KBBL', divisor: 1000 },
    jet: { metricId: 'EIA_WKLY_JET_STOCKS_KBBL', divisor: 1000 },
    /** Already million barrels. */
    spr: { metricId: MID.OIL_SPR_LEVEL_US, divisor: 1 },
    utilization: { metricId: MID.OIL_REFINERY_UTILIZATION_US, divisor: 1 },
    productSupplied: { metricId: 'EIA_WKLY_PRODUCT_SUPPLIED_KBD', divisor: 1 },
    production: { metricId: 'EIA_WKLY_CRUDE_PRODUCTION_KBD', divisor: 1 },
    netImports: { metricId: 'EIA_WKLY_CRUDE_NET_IMPORTS_KBD', divisor: 1 },
} as const;

export type WeeklyBalanceKey = keyof typeof SERIES;
export type WeeklyBalanceData = Record<WeeklyBalanceKey, WeeklyPoint[]>;

/** About ten years of weekly prints: five for the band, plus the year-ago and chart windows. */
const ROWS_PER_SERIES = 520;

/**
 * Stocks are in million barrels, flows in thousand barrels per day, utilization in percent.
 * Series are fetched one by one so no series can crowd out another under the row cap; each is
 * ascending by week-ending date and empty when ingest has not written it.
 */
export const useWeeklyBalance = () =>
    useQuery({
        queryKey: ['eia-weekly-balance'],
        queryFn: async (): Promise<WeeklyBalanceData> => {
            const entries = await Promise.all(
                (Object.keys(SERIES) as WeeklyBalanceKey[]).map(async key => {
                    const { metricId, divisor } = SERIES[key];
                    const { data, error } = await supabase
                        .from('metric_observations')
                        .select('as_of_date, value')
                        .eq('metric_id', metricId)
                        .order('as_of_date', { ascending: false })
                        .limit(ROWS_PER_SERIES);
                    if (error) throw error;
                    const points: WeeklyPoint[] = (data ?? [])
                        .map(r => ({ date: String(r.as_of_date), value: Number(r.value) / divisor }))
                        .filter(p => Number.isFinite(p.value))
                        .reverse();
                    return [key, points] as const;
                }),
            );
            return Object.fromEntries(entries) as WeeklyBalanceData;
        },
        staleTime: 1000 * 60 * 30,
    });

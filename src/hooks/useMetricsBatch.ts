/**
 * useMetricsBatch — batch fetch multiple metrics in 2 round-trips instead of 2N.
 *
 * Problem: useLatestMetric() fires 2 sequential Supabase round-trips per metric.
 * The Terminal page mounts ~15+ module rows each with multiple metric chips, resulting
 * in 30–60+ simultaneous HTTP/1.1 requests that serialize badly and can hit Supabase
 * rate limits, especially on window-refocus.
 *
 * Solution: Fetch all requested metric IDs in two bulk queries (.in('metric_id', ids)),
 * then populate the per-metric TanStack Query cache entries so existing useLatestMetric()
 * calls return instantly from cache without needing to be refactored.
 *
 * Usage:
 *   // In a parent component that knows which metrics will be needed:
 *   useMetricsBatch([MID.FED_BALANCE_SHEET, MID.TGA_BALANCE, MID.PRIMARY_DEALER_TREASURY_HOLDINGS_BN]);
 *
 *   // Child components call useLatestMetric() normally — they'll get cache hits:
 *   const { data } = useLatestMetric(MID.FED_BALANCE_SHEET); // instant, no network
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapLatestMetric } from '@/lib/metricData';
import type { MetricData } from './useLatestMetric';

/**
 * Fetches a batch of metrics and seeds them into the TanStack Query cache.
 * Returns a map of metricId → MetricData for direct access if needed.
 *
 * @param metricIds - Array of metric IDs to prefetch. Deduplicated internally.
 * @param staleTime - How long to consider the batch result fresh (default: 5 min)
 */
export function useMetricsBatch(
    metricIds: string[],
    staleTime = 1000 * 60 * 5,
): { isLoading: boolean; data: Record<string, MetricData> } {
    const queryClient = useQueryClient();
    // Deduplicate IDs to avoid redundant work
    const ids = [...new Set(metricIds)].filter(Boolean);

    const { data, isLoading } = useQuery({
        queryKey: ['metrics-batch', ...ids.sort()],
        enabled: ids.length > 0,
        staleTime,
        refetchOnWindowFocus: false,
        queryFn: async (): Promise<Record<string, MetricData>> => {
            // Query 1: latest state for all metrics
            const { data: latestRows, error: latestError } = await supabase
                .from('vw_latest_metrics')
                .select('*')
                .in('metric_id', ids);

            if (latestError) {
                console.warn('[useMetricsBatch] vw_latest_metrics error:', latestError.message);
                return {};
            }

            if (!latestRows || latestRows.length === 0) return {};

            // Query 2: history for sparklines — all IDs in one request, up to 300 points each
            const { data: historyRows } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value')
                .in('metric_id', ids)
                .order('as_of_date', { ascending: false })
                .limit(300 * ids.length); // generous budget

            const historyByMetric: Record<string, { metric_id: string; as_of_date: string; value: number }[]> = {};
            for (const row of historyRows ?? []) {
                const mid = String(row.metric_id);
                if (!historyByMetric[mid]) historyByMetric[mid] = [];
                historyByMetric[mid].push(row as { metric_id: string; as_of_date: string; value: number });
            }

            const result: Record<string, MetricData> = {};
            for (const row of latestRows) {
                const mid = String(row.metric_id);
                const metricData = mapLatestMetric(
                    row as Record<string, unknown>,
                    historyByMetric[mid] ?? [],
                );
                result[mid] = metricData;

                // Seed the per-metric cache so useLatestMetric(mid) gets an immediate hit
                queryClient.setQueryData(['metric', mid], metricData);
            }

            return result;
        },
    });

    return { isLoading, data: data ?? {} };
}

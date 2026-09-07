import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getPrecedentById, MacroPrecedent } from '@/config/precedentsConfig';
import { alignSeriesToTZero, AlignedComparisonPoint, TimeSeriesPoint } from '@/utils/precedentAligner';

export interface PrecedentComparisonResult {
    precedent: MacroPrecedent;
    metricId: string;
    alignedPoints: AlignedComparisonPoint[];
    currentObservationCount: number;
    precedentObservationCount: number;
    hasSufficientData: boolean;
    currentBaseValue?: number;
    precedentBaseValue?: number;
}

/**
 * Fetches time series for a metric during both the current regime window and a historical precedent window,
 * then returns the normalized T=0 comparison series.
 */
export function useHistoricalPrecedents(
    metricId: string,
    precedentId: string,
    currentTZeroDate: string = '2022-03-16' // Default anchor (e.g. Fed tightening start or custom shock anchor)
) {
    const precedent = getPrecedentById(precedentId);

    return useQuery({
        queryKey: ['historical-precedent-comparison', metricId, precedentId, currentTZeroDate],
        enabled: Boolean(metricId && precedent),
        queryFn: async (): Promise<PrecedentComparisonResult | null> => {
            if (!precedent) return null;

            // 1. Fetch historical precedent window observations
            const precedentPromise = supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', metricId)
                .gte('as_of_date', precedent.startDate)
                .lte('as_of_date', precedent.endDate)
                .order('as_of_date', { ascending: true });

            // 2. Fetch current window observations (e.g. from 90 days before current T=0 to latest)
            const currentLookbackDate = new Date(new Date(currentTZeroDate).getTime() - 90 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0];

            const currentPromise = supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', metricId)
                .gte('as_of_date', currentLookbackDate)
                .order('as_of_date', { ascending: true });

            const [precRes, curRes] = await Promise.all([precedentPromise, currentPromise]);

            const precedentSeries: TimeSeriesPoint[] = (precRes.data || []).map(r => ({
                date: String(r.as_of_date),
                value: Number(r.value)
            }));

            const currentSeries: TimeSeriesPoint[] = (curRes.data || []).map(r => ({
                date: String(r.as_of_date),
                value: Number(r.value)
            }));

            // If either series has 0 data points (e.g. metric did not exist during historical episode),
            // fallback gracefully without fabricating data
            const hasSufficientData = precedentSeries.length > 0 && currentSeries.length > 0;

            const alignedPoints = hasSufficientData
                ? alignSeriesToTZero(
                    currentSeries,
                    currentTZeroDate,
                    precedentSeries,
                    precedent.tZeroDate,
                    -30,
                    180,
                    3
                )
                : [];

            return {
                precedent,
                metricId,
                alignedPoints,
                currentObservationCount: currentSeries.length,
                precedentObservationCount: precedentSeries.length,
                hasSufficientData,
                currentBaseValue: currentSeries[0]?.value,
                precedentBaseValue: precedentSeries[0]?.value
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: 1000 * 60 * 60 * 4,
    });
}

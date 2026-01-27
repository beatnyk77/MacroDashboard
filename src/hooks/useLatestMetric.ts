import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MetricData {
    value: number;
    delta: number | null;
    deltaPeriod: string;
    history: { date: string; value: number }[];
    status: 'safe' | 'warning' | 'danger' | 'neutral';
    lastUpdated: string;
}

export function useLatestMetric(metricKey: string) {
    return useQuery({
        queryKey: ['metric', metricKey],
        queryFn: async (): Promise<MetricData | null> => {
            // 1. Get metric ID from key
            const { data: metric, error: metricError } = await supabase
                .from('metrics')
                .select('id, native_frequency, display_frequency, staleness_threshold_hours')
                // Note: Schema uses 'metric_key' as unique identifier column, but our frontend passes 'metricKey'
                // We need to match existing keys 'M2SL', 'TOTAL_PUBLIC_DEBT' etc.
                // The frontend currently passes keys like 'm2', 'pulse' which might NEEd MAPPING.
                // Let's query by metric_key.
                .eq('metric_key', metricKey.toUpperCase()) // Attempt upper case match? 
                // Wait, existing keys seeded are 'M2SL', 'CPIAUCSL'. Frontend uses 'm2'.
                // I need a mapping layer or update frontend keys. 
                // Let's assumes we update frontend to use real keys eventually, 
                // OR we map 'm2' -> 'M2SL' here.
                .single();

            // For now, let's try to map common names to real keys or just pass through
            let lookupKey = metricKey;
            const KEY_MAP: Record<string, string> = {
                'm2': 'M2SL',
                'gold_reserves': 'TI00000', // Need real code for this
                'net_supply': 'TOTAL_PUBLIC_DEBT', // Proxy for now? M4 plan said 'Net Supply' is calculated.
                // If it's a computed metric, we might need a separate API or dedicated query.
                // Let's handle direct simple metrics first.
            };

            if (KEY_MAP[metricKey]) lookupKey = KEY_MAP[metricKey];

            // Re-query with potential mapped key
            const { data: realMetric, error: realMetricError } = await supabase
                .from('metrics')
                .select('id, native_frequency')
                .eq('metric_key', lookupKey)
                .single();

            if (realMetricError || !realMetric) {
                // Return null or stub if not found (graceful degradation)
                console.warn(`Metric ${metricKey} (${lookupKey}) not found in DB`);
                return null;
            }

            // 2. Get values for this metric
            const { data: values, error: valuesError } = await supabase
                .from('metric_values')
                .select('date, value')
                .eq('metric_id', realMetric.id)
                .order('date', { ascending: false })
                .limit(13); // Get 1 year + 1 month for trend

            if (valuesError || !values || values.length === 0) return null;

            const latest = values[0];
            const prev = values[1]; // Simple 1-period delta
            // Ideally we find delta based on 'deltaPeriod' (e.g. YoY = index 12)

            let delta = 0;
            let deltaPeriod = 'MoM';

            // Simple logic: if monthly, compare to 1 month ago. If daily, 1 day ago.
            // Improvement: Logic based on normalized frequency
            if (values.length > 1) {
                delta = latest.value - prev.value;
            }

            // Calculate status based on simple rules or Z-score if available
            // For now: neutral

            return {
                value: Number(latest.value),
                delta: delta,
                deltaPeriod,
                history: values.map(v => ({ date: String(v.date), value: Number(v.value) })).reverse(), // Recharts wants ascending
                status: 'neutral',
                lastUpdated: latest.date as string
            };
        },
        staleTime: 1000 * 60 * 5, // 5 min
    });
}

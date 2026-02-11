import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface IntegrityReport {
    status: 'healthy' | 'degraded' | 'critical';
    message: string;
    staleCount: number;
    totalHighFrequency: number;
    lastChecked: string;
}

export function useDataIntegrity() {
    return useQuery({
        queryKey: ['data-integrity'],
        queryFn: async (): Promise<IntegrityReport> => {
            // Only count high-frequency metrics (daily/weekly) toward stale count
            // Monthly/quarterly metrics (GDP, BOP, ASI) will always exceed 7-day threshold
            const HIGH_FREQUENCY_PREFIXES = [
                'CAPITAL_FROM_',
                'FLOW_TO_',
                'HOUSING_MORTGAGE_',
                'PMI_',
                'LABOR_VACANCIES',
                'LABOR_UNEMPLOYMENT',
                'INFLATION_HEADLINE',
                'INFLATION_CORE',
                'GOLD_PRICE',
                'COPPER_PRICE',
                'OIL_PRICE',
                'USD_',
                'CNY_',
            ];

            const { data: metrics } = await supabase
                .from('vw_latest_metrics')
                .select('metric_id, as_of_date');

            if (!metrics || metrics.length === 0) {
                return {
                    status: 'critical',
                    message: 'No metric data available in the synchronization layer.',
                    staleCount: 0,
                    totalHighFrequency: 0,
                    lastChecked: new Date().toISOString()
                };
            }

            const now = new Date().getTime();
            const weekInMs = 1000 * 60 * 60 * 24 * 7;

            // Filter to high-frequency metrics only
            const highFreqMetrics = metrics.filter(m =>
                HIGH_FREQUENCY_PREFIXES.some(prefix => m.metric_id?.startsWith(prefix))
            );

            const staleHighFreq = highFreqMetrics.filter(m => {
                const diff = now - new Date(m.as_of_date).getTime();
                return diff > weekInMs;
            });

            const totalHighFreq = highFreqMetrics.length;
            const staleCount = staleHighFreq.length;
            const staleRatio = totalHighFreq > 0 ? staleCount / totalHighFreq : 0;

            // CRITICAL: >25% of high-freq metrics stale AND >10 absolute count
            if (staleRatio > 0.25 && staleCount > 10) {
                return {
                    status: 'critical',
                    message: 'Data sync delayed',
                    staleCount,
                    totalHighFrequency: totalHighFreq,
                    lastChecked: new Date().toISOString()
                };
            }

            // DEGRADED: any high-freq metrics stale
            if (staleCount > 0) {
                return {
                    status: 'degraded',
                    message: 'Data latency detected',
                    staleCount,
                    totalHighFrequency: totalHighFreq,
                    lastChecked: new Date().toISOString()
                };
            }

            return {
                status: 'healthy',
                message: 'All core systems operational.',
                staleCount: 0,
                totalHighFrequency: totalHighFreq,
                lastChecked: new Date().toISOString()
            };
        },
        refetchInterval: 1000 * 60 * 30 // 30 min
    });
}

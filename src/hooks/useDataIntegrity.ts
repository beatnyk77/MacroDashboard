import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface IntegrityReport {
    status: 'healthy' | 'degraded' | 'critical';
    message: string;
    staleCount: number;
    totalHighFrequency: number;
    lastChecked: string;
    lastIngestionAt: string | null;
}

export function useDataIntegrity() {
    return useQuery({
        queryKey: ['data-integrity'],
        queryFn: async (): Promise<IntegrityReport> => {
            const { data: metrics } = await supabase
                .from('vw_latest_metrics')
                .select('metric_id, staleness_flag, as_of_date');

            if (!metrics || metrics.length === 0) {
                return {
                    status: 'critical',
                    message: 'No metric data available in the synchronization layer.',
                    staleCount: 0,
                    totalHighFrequency: 0,
                    lastChecked: new Date().toISOString(),
                    lastIngestionAt: null
                };
            }

            // staleness_flag is computed in the database per-metric against
            // that metric's own registered expected_interval_days — a
            // quarterly series that's 60 days old is correctly 'fresh',
            // unlike the old client-side flat-7-day-threshold check.
            const staleMetrics = metrics.filter(m => m.staleness_flag === 'lagged' || m.staleness_flag === 'very_lagged');
            const veryStaleMetrics = metrics.filter(m => m.staleness_flag === 'very_lagged');

            const freshestMs = metrics.reduce((acc, m) => {
                const t = new Date(m.as_of_date ?? '').getTime();
                return t > acc ? t : acc;
            }, 0);
            const lastIngestionAt = freshestMs > 0 ? new Date(freshestMs).toISOString() : null;

            const staleCount = staleMetrics.length;
            const totalHighFrequency = metrics.length;
            const staleRatio = totalHighFrequency > 0 ? staleCount / totalHighFrequency : 0;

            if (staleRatio > 0.25 && veryStaleMetrics.length > 10) {
                return {
                    status: 'critical',
                    message: 'Data sync delayed',
                    staleCount,
                    totalHighFrequency,
                    lastChecked: new Date().toISOString(),
                    lastIngestionAt
                };
            }

            if (staleCount > 0) {
                return {
                    status: 'degraded',
                    message: 'Data latency detected',
                    staleCount,
                    totalHighFrequency,
                    lastChecked: new Date().toISOString(),
                    lastIngestionAt
                };
            }

            return {
                status: 'healthy',
                message: 'All core systems operational.',
                staleCount: 0,
                totalHighFrequency,
                lastChecked: new Date().toISOString(),
                lastIngestionAt
            };
        },
        refetchInterval: 1000 * 60 * 30 // 30 min
    });
}

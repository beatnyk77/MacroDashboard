import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface IntegrityReport {
    status: 'healthy' | 'degraded' | 'critical';
    message: string;
    staleCount: number;
    lastChecked: string;
}

export function useDataIntegrity() {
    return useQuery({
        queryKey: ['data-integrity'],
        queryFn: async (): Promise<IntegrityReport> => {
            // Check for stale metrics
            const { data: metrics } = await supabase
                .from('vw_latest_metrics')
                .select('as_of_date');

            if (!metrics || metrics.length === 0) {
                return {
                    status: 'critical',
                    message: 'No metric data available in the synchronization layer.',
                    staleCount: 0,
                    lastChecked: new Date().toISOString()
                };
            }

            const now = new Date().getTime();
            const weekInMs = 1000 * 60 * 60 * 24 * 7;
            const monthInMs = 1000 * 60 * 60 * 24 * 30;

            const staleMetrics = metrics.filter(m => {
                const diff = now - new Date(m.as_of_date).getTime();
                return diff > weekInMs;
            });

            const criticalMetrics = metrics.filter(m => {
                const diff = now - new Date(m.as_of_date).getTime();
                return diff > monthInMs;
            });

            if (criticalMetrics.length > 5 || metrics.every(m => now - new Date(m.as_of_date).getTime() > weekInMs)) {
                return {
                    status: 'critical',
                    message: 'Critical data synchronization failure detected.',
                    staleCount: staleMetrics.length,
                    lastChecked: new Date().toISOString()
                };
            }

            if (staleMetrics.length > 0) {
                return {
                    status: 'degraded',
                    message: 'Some metrics are exceeding latency thresholds.',
                    staleCount: staleMetrics.length,
                    lastChecked: new Date().toISOString()
                };
            }

            return {
                status: 'healthy',
                message: 'All core systems operational.',
                staleCount: 0,
                lastChecked: new Date().toISOString()
            };
        },
        refetchInterval: 1000 * 60 * 30 // 30 min
    });
}

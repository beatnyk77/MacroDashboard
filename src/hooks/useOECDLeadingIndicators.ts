import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface OECDCliRegionData {
    id: string;
    name: string;
    value: number;
    z_score: number;
    trend: 'expansion' | 'contraction' | 'neutral';
    last_updated: string;
}

export function useOECDLeadingIndicators() {
    return useQuery({
        queryKey: ['oecd-cli'],
        queryFn: async (): Promise<OECDCliRegionData[]> => {
            const regions = [
                { id: 'OECD_CLI_US', name: 'United States' },
                { id: 'OECD_CLI_EA', name: 'Euro Area' },
                { id: 'OECD_CLI_CN', name: 'China' },
                { id: 'OECD_CLI_IN', name: 'India' }
            ];

            const { data: metrics, error } = await supabase
                .from('vw_latest_metrics')
                .select('*')
                .in('metric_id', regions.map(r => r.id));

            if (error) throw error;

            return regions.map(r => {
                const m = metrics.find(metric => metric.metric_id === r.id);
                const z = Number(m?.z_score || 0);
                const val = Number(m?.value || 100);

                let trend: 'expansion' | 'contraction' | 'neutral' = 'neutral';
                if (val > 100 && z > 0.5) trend = 'expansion';
                else if (val < 100 && z < -0.5) trend = 'contraction';

                return {
                    id: r.id,
                    name: r.name,
                    value: val,
                    z_score: z,
                    trend,
                    last_updated: m?.as_of_date || new Date().toISOString()
                };
            });
        },
        staleTime: 1000 * 60 * 60, // 1h
    });
}

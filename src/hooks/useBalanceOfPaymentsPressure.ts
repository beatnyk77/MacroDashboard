import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BOPCountryData {
    code: string;
    name: string;
    reer_value: number;
    reer_z_score: number;
    ca_gdp_value: number;
    status: 'safe' | 'warning' | 'danger';
    last_updated: string;
}

export function useBalanceOfPaymentsPressure() {
    return useQuery({
        queryKey: ['bop-pressure'],
        queryFn: async (): Promise<BOPCountryData[]> => {
            const countryMap = [
                { code: 'IN', reer_id: 'REER_INDEX_IN', ca_id: 'CA_GDP_PCT_IN', name: 'India' },
                { code: 'CN', reer_id: 'REER_INDEX_CN', ca_id: 'CA_GDP_PCT_CN', name: 'China' },
                { code: 'BR', reer_id: 'REER_INDEX_BR', ca_id: 'CA_GDP_PCT_BR', name: 'Brazil' },
                { code: 'TR', reer_id: 'REER_INDEX_TR', ca_id: 'CA_GDP_PCT_TR', name: 'Turkey' }
            ];

            const metricIds = countryMap.flatMap(c => [c.reer_id, c.ca_id]);

            const { data: metrics, error } = await supabase
                .from('vw_latest_metrics')
                .select('*')
                .in('metric_id', metricIds);

            if (error) throw error;

            return countryMap.map(c => {
                const reer = metrics.find(m => m.metric_id === c.reer_id);
                const ca = metrics.find(m => m.metric_id === c.ca_id);

                const reerZ = reer?.z_score || 0;
                const caVal = ca?.value || 0;

                // Pressure Logic: High REER (overvalued) + Negative Current Account (external deficit)
                let status: 'safe' | 'warning' | 'danger' = 'safe';
                if (reerZ > 1.5 && caVal < -3) status = 'danger';
                else if (reerZ > 1.0 || caVal < -2) status = 'warning';

                return {
                    code: c.code,
                    name: c.name,
                    reer_value: Number(reer?.value || 0),
                    reer_z_score: Number(reerZ),
                    ca_gdp_value: Number(caVal),
                    status,
                    last_updated: reer?.as_of_date || ca?.as_of_date || new Date().toISOString()
                };
            });
        },
        staleTime: 1000 * 60 * 60, // 1h
    });
}

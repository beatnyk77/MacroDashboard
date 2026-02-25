import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface IllicitFlow {
    id: string;
    partner_country: string;
    direction: 'export_misinvoicing' | 'import_misinvoicing' | 'total';
    amount_usd_bn: number;
    percent_gdp: number;
    vulnerability_score: number;
    year: number;
    source: string;
    created_at: string;
}

export const useIllicitFlowsData = () => {
    return useQuery({
        queryKey: ['illicit-flows'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('illicit_flows')
                .select('*')
                .order('year', { ascending: true });

            if (error) throw error;
            return data as IllicitFlow[];
        }
    });
};

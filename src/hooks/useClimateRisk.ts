import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ClimateRiskData {
    id: string;
    date: string;
    country_code: string;
    region_code: string | null;
    grid_co2_intensity: number;
    transition_risk_score: number;
    renewable_share_pct: number;
    total_ghg_emissions_mt: number;
    temperature_alignment_c: number;
    is_climate_emergency: boolean;
    metadata: any;
    created_at: string;
}

export const useClimateRisk = () => {
    return useQuery({
        queryKey: ['climate-risk-metrics'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('climate_risk_metrics')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            return data as ClimateRiskData[];
        },
        refetchInterval: 1000 * 60 * 60 * 6, // Refresh every 6 hours
    });
};

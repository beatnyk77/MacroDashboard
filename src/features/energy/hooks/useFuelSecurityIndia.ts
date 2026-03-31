import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface FuelSecurityIndia {
  as_of_date: string;
  reserves_days_coverage: number;
  reserves_days_official: number;
  reserves_days_actual: number | null;
  deviation_pct: number | null;
  daily_consumption_mbpd: number;
  brent_price_usd: number | null;
  inr_per_barrel: number | null;
  active_tankers_count: number;
  tanker_pipeline_json: Array<{
    id: string;
    vessel_name: string;
    origin: string;
    eta: string;
    volume_mbbl: number;
    risk_flag: 'chokepoint_exposed' | 'standard';
    vessel_type: string;
  }>;
  geopolitical_risk_score: number;
  scenario_baseline_days: number;
  scenario_disruption_days: number;
  scenario_rationing_days: number;
  last_updated_at: string;
  metadata: {
    source_reliability: string;
    notes: string;
    ingestion_version: number;
  };
}

export const useFuelSecurityIndia = () => {
  return useQuery({
    queryKey: ['fuel_security_india'],
    queryFn: async (): Promise<FuelSecurityIndia | null> => {
      try {
        const { data, error } = await supabase
          .from('fuel_security_clock_india')
          .select('*')
          .order('as_of_date', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          // PGRST116 = no rows found — handled as a valid "no data" state
          if (error.code === 'PGRST116') {
            return null;
          }
          console.error('Fuel Security Query error:', error);
          return null;
        }

        return data as FuelSecurityIndia;
      } catch (err) {
        console.error('Unexpected Fuel Security error:', err);
        return null;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });
};
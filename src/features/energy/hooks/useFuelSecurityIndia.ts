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
          .select('id, as_of_date, reserves_days_coverage, reserves_days_official, reserves_days_actual, deviation_pct, daily_consumption_mbpd, brent_price_usd, inr_per_barrel, active_tankers_count, geopolitical_risk_score, scenario_baseline_days, scenario_disruption_days, scenario_rationing_days, last_updated_at, metadata')
          .order('as_of_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Fuel Security Query error:', error);
          return null;
        }

        if (!data) return null;

        return {
          ...data,
          tanker_pipeline_json: [],
        } as unknown as FuelSecurityIndia;
      } catch (err) {
        console.error('Unexpected Fuel Security error:', err);
        return null;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });
};
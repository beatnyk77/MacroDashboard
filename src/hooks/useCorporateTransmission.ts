import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type CorporateSignalRow = Database['public']['Views']['vw_latest_corporate_signals']['Row'];
export type CorporateTransmissionSummary = Database['public']['Views']['vw_corporate_transmission_summary']['Row'];
export type CorporateTransmissionFilters = { theme?: string; severity?: string; issuerId?: string };

export function useCorporateTransmission(filters: CorporateTransmissionFilters = {}) {
  return useQuery({
    queryKey: ['corporate-transmission', filters],
    queryFn: async (): Promise<CorporateSignalRow[]> => {
      let query = supabase.from('vw_latest_corporate_signals').select('*');
      if (filters.theme) query = query.eq('macro_theme', filters.theme);
      if (filters.severity) query = query.eq('severity', filters.severity);
      if (filters.issuerId) query = query.eq('issuer_id', filters.issuerId);
      const { data, error } = await query.order('observed_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCorporateTransmissionSummary() {
  return useQuery({
    queryKey: ['corporate-transmission-summary'],
    queryFn: async (): Promise<CorporateTransmissionSummary | null> => {
      const { data, error } = await supabase.from('vw_corporate_transmission_summary').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface FiscalAllocationData {
    id: string;
    entity_type: 'central' | 'state';
    state_code: string | null;
    state_name: string | null;
    fy: string;
    date: string;
    capex_lakh_cr: number | null;
    revenue_exp_lakh_cr: number | null;
    total_exp_lakh_cr: number | null;
    subsidies_lakh_cr: number | null;
    committed_lakh_cr: number | null;
    gdp_lakh_cr: number | null;
    capex_pct_total: number | null;
    capex_pct_gdp: number | null;
    revenue_pct_gdp: number | null;
    freebies_pct_receipts: number | null;
    updated_at: string;
}

export function useIndiaFiscalAllocation() {
    return useQuery({
        queryKey: ['india-fiscal-allocation'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('india_fiscal_allocation')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;

            const allData = data as FiscalAllocationData[];
            const centralData = allData.filter(d => d.entity_type === 'central');
            const stateData = allData.filter(d => d.entity_type === 'state');

            return {
                centralData,
                stateData,
                allData
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
        refetchOnWindowFocus: false,
    });
}

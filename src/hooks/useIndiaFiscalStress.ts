import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface IndiaFiscalStressData {
    date: string;
    interest_payments: number;
    revenue_receipts: number;
    total_expenditure: number;
    gross_tax_revenue: number;
    gdp: number;
    revenue_deficit: number;
    fiscal_deficit: number;
    general_govt_debt: number;
    interest_revenue_pct: number;
    interest_expenditure_pct: number;
    interest_gtr_pct: number;
    interest_gdp_pct: number;
    revenue_deficit_gdp_pct: number;
    fiscal_deficit_gdp_pct: number;
    debt_gdp_pct: number;
    updated_at: string;
}

export function useIndiaFiscalStress() {
    return useQuery({
        queryKey: ['india-fiscal-stress'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('india_fiscal_stress')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            return data as IndiaFiscalStressData[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
        refetchOnWindowFocus: false,
    });
}

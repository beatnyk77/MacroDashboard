import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface USFiscalStress {
    date: string;
    interest_expense: number;
    total_receipts: number;
    payroll_taxes: number;
    personal_taxes: number;
    gdp: number;
    insolvency_ratio: number;
    employment_tax_share: number;
    receipts_gdp: number;
    updated_at: string;
}

export const useUSFiscalStress = () => {
    return useQuery({
        queryKey: ['us-fiscal-stress'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('us_fiscal_stress')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            return data as USFiscalStress[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};

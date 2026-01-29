import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TreasuryHolder {
    country_name: string;
    as_of_date: string;
    holdings_usd_bn: number;
    mom_pct_change: number | null;
    yoy_pct_change: number | null;
    pct_of_total_foreign: number | null;
}

export function useTreasuryHolders() {
    return useQuery({
        queryKey: ['treasury-holders'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_tic_foreign_holders')
                .select('*')
                .order('as_of_date', { ascending: false });

            if (error) throw error;
            return data as TreasuryHolder[];
        },
    });
}

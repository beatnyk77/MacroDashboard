import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface WhiteCollarDistressData {
    as_of_date: string;
    unemployment_prof_bus_services: number;
    unemployment_financial_activities: number;
    delinquency_credit_cards: number;
    delinquency_consumer_loans: number;
    bank_etf_price: number;
    symbol_cof_price: number;
    symbol_axp_price: number;
    distress_composite_score: number;
    correlation_401k: number;
    correlation_grit: number;
    interpretation: string;
    metadata: any;
}

export function useWhiteCollarDistress() {
    return useSuspenseQuery({
        queryKey: ['white_collar_debt_distress'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('white_collar_debt_distress')
                .select('*')
                .order('as_of_date', { ascending: false })
                .limit(52); // Fetch 1 year of weekly/daily data

            if (error) throw error;
            return data as WhiteCollarDistressData[];
        }
    });
}

import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SmartMoneyFlowData {
    as_of_date: string;
    tic_net_foreign_buying: number;
    cot_equities_net_position: number;
    cot_gold_net_position: number;
    etf_flow_proxy: number;
    regime_score: number;
    sankey_data: {
        nodes: Array<{ id: string; color: string }>;
        links: Array<{ source: string; target: string; value: number }>;
    };
    interpretation: string;
}

export function useSmartMoneyFlow() {
    return useSuspenseQuery({
        queryKey: ['smart_money_flow'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('smart_money_flow')
                .select('*')
                .order('as_of_date', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            return data as SmartMoneyFlowData;
        }
    });
}

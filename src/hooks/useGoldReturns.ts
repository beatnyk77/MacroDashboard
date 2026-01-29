import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GoldReturnEvent {
    month_date: string;
    return_pct: number;
    gold_price: number | null;
    event_name: string | null;
    event_description: string | null;
    macro_regime: string | null;
}

export function useGoldReturns() {
    return useQuery({
        queryKey: ['gold-returns-events'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_gold_returns_events')
                .select('*')
                .order('month_date', { ascending: true });

            if (error) throw error;
            return data as GoldReturnEvent[];
        },
    });
}

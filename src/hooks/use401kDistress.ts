import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Distress401kData {
    date: string;
    vanguard_hardship_pct: number;
    fidelity_loan_pct: number;
    ici_loan_balance_pct: number;
    savings_rate_proxy: number;
    consumer_confidence_proxy: number;
    distress_zscore: number;
    metadata: any;
}

export const use401kDistress = () => {
    return useQuery<Distress401kData[]>({
        queryKey: ['us-401k-distress'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('us_401k_distress')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            return (data || []).map((d: any) => ({
                ...d,
                vanguard_hardship_pct: d.vanguard_hardship_pct !== null ? Number(d.vanguard_hardship_pct) : null,
                fidelity_loan_pct: d.fidelity_loan_pct !== null ? Number(d.fidelity_loan_pct) : null,
                ici_loan_balance_pct: d.ici_loan_balance_pct !== null ? Number(d.ici_loan_balance_pct) : null,
                savings_rate_proxy: d.savings_rate_proxy !== null ? Number(d.savings_rate_proxy) : null,
                consumer_confidence_proxy: d.consumer_confidence_proxy !== null ? Number(d.consumer_confidence_proxy) : null,
                distress_zscore: d.distress_zscore !== null ? Number(d.distress_zscore) : null
            })) as Distress401kData[];
        }
    });
};

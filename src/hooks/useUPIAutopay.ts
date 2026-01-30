import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface UPIAutopayMetric {
    as_of_date: string;
    failure_rate_pct: number;
    failure_rate_delta_mom: number | null;
    total_attempts_fmt: string;
    staleness_flag: 'fresh' | 'lagged';
    source_url: string;
}

export const useUPIAutopay = () => {
    return useQuery({
        queryKey: ['upi_autopay_latest'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_upi_autopay_latest')
                .select('*')
                .single();

            if (error) throw error;
            return data as UPIAutopayMetric;
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        retry: 2
    });
};

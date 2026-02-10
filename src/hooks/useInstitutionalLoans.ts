import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface InstitutionalLoanDominance {
    recipient_region: string;
    recipient_income_bracket: string;
    loan_type: 'Stock' | 'Flow';
    as_of_date: string;
    west_total: number;
    east_total: number;
    japan_total: number;
    total_volume: number;
    east_dominance_pct: number;
    japan_dominance_pct: number;
    dominance_status: 'WEST_DOMINANT' | 'EAST_DOMINANT' | 'JAPAN_DOMINANT' | 'CONTESTED' | 'NEUTRAL';
}

/**
 * Hook to fetch institutional lending dominance data from vw_institutional_dominance
 */
export function useInstitutionalLoans(loanType: 'Stock' | 'Flow' = 'Stock') {
    return useQuery({
        queryKey: ['institutional-loans', loanType],
        queryFn: async (): Promise<InstitutionalLoanDominance[]> => {
            const { data, error } = await supabase
                .from('vw_institutional_dominance')
                .select('*')
                .eq('loan_type', loanType)
                .order('total_volume', { ascending: false });

            if (error) {
                console.error('Error fetching institutional loans:', error);
                throw error;
            }

            return data as InstitutionalLoanDominance[];
        },
        staleTime: 1000 * 60 * 60 * 6, // 6 hours (quarterly data)
        retry: 2,
    });
}

/**
 * Hook to fetch raw institutional loan data for specific time series
 */
export function useInstitutionalLendingHistory(region: string, type: 'Stock' | 'Flow') {
    return useQuery({
        queryKey: ['institutional-loans-history', region, type],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('institutional_loans')
                .select('as_of_date, lender_bloc, amount_usd')
                .eq('recipient_region', region)
                .eq('loan_type', type)
                .order('as_of_date', { ascending: true });

            if (error) throw error;

            // Group by date to create stacked data
            const grouped = (data || []).reduce((acc: any, curr) => {
                const date = curr.as_of_date;
                if (!acc[date]) acc[date] = { date, WEST: 0, EAST: 0, JAPAN: 0 };
                acc[date][curr.lender_bloc] += Number(curr.amount_usd);
                return acc;
            }, {});

            return Object.values(grouped);
        },
        staleTime: 1000 * 60 * 60 * 6,
        enabled: !!region,
    });
}

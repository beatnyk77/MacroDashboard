import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface G20GoldDebtRow {
    country_code: string;
    date: string;
    gold_price_usd: number;
    fx_rate_local_per_usd: number;
    gold_price_local: number;
    debt_local: number;
    gold_reserves_oz: number;
    debt_per_oz_local: number;
    coverage_ratio: number;
    implied_gold_price_usd: number;
}

export interface G20GoldDebtData {
    latest: G20GoldDebtRow[];
    history: Record<string, G20GoldDebtRow[]>;
}

export function useGoldDebtCoverageG20() {
    return useQuery({
        queryKey: ['gold_debt_coverage_g20'],
        queryFn: async (): Promise<G20GoldDebtData> => {
            // Fetch all data, ordered by date descending
            const { data, error } = await supabase
                .from('gold_debt_coverage_g20')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            const rows = (data || []) as G20GoldDebtRow[];

            // Group by country
            const history: Record<string, G20GoldDebtRow[]> = {};
            const latestMap = new Map<string, G20GoldDebtRow>();

            rows.forEach(row => {
                if (!history[row.country_code]) {
                    history[row.country_code] = [];
                }
                history[row.country_code].push(row);

                if (!latestMap.has(row.country_code)) {
                    latestMap.set(row.country_code, row);
                }
            });

            // Ensure history is cronological (ascending) for charts
            Object.keys(history).forEach(code => {
                history[code].reverse();
            });

            const latest = Array.from(latestMap.values());

            return { latest, history };
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}

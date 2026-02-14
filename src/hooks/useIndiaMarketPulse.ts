import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MarketPulseData {
    date: string;
    fii_cash_net: number;
    dii_cash_net: number;
    fii_idx_fut_net: number;
    pcr: number;
    india_vix: number;
    india_vix_zscore: number;
    advances: number;
    declines: number;
    delivery_pct: number;
    circuits_pct: number;
    sector_returns: Record<string, number>;
    midcap_perf: number;
    smallcap_perf: number;
    nifty_perf: number;
    new_highs_52w: number;
    new_lows_52w: number;
    // Stats from view
    fii_zscore?: number;
    fii_percentile?: number;
    vix_zscore?: number;
    vix_percentile?: number;
}

export const useIndiaMarketPulse = () => {
    return useQuery({
        queryKey: ['india-market-pulse'],
        queryFn: async () => {
            // Fetch latest data + stats joined
            const { data: latest, error: latestError } = await supabase
                .from('market_pulse_stats')
                .select('*')
                .order('date', { ascending: false })
                .limit(1)
                .single();

            if (latestError && latestError.code !== 'PGRST116') throw latestError;

            // Fetch 1-year history for sparklines
            const { data: history, error: historyError } = await supabase
                .from('market_pulse_daily')
                .select('*')
                .order('date', { ascending: true })
                .limit(252);

            if (historyError) throw historyError;

            return {
                current: latest as MarketPulseData,
                history: history as MarketPulseData[]
            };
        }
    });
};

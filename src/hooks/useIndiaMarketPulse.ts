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

            const mapRow = (d: any) => ({
                ...d,
                fii_cash_net: Number(d.fii_cash_net),
                dii_cash_net: Number(d.dii_cash_net),
                fii_idx_fut_net: Number(d.fii_idx_fut_net),
                pcr: Number(d.pcr),
                india_vix: Number(d.india_vix),
                india_vix_zscore: Number(d.india_vix_zscore),
                advances: Number(d.advances),
                declines: Number(d.declines),
                delivery_pct: Number(d.delivery_pct),
                circuits_pct: Number(d.circuits_pct),
                midcap_perf: Number(d.midcap_perf),
                smallcap_perf: Number(d.smallcap_perf),
                nifty_perf: Number(d.nifty_perf),
                new_highs_52w: Number(d.new_highs_52w),
                new_lows_52w: Number(d.new_lows_52w),
                fii_zscore: d.fii_zscore !== undefined ? Number(d.fii_zscore) : undefined,
                fii_percentile: d.fii_percentile !== undefined ? Number(d.fii_percentile) : undefined,
                vix_zscore: d.vix_zscore !== undefined ? Number(d.vix_zscore) : undefined,
                vix_percentile: d.vix_percentile !== undefined ? Number(d.vix_percentile) : undefined
            } as MarketPulseData);

            return {
                current: latest ? mapRow(latest) : null,
                history: (history || []).map(mapRow)
            };
        }
    });
};

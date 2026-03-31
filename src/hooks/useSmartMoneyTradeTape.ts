import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface InferredTrade {
    id: string;
    cik: string;
    fund_name: string;
    ticker: string | null;
    cusip: string;
    trade_type: string; // BUY, SELL, INITIATE, EXIT, INCREASE, DECREASE
    direction: string; // ACCUMULATE, DISTRIBUTE, NEUTRAL
    sector: string | null;
    prior_qty_usd: number;
    current_qty_usd: number;
    delta_usd: number;
    delta_pct: number;
    price_change_pct: number | null;
    conviction_score: number;
    as_of_date: string;
    inferred_at: string;
    created_at: string;
}

export interface SectorFlow {
    sector: string;
    avg_delta: number;
    trades: number;
}

export function useSmartMoneyTradeTape() {
    // Fetch recent inferred trades (up to 100 for slicing)
    const { data: trades = [] } = useSuspenseQuery<InferredTrade[]>({
        queryKey: ['smart_money_trade_tape'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('institutional_trades_inferred')
                .select('*')
                .order('inferred_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            return data as InferredTrade[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Top 20 trades by conviction
    const recentTrades = trades
        .sort((a, b) => b.conviction_score - a.conviction_score)
        .slice(0, 20);

    // Sector flow aggregation: average delta_pct per sector
    const sectorFlowMap = new Map<string, { total_delta_pct: number; count: number }>();
    trades.forEach(t => {
        const sec = t.sector || 'Other';
        const existing = sectorFlowMap.get(sec) || { total_delta_pct: 0, count: 0 };
        sectorFlowMap.set(sec, {
            total_delta_pct: existing.total_delta_pct + t.delta_pct,
            count: existing.count + 1
        });
    });

    const sectorFlow: SectorFlow[] = Array.from(sectorFlowMap.entries())
        .map(([sector, stats]) => ({
            sector,
            avg_delta: stats.total_delta_pct / stats.count,
            trades: stats.count
        }))
        .sort((a, b) => Math.abs(b.avg_delta) - Math.abs(a.avg_delta));

    return { recentTrades, sectorFlow };
}

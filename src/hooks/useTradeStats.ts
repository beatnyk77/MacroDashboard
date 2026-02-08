import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TradeStat {
    id: string;
    country_code: string;
    as_of_date: string;
    exports_usd_bn: number;
    imports_usd_bn: number;
    trade_balance_usd_bn: number;
    exports_yoy_pct: number | null;
    imports_yoy_pct: number | null;
    partners_json: any;
    ftas_json: any;
    tariffs_avg_pct: number | null;
    metadata: any;
}

export function useTradeStats(countryCode?: string) {
    return useQuery({
        queryKey: ['trade-stats', countryCode],
        queryFn: async (): Promise<TradeStat[]> => {
            let query = supabase
                .from('trade_stats')
                .select('*')
                .order('as_of_date', { ascending: false });

            if (countryCode) {
                query = query.eq('country_code', countryCode);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching trade stats:', error);
                throw error;
            }

            return data as TradeStat[];
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours (monthly data)
        retry: 2,
    });
}

export function useTradePartners(countryCode: string) {
    return useQuery({
        queryKey: ['trade-partners', countryCode],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('trade_stats')
                .select('as_of_date, partners_json')
                .eq('country_code', countryCode)
                .order('as_of_date', { ascending: false })
                .limit(1);

            if (error) throw error;
            return data?.[0]?.partners_json || {};
        },
        enabled: !!countryCode,
    });
}

export interface TradeInsight {
    type: 'positive' | 'negative' | 'neutral';
    message: string;
    metric?: string;
    value?: number;
}

export function getTradeInsights(current: TradeStat, previous?: TradeStat): TradeInsight[] {
    const insights: TradeInsight[] = [];

    if (!current) return insights;

    // 1. Trade Balance Analysis
    if (previous) {
        const balanceChange = current.trade_balance_usd_bn - previous.trade_balance_usd_bn;
        const isImprovement = balanceChange > 0;

        if (Math.abs(balanceChange) > 5) {
            insights.push({
                type: isImprovement ? 'positive' : 'negative',
                message: `Trade balance ${isImprovement ? 'improved' : 'worsened'} by $${Math.abs(balanceChange).toFixed(1)}B MoM`,
                metric: 'Balance',
                value: balanceChange
            });
        }
    }

    // 2. Export/Import Momentum
    if (current.exports_yoy_pct && Math.abs(current.exports_yoy_pct) > 10) {
        insights.push({
            type: current.exports_yoy_pct > 0 ? 'positive' : 'negative',
            message: `Exports ${current.exports_yoy_pct > 0 ? 'surged' : 'dropped'} ${Math.abs(current.exports_yoy_pct).toFixed(1)}% YoY`,
            metric: 'Exports',
            value: current.exports_yoy_pct
        });
    }

    if (current.imports_yoy_pct && Math.abs(current.imports_yoy_pct) > 10) {
        insights.push({
            type: current.imports_yoy_pct < 0 ? 'positive' : 'negative', // Lower imports usually good for deficit, but context dependant
            message: `Imports ${current.imports_yoy_pct > 0 ? 'jumped' : 'fell'} ${Math.abs(current.imports_yoy_pct).toFixed(1)}% YoY`,
            metric: 'Imports',
            value: current.imports_yoy_pct
        });
    }

    // 3. Tariff/FTA Context
    if (current.tariffs_avg_pct && current.tariffs_avg_pct > 15) {
        insights.push({
            type: 'negative',
            message: `High protectionism detected: Avg Tariff ${current.tariffs_avg_pct}%`,
            metric: 'Tariffs',
            value: current.tariffs_avg_pct
        });
    }

    return insights;
}

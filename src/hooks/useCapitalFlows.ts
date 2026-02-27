import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface CapitalFlowMetric {
    country: string;
    assetClass: 'Equity' | 'Debt' | 'Reserves';
    value: number;
    zScore: number;
    status: 'NORMAL' | 'WATCH' | 'CRITICAL';
}

const METRIC_MAP: Record<string, { country: string; assetClass: 'Equity' | 'Debt' | 'Reserves' }> = {
    'CAPITAL_FROM_EQUITY_ETF_BN': { country: 'US', assetClass: 'Equity' },
    'CAPITAL_FROM_TREASURIES_BN': { country: 'US', assetClass: 'Debt' },
    'BITCOIN_PRICE_USD': { country: 'US', assetClass: 'Reserves' },
    'ECB_TOTAL_ASSETS_MEUR': { country: 'EU', assetClass: 'Equity' },
    'EU_DEBT_GDP_PCT': { country: 'EU', assetClass: 'Debt' },
    'GLOBAL_EUR_SHARE_PCT': { country: 'EU', assetClass: 'Reserves' },
    'CN_CREDIT_TOTAL': { country: 'CN', assetClass: 'Equity' },
    'CN_DEBT_USD_TN': { country: 'CN', assetClass: 'Debt' },
    'REER_INDEX_CN': { country: 'CN', assetClass: 'Reserves' },
    'JP_CREDIT_TOTAL': { country: 'JP', assetClass: 'Equity' },
    'JP_DEBT_GDP_PCT': { country: 'JP', assetClass: 'Debt' },
    'BOJ_TOTAL_ASSETS_TRJPY': { country: 'JP', assetClass: 'Reserves' },
    'IN_CREDIT_TOTAL': { country: 'IN', assetClass: 'Equity' },
    'IN_DEBT_USD_TN': { country: 'IN', assetClass: 'Debt' },
    'IN_FX_RESERVES': { country: 'IN', assetClass: 'Reserves' },
    'REER_INDEX_BR': { country: 'BR', assetClass: 'Equity' },
    'BR_DEBT_GDP_PCT': { country: 'BR', assetClass: 'Debt' },
    'BRICS_USD_RESERVE_SHARE_PCT': { country: 'BR', assetClass: 'Reserves' },
};

export function useCapitalFlows() {
    const [data, setData] = useState<CapitalFlowMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchFlows() {
            try {
                const { data: metrics, error } = await supabase
                    .from('vw_latest_metrics')
                    .select('metric_id, value, z_score')
                    .in('metric_id', Object.keys(METRIC_MAP));

                if (error) throw error;

                const formatted = metrics.map(m => {
                    const mapping = METRIC_MAP[m.metric_id];
                    const z = m.z_score || 0;
                    let status: 'NORMAL' | 'WATCH' | 'CRITICAL' = 'NORMAL';

                    if (Math.abs(z) > 2) status = 'CRITICAL';
                    else if (Math.abs(z) > 1) status = 'WATCH';

                    return {
                        ...mapping,
                        value: parseFloat(m.value),
                        zScore: z,
                        status
                    };
                });

                setData(formatted as CapitalFlowMetric[]);
            } catch (err) {
                console.error('Error fetching capital flows:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        }

        fetchFlows();
    }, []);

    return { data, loading, error };
}

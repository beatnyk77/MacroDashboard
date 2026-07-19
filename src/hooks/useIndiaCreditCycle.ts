import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface CreditCycleData {
    date: string;
    credit_growth_yoy: number;
    deposit_growth_yoy: number;
    cd_ratio: number;
    phase: 'Recovery' | 'Expansion' | 'Downturn' | 'Repair';
}

export type CreditCycleFreshness = 'fresh' | 'lagged' | 'stale' | 'no_data';

/** SLA: ≥ today−45d = fresh; ≤90d = lagged; else stale. */
export function creditCycleFreshness(asOf: string | null | undefined, now = Date.now()): CreditCycleFreshness {
    if (!asOf) return 'no_data';
    const days = (now - new Date(asOf).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 45) return 'fresh';
    if (days <= 90) return 'lagged';
    return 'stale';
}

export function useIndiaCreditCycle() {
    const [data, setData] = useState<CreditCycleData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchCreditCycleData = async () => {
            try {
                const { data: creditData, error: dbError } = await supabase
                    .from('india_credit_cycle')
                    .select('*')
                    .order('date', { ascending: true }); // Ascending to plot historical path correctly

                if (dbError) throw dbError;

                if (creditData) {
                    setData(creditData as unknown as CreditCycleData[]); // TODO(types): nullable columns narrowed at runtime
                }
            } catch (err: any) {
                console.error('Error fetching India Credit Cycle data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCreditCycleData();
    }, []);

    const latestDate = data.length ? data[data.length - 1].date : null;
    const freshness = creditCycleFreshness(latestDate);

    return { data, loading, error, latestDate, freshness };
}

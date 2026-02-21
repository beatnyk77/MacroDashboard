import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ShadowTradeAnomaly {
    origin_code: string;
    origin_name: string;
    destination_code: string;
    destination_name: string;
    hs_code: string;
    baseline_usd: number;
    current_usd: number;
    spike_ratio: number;
    baseline_period: string;
    current_period: string;
    metadata: Record<string, string>;
}

export const useShadowTradeData = (category: string = 'Semiconductors (HS 8542)') => {
    const [data, setData] = useState<ShadowTradeAnomaly[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                const { data: rawData, error: dbError } = await supabase
                    .from('shadow_trade_anomalies')
                    .select('*')
                    .eq('category', category)
                    .order('spike_ratio', { ascending: false });

                if (dbError) throw new Error(dbError.message);
                if (isMounted) setData(rawData || []);
            } catch (err: any) {
                if (isMounted) setError(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [category]);

    return { data, loading, error };
};

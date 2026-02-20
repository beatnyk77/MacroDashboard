import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface IndiaLiquidityData {
    id: number;
    date: string;
    laf_net_injection_cr: number;
    repo_rate: number;
    msf_rate: number;
    call_rate: number;
    treps_rate: number;
}

export function useIndiaLiquidity() {
    const [data, setData] = useState<IndiaLiquidityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: dbData, error: dbError } = await supabase
                    .from('india_liquidity_stress')
                    .select('*')
                    .order('date', { ascending: true });

                if (dbError) throw dbError;

                if (dbData) {
                    setData(dbData);
                }
            } catch (err: any) {
                console.error('Error fetching India Liquidity Stress data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
}

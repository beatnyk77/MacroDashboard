import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface IndiaDebtMaturity {
    date: string;
    bucket: string;
    amount_crore: number;
    percent_total: number;
    type: 'central' | 'state';
}

export const useIndiaDebtMaturities = () => {
    const [data, setData] = useState<IndiaDebtMaturity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: maturities, error: supabaseError } = await supabase
                    .from('india_debt_maturities')
                    .select('*')
                    .order('date', { ascending: false });

                if (supabaseError) throw supabaseError;
                setData(maturities || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
};

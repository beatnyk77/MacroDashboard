import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface RBIFXData {
    id: number;
    date: string;
    fx_reserves_bn: number;
    forward_book_net_bn: number;
    reer_40: number;
    neer_40: number;
}

export function useRBIFXDefense() {
    const [data, setData] = useState<RBIFXData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchFXData = async () => {
            try {
                const { data: dbData, error: dbError } = await supabase
                    .from('rbi_fx_defense')
                    .select('*')
                    .order('date', { ascending: true }); // chronological

                if (dbError) throw dbError;

                if (dbData) {
                    setData(dbData);
                }
            } catch (err: any) {
                console.error('Error fetching RBI FX Defense data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchFXData();
    }, []);

    return { data, loading, error };
}

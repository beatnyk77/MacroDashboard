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
                    const parsedData = dbData.map((d: any) => ({
                        ...d,
                        fx_reserves_bn: d.fx_reserves_bn !== null ? Number(d.fx_reserves_bn) : null,
                        forward_book_net_bn: d.forward_book_net_bn !== null ? Number(d.forward_book_net_bn) : null,
                        reer_40: d.reer_40 !== null ? Number(d.reer_40) : null,
                        neer_40: d.neer_40 !== null ? Number(d.neer_40) : null
                    }));
                    setData(parsedData);
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

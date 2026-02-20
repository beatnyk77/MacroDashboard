import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface IndiaInflationData {
    id: number;
    date: string;
    cpi_headline_yoy: number;
    cpi_sticky_yoy: number;
    cpi_flexible_yoy: number;
    wpi_core_yoy: number;
}

export function useIndiaInflation() {
    const [data, setData] = useState<IndiaInflationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: dbData, error: dbError } = await supabase
                    .from('india_inflation_pulse')
                    .select('*')
                    .order('date', { ascending: true });

                if (dbError) throw dbError;

                if (dbData) {
                    setData(dbData);
                }
            } catch (err: any) {
                console.error('Error fetching India Inflation Pulse data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
}

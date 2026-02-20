import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface IndiaDigitizationData {
    id: number;
    date: string;
    upi_volume_bn: number;
    upi_value_inr_trillion: number;
    rbi_dpi_index: number;
    fi_index: number;
    g20_digital_baseline: number;
}

export function useIndiaDigitization() {
    const [data, setData] = useState<IndiaDigitizationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: dbData, error: dbError } = await supabase
                    .from('india_digitization_premium')
                    .select('*')
                    .order('date', { ascending: true });

                if (dbError) throw dbError;

                if (dbData) {
                    setData(dbData);
                }
            } catch (err: any) {
                console.error('Error fetching India Digitization data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
}

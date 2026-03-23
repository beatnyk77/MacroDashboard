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
                    const parsedData = dbData.map((d: any) => ({
                        ...d,
                        upi_volume_bn: d.upi_volume_bn !== null ? Number(d.upi_volume_bn) : null,
                        upi_value_inr_trillion: d.upi_value_inr_trillion !== null ? Number(d.upi_value_inr_trillion) : null,
                        rbi_dpi_index: d.rbi_dpi_index !== null ? Number(d.rbi_dpi_index) : null,
                        fi_index: d.fi_index !== null ? Number(d.fi_index) : null,
                        g20_digital_baseline: d.g20_digital_baseline !== null ? Number(d.g20_digital_baseline) : null
                    }));
                    setData(parsedData);
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

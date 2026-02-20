import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface StateFiscalHealthData {
    id: number;
    state_name: string;
    state_code: string;
    date: string;
    debt_to_gsdp: number;
    gfd_to_gsdp: number;
}

export function useStateFiscalHealth() {
    const [data, setData] = useState<StateFiscalHealthData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: dbData, error: dbError } = await supabase
                    .from('india_state_fiscal_health')
                    .select('*')
                    .order('state_name', { ascending: true });

                if (dbError) throw dbError;

                if (dbData) {
                    setData(dbData);
                }
            } catch (err: any) {
                console.error('Error fetching State Fiscal Health data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
}

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface CreditCycleData {
    date: string;
    credit_growth_yoy: number;
    deposit_growth_yoy: number;
    cd_ratio: number;
    phase: 'Recovery' | 'Expansion' | 'Downturn' | 'Repair';
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
                    setData(creditData);
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

    return { data, loading, error };
}

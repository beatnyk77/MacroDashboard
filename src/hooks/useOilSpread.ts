import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface OilSpreadRecord {
    id: string;
    date: string;
    front_price: number;
    next_price: number;
    spread: number;
    regime: 'OVERSUPPLY' | 'NORMAL' | 'TIGHTENING' | 'STRESSED' | 'EXTREME';
    change_1d: number;
    change_3d: number;
    metadata: any;
    created_at: string;
}

export const useOilSpread = () => {
    return useQuery({
        queryKey: ['oil_market_spread'],
        queryFn: async (): Promise<OilSpreadRecord[]> => {
            let { data, error } = await supabase
                .from('oil_market_spread')
                .select('*')
                .order('date', { ascending: false })
                .limit(100);

            if (error) {
                console.error('Error fetching oil market spread:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.log('No oil spread data found. Triggering ingestion edge function...');
                try {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                    
                    await fetch(`${supabaseUrl}/functions/v1/ingest-oil-spread`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                        }
                    });
                    
                    await new Promise(r => setTimeout(r, 2000));
                    
                    const { data: retryData } = await supabase
                        .from('oil_market_spread')
                        .select('*')
                        .order('date', { ascending: false })
                        .limit(100);
                        
                    if (retryData && retryData.length > 0) {
                        data = retryData;
                    }
                } catch (err) {
                    console.error('Auto-trigger failed:', err);
                }
            }

            return (data || []).map((d: any) => ({
                ...d,
                front_price: Number(d.front_price),
                next_price: Number(d.next_price),
                spread: Number(d.spread),
                change_1d: Number(d.change_1d),
                change_3d: Number(d.change_3d)
            }));
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};

export const useLatestOilSpread = () => {
    return useQuery({
        queryKey: ['oil_market_spread_latest'],
        queryFn: async (): Promise<OilSpreadRecord | null> => {
            let { data, error } = await supabase
                .from('oil_market_spread')
                .select('*')
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('Error fetching latest oil market spread:', error);
                throw error;
            }

            if (!data) {
                // Auto-trigger ingestion if table is empty
                console.log('No oil spread data found. Triggering ingestion edge function...');
                try {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                    
                    await fetch(`${supabaseUrl}/functions/v1/ingest-oil-spread`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                        }
                    });
                    
                    // Wait a moment for DB upsert
                    await new Promise(r => setTimeout(r, 2000));
                    
                    // Retry fetch
                    const { data: retryData } = await supabase
                        .from('oil_market_spread')
                        .select('*')
                        .order('date', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                        
                    if (!retryData) return null;
                    data = retryData;
                } catch (err) {
                    console.error('Auto-trigger failed:', err);
                    return null;
                }
            }

            return {
                ...data,
                front_price: Number(data.front_price),
                next_price: Number(data.next_price),
                spread: Number(data.spread),
                change_1d: Number(data.change_1d),
                change_3d: Number(data.change_3d)
            };
        },
        staleTime: 1000 * 60 * 30, // 30 mins
    });
};

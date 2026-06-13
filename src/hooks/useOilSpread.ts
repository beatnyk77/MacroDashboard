import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getStaleness } from './useStaleness';

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
    computed_at: string;
    is_stale?: boolean;
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

            const isStale = data && data.length > 0 ? getStaleness(data[0].computed_at, 'daily').state !== 'fresh' : true;

            if (!data || data.length === 0 || isStale) {
                console.log('Oil spread data missing or stale. Triggering ingestion edge function...');
                try {
                    await supabase.functions.invoke('ingest-oil-spread');
                    
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

            return (data || []).map((d: any) => {
                const staleness = getStaleness(d.computed_at, 'daily');
                return {
                    ...d,
                    front_price: Number(d.front_price),
                    next_price: Number(d.next_price),
                    spread: Number(d.spread),
                    change_1d: Number(d.change_1d),
                    change_3d: Number(d.change_3d),
                    is_stale: staleness.state !== 'fresh'
                };
            });
        },
        staleTime: 1000 * 60 * 15, // 15 mins (institutional grade needs tighter cache)
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

            const isStale = data ? getStaleness(data.computed_at, 'daily').state !== 'fresh' : true;

            if (!data || isStale) {
                console.log('Oil spread data missing or stale. Triggering ingestion edge function...');
                try {
                    await supabase.functions.invoke('ingest-oil-spread');
                    await new Promise(r => setTimeout(r, 2000));
                    const { data: retryData } = await supabase
                        .from('oil_market_spread')
                        .select('*')
                        .order('date', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                        
                    if (!retryData && !data) return null;
                    if (retryData) data = retryData;
                } catch (err) {
                    console.error('Auto-trigger failed:', err);
                    if (!data) return null;
                }
            }

            if (!data) return null;
            const staleness = getStaleness(data.computed_at ?? '', 'daily');
            return {
                ...data,
                front_price: Number(data.front_price),
                next_price: Number(data.next_price),
                spread: Number(data.spread),
                change_1d: Number(data.change_1d),
                change_3d: Number(data.change_3d),
                is_stale: staleness.state !== 'fresh'
            } as unknown as OilSpreadRecord; // TODO(types): nullable DB fields narrowed above
        },
        staleTime: 1000 * 60 * 5, // 5 mins
    });
};

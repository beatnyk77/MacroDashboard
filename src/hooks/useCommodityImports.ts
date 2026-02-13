import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CommodityImport {
    id: string;
    country: string;
    year: number;
    metal: string;
    value_usd: number;
    volume: number;
    volume_unit: string;
    top_partners_json: Array<{
        partner: string;
        share: number;
        value: number;
    }>;
    created_at: string;
}

export const useCommodityImports = () => {
    return useQuery({
        queryKey: ['commodity_imports'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('commodity_imports')
                .select('*')
                .order('year', { ascending: true });

            if (error) throw error;
            return data as CommodityImport[];
        }
    });
};

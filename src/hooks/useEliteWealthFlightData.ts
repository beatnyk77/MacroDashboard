import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface EliteWealthFlight {
    id: string;
    origin_country: string;
    haven_country: string;
    amount_usd_bn: number;
    flight_velocity_pct: number;
    year: number;
    source: string;
    created_at: string;
}

export const useEliteWealthFlightData = () => {
    return useQuery({
        queryKey: ['elite-wealth-flight'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('elite_wealth_flight')
                .select('*')
                .order('year', { ascending: true });

            if (error) throw error;
            return data as EliteWealthFlight[];
        }
    });
};

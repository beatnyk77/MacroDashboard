import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GeopoliticalOSINT {
    id: string;
    timestamp: string;
    type: 'jet' | 'vessel';
    callsign: string;
    mmsi?: string;
    lat: number;
    lng: number;
    owner_flag: string;
    route?: string;
    macro_correlation: string;
    metadata: any;
}

export const useGeopoliticalOSINT = () => {
    return useQuery({
        queryKey: ['geopolitical-osint'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('geopolitical_osint')
                .select('*')
                .order('timestamp', { ascending: false });

            if (error) throw error;
            return data as GeopoliticalOSINT[];
        },
        refetchInterval: 60000 // Refresh every minute
    });
};

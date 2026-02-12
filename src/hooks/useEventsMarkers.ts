import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface EventMarker {
    id: string;
    event_date: string;
    latitude: number;
    longitude: number;
    type: 'Conflict' | 'Protest' | 'Disruption';
    count: number;
    location_name: string;
    source: string;
}

export const useEventsMarkers = () => {
    return useQuery({
        queryKey: ['events_markers'],
        queryFn: async (): Promise<EventMarker[]> => {
            const { data, error } = await supabase
                .from('events_markers')
                .select('*')
                .order('event_date', { ascending: false })
                .limit(500);

            if (error) throw error;
            return data as EventMarker[];
        },
        staleTime: 1000 * 60 * 15, // 15 mins
    });
};

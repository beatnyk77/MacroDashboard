import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MacroEvent {
    id: string;
    event_date: string;
    event_name: string;
    country: string;
    impact_level: 'High' | 'Medium' | 'Low';
    forecast: string | null;
    previous: string | null;
    actual: string | null;
    surprise: string | null;
    surprise_direction: 'positive' | 'negative' | 'neutral';
    source_url: string;
}

export function useMacroEvents() {
    return useQuery({
        queryKey: ['macro-events'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_upcoming_events')
                .select('*');

            if (error) throw error;
            return data as MacroEvent[];
        },
    });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MacroEvent {
    event_date: string;
    event_name: string;
    consensus_value: string | null;
    previous_value: string | null;
    expected_value: string | null;
    actual_value: string | null;
    impact_level: 'high' | 'medium' | 'low';
    surprise_direction: 'positive' | 'negative' | 'neutral';
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

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PresidentialPolicy {
    id: string;
    president_name: string;
    event_name: string;
    event_date: string;
    category: string;
    policy_score: number;
    impact_notes: string;
    metadata: any;
}

export function usePresidentialPolicies() {
    return useQuery({
        queryKey: ['presidential-policies'],
        queryFn: async (): Promise<PresidentialPolicy[]> => {
            const { data, error } = await supabase
                .from('presidential_policies')
                .select('*')
                .order('event_date', { ascending: false });

            if (error || !data) {
                console.warn('Could not fetch presidential policies');
                return [];
            }

            return data;
        },
        staleTime: 1000 * 60 * 60 * 24, // 24h
    });
}

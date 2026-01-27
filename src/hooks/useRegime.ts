import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface RegimeData {
    id: string;
    regimeLabel: string;
    pulseScore: number;
    signalBreadth: number;
    timestamp: string;
}

export function useRegime() {
    return useQuery({
        queryKey: ['regime-latest'],
        queryFn: async (): Promise<RegimeData | null> => {
            const { data, error } = await supabase
                .from('regime_snapshots')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                console.warn('Could not fetch latest regime snapshot');
                return null;
            }

            return {
                id: data.id,
                regimeLabel: data.regime_label,
                pulseScore: Number(data.pulse_score),
                signalBreadth: Number(data.signal_breadth),
                timestamp: data.timestamp
            };
        },
        staleTime: 1000 * 60 * 15, // 15 min
    });
}

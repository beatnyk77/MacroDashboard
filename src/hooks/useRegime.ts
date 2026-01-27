import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface RegimeData {
    regime: string;
    pulseScore: number;
    signalBreadth: number;
    timestamp: string;
}

export function useRegime() {
    return useQuery({
        queryKey: ['regime_latest'],
        queryFn: async (): Promise<RegimeData | null> => {
            const { data, error } = await supabase
                .from('regime_snapshots')
                .select('regime_label, pulse_score, signal_breadth, timestamp')
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) return null;

            return {
                regime: data.regime_label,
                pulseScore: Number(data.pulse_score),
                signalBreadth: Number(data.signal_breadth),
                timestamp: data.timestamp
            };
        },
        staleTime: 1000 * 60 * 15, // 15 min
    });
}

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
                .from('vw_latest_daily_signal')
                .select('*')
                .limit(1)
                .maybeSingle();

            if (error || !data) {
                console.warn('Could not fetch latest daily macro signal for regime snapshot');
                return null;
            }

            // Map RISK_ON -> Expansion, RISK_OFF -> Tightening, NEUTRAL -> Neutral
            let regimeLabel = 'Neutral';
            if (data.regime === 'RISK_ON') {
                regimeLabel = 'Expansion';
            } else if (data.regime === 'RISK_OFF') {
                regimeLabel = 'Tightening';
            }

            return {
                id: data.signal_date ?? '', // Use signal_date as stable ID
                regimeLabel: regimeLabel,
                pulseScore: Number(data.score),
                signalBreadth: Number(data.confidence_pct),
                timestamp: data.computed_at ?? ''
            };
        },
        staleTime: 1000 * 60 * 15, // 15 min
    });
}

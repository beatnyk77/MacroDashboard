import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface TradeGravityPoint {
    swing_state_code: string;
    swing_state_name: string;
    bloc: 'BRICS+' | 'G7';
    period: string;
    trade_value_usd: number;
    trade_share_pct: number;
}

export interface SwingStateData {
    name: string;
    code: string;
    // lat/lng for map marker
    lat: number;
    lng: number;
    // Data by period: {period -> {BRICS+: share, G7: share}}
    byPeriod: Record<string, { 'BRICS+': number; G7: number }>;
    // Current (2023) gravity indicator
    currentBricsShare: number;
    currentG7Share: number;
    hasShifted: boolean; // BRICS+ > G7 in 2023
}

const STATE_GEO: Record<string, { lat: number; lng: number }> = {
    'India': { lat: 20.5937, lng: 78.9629 },
    'Brazil': { lat: -14.235, lng: -51.9253 },
    'Saudi Arabia': { lat: 23.8859, lng: 45.0792 },
    'Turkey': { lat: 38.9637, lng: 35.2433 },
    'Vietnam': { lat: 14.0583, lng: 108.2772 },
    'Indonesia': { lat: -0.7893, lng: 113.9213 },
    'Mexico': { lat: 23.6345, lng: -102.5528 },
    'South Africa': { lat: -30.5595, lng: 22.9375 },
};

export const useTradeGravityData = () => {
    const [swingStates, setSwingStates] = useState<SwingStateData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                const { data: rawData, error: dbError } = await supabase
                    .from('trade_gravity')
                    .select('*')
                    .order('swing_state_name');

                if (dbError) throw new Error(dbError.message);

                if (!rawData || !isMounted) return;

                // Group by swing_state_name
                const stateMap = new Map<string, TradeGravityPoint[]>();
                rawData.forEach((row: TradeGravityPoint) => {
                    const list = stateMap.get(row.swing_state_name) || [];
                    list.push(row);
                    stateMap.set(row.swing_state_name, list);
                });

                const result: SwingStateData[] = [];
                stateMap.forEach((rows, stateName) => {
                    const geo = STATE_GEO[stateName] || { lat: 0, lng: 0 };
                    const byPeriod: Record<string, { 'BRICS+': number; G7: number }> = {};

                    rows.forEach(r => {
                        if (!byPeriod[r.period]) byPeriod[r.period] = { 'BRICS+': 0, G7: 0 };
                        byPeriod[r.period][r.bloc] = Number(r.trade_share_pct);
                    });

                    const curr = byPeriod['2023'] || { 'BRICS+': 0, G7: 0 };

                    result.push({
                        name: stateName,
                        code: rows[0].swing_state_code,
                        lat: geo.lat,
                        lng: geo.lng,
                        byPeriod,
                        currentBricsShare: curr['BRICS+'],
                        currentG7Share: curr['G7'],
                        hasShifted: curr['BRICS+'] > curr['G7'],
                    });
                });

                if (isMounted) setSwingStates(result);
            } catch (err: any) {
                if (isMounted) setError(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, []);

    return { swingStates, loading, error };
};

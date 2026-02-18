import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface OffshoreDollarStress {
    as_of_date: string;
    ted_spread: number;
    sofr_ois_spread?: number;
    slope_bps: number;
    status: string;
}

export interface CreditPulse {
    country_code: string;
    as_of_date: string;
    current_stock: number;
    change_12m: number;
    impulse_z_score: number;
}

export interface GeopoliticalRisk {
    as_of_date: string;
    vix_z: number;
    move_z: number;
    gold_z: number;
    composite_z_score: number;
    history?: { date: string; value: number }[];
}

export function useInstitutionalFeatures() {
    const offshoreQuery = useSuspenseQuery({
        queryKey: ['offshore_dollar_stress'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_offshore_dollar_stress')
                .select('*')
                .order('as_of_date', { ascending: false })
                .limit(1)
                .single();
            if (error) throw error;
            return {
                as_of_date: data.as_of_date,
                ted_spread: Number(data.ted_spread || 0),
                sofr_ois_spread: data.sofr_ois_spread ? Number(data.sofr_ois_spread) : undefined,
                slope_bps: Number(data.slope_bps || 0),
                status: data.status
            } as OffshoreDollarStress;
        }
    });

    const creditQuery = useSuspenseQuery({
        queryKey: ['credit_creation_pulse'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_credit_creation_pulse')
                .select('*')
                .order('as_of_date', { ascending: false });
            if (error) throw error;

            // Group by country and get latest for each
            const latest = data.reduce((acc: any, curr) => {
                if (!acc[curr.country_code]) {
                    acc[curr.country_code] = {
                        ...curr,
                        current_stock: Number(curr.current_stock || 0),
                        change_12m: Number(curr.change_12m || 0),
                        impulse_z_score: Number(curr.impulse_z_score || 0)
                    };
                }
                return acc;
            }, {});

            return Object.values(latest) as CreditPulse[];
        }
    });

    const geoRiskQuery = useSuspenseQuery({
        queryKey: ['geopolitical_risk_index'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_geopolitical_risk_index')
                .select('*')
                .order('as_of_date', { ascending: false });
            if (error) throw error;

            const latest = data[0];
            const history = data.slice(0, 30).map(d => ({
                date: d.as_of_date,
                value: Number(d.composite_z_score || 0)
            })).reverse();

            return {
                as_of_date: latest.as_of_date,
                vix_z: Number(latest.vix_z || 0),
                move_z: Number(latest.move_z || 0),
                gold_z: Number(latest.gold_z || 0),
                composite_z_score: Number(latest.composite_z_score || 0),
                history
            } as GeopoliticalRisk;
        }
    });

    return {
        offshore: offshoreQuery,
        credit: creditQuery,
        geoRisk: geoRiskQuery
    };
}

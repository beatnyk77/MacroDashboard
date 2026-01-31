import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface OffshoreDollarStress {
    as_of_date: string;
    ted_spread: number;
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
    const offshoreQuery = useQuery({
        queryKey: ['offshore_dollar_stress'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_offshore_dollar_stress')
                .select('*')
                .order('as_of_date', { ascending: false })
                .limit(1)
                .single();
            if (error) throw error;
            return data as OffshoreDollarStress;
        }
    });

    const creditQuery = useQuery({
        queryKey: ['credit_creation_pulse'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_credit_creation_pulse')
                .select('*')
                .order('as_of_date', { ascending: false });
            if (error) throw error;

            // Group by country and get latest for each
            const latest = data.reduce((acc: any, curr) => {
                if (!acc[curr.country_code]) acc[curr.country_code] = curr;
                return acc;
            }, {});

            return Object.values(latest) as CreditPulse[];
        }
    });

    const geoRiskQuery = useQuery({
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
                value: d.composite_z_score
            })).reverse();

            return { ...latest, history } as GeopoliticalRisk;
        }
    });

    return {
        offshore: offshoreQuery,
        credit: creditQuery,
        geoRisk: geoRiskQuery
    };
}

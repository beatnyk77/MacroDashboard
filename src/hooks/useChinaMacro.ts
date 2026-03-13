import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type PBOCOpsRow = {
    date: string;
    mlf_rate: number;
    rrr_rate_large: number;
    reverse_repo_7d: number;
    m2_growth_yoy: number;
    tss_growth_yoy: number;
    net_liquidity_signal: number;
    regime_label: string;
    pboc_vs_fed_gap: number;
    source: string;
};

export type ChinaMacroPulseRow = {
    date: string;
    metric_id: string;
    value: number;
    unit: string;
    label: string;
    source: string;
};

export type ChinaEnergyGridRow = {
    year: number;
    coal_share_pct: number;
    renewables_share_pct: number;
    solar_share_pct: number;
    wind_share_pct: number;
    hydro_share_pct: number;
    nuclear_share_pct: number;
    carbon_intensity_gco2kwh: number;
    total_generation_twh: number;
    source: string;
};

export function usePBOCOps(limit = 24) {
    return useQuery<PBOCOpsRow[]>({
        queryKey: ['china_pboc_ops', limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('china_pboc_ops')
                .select('*')
                .order('date', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return (data ?? []) as PBOCOpsRow[];
        },
        staleTime: 4 * 60 * 60 * 1000,
        refetchInterval: 4 * 60 * 60 * 1000,
    });
}

export function useChinaMacroPulse(metricIds?: string[], limit = 24) {
    return useQuery<ChinaMacroPulseRow[]>({
        queryKey: ['china_macro_pulse', metricIds, limit],
        queryFn: async () => {
            let q = supabase
                .from('china_macro_pulse')
                .select('*')
                .order('date', { ascending: false })
                .limit(limit);
            if (metricIds && metricIds.length > 0) {
                q = q.in('metric_id', metricIds);
            }
            const { data, error } = await q;
            if (error) throw error;
            return (data ?? []) as ChinaMacroPulseRow[];
        },
        staleTime: 4 * 60 * 60 * 1000,
    });
}

export function useChinaEnergyGrid() {
    return useQuery<ChinaEnergyGridRow[]>({
        queryKey: ['china_energy_grid'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('china_energy_grid')
                .select('*')
                .order('year', { ascending: false })
                .limit(10);
            if (error) throw error;
            return (data ?? []) as ChinaEnergyGridRow[];
        },
        staleTime: 24 * 60 * 60 * 1000,
    });
}

/** Quick helper: get the latest row for a given metric_id */
export function useLatestChinaMetric(metricId: string) {
    return useQuery<ChinaMacroPulseRow | null>({
        queryKey: ['china_latest_metric', metricId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('china_macro_pulse')
                .select('*')
                .eq('metric_id', metricId)
                .order('date', { ascending: false })
                .limit(1)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data as ChinaMacroPulseRow | null;
        },
        staleTime: 4 * 60 * 60 * 1000,
    });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type ChinaDebtLayerCode =
    | 'central_official'
    | 'local_gov'
    | 'lgfv'
    | 'policy_bank'
    | 'soe_contingent'
    | 'consolidated';

export interface ChinaDebtLayer {
    as_of_date: string;
    layer_code: ChinaDebtLayerCode;
    value_pct_gdp: number | null;
    value_low_pct_gdp: number | null;
    value_high_pct_gdp: number | null;
    source: string;
    source_ref: string | null;
    is_provisional: boolean | null;
    provenance: Record<string, unknown> | null;
    updated_at: string | null;
}

export interface ChinaDebtComposite {
    composite_id: string;
    as_of_date: string;
    value: number;
    components: Record<string, number | null> | null;
    formula: string | null;
    updated_at: string | null;
}

export const LAYER_META: Record<ChinaDebtLayerCode, { label: string; aboveWater: boolean; color: string }> = {
    central_official: { label: 'Central Government', aboveWater: true, color: '#3b82f6' },
    local_gov:        { label: 'Local Government (Explicit)', aboveWater: true, color: '#60a5fa' },
    lgfv:             { label: 'LGFV (Implicit LG)', aboveWater: false, color: '#f59e0b' },
    policy_bank:      { label: 'Policy Banks', aboveWater: false, color: '#a855f7' },
    soe_contingent:   { label: 'SOE Contingent Liability', aboveWater: false, color: '#ef4444' },
    consolidated:     { label: 'Consolidated Public Sector', aboveWater: false, color: '#f97316' },
};

export function useChinaDebtLayers() {
    return useQuery({
        queryKey: ['china-debt-layers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('china_debt_layers')
                .select('*')
                .order('as_of_date', { ascending: true });

            if (error) throw error;
            return data as ChinaDebtLayer[];
        },
        staleTime: 1000 * 60 * 60 * 2,
        refetchOnWindowFocus: false,
    });
}

export function useChinaDebtComposites() {
    return useQuery({
        queryKey: ['china-debt-composites'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('china_debt_composites')
                .select('*')
                .order('as_of_date', { ascending: false });

            if (error) throw error;
            return data as ChinaDebtComposite[];
        },
        staleTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
    });
}

/** Latest snapshot per layer code */
export function useLatestChinaDebtLayers() {
    const { data, ...rest } = useChinaDebtLayers();
    const latestByLayer = data?.reduce<Record<string, ChinaDebtLayer>>((acc, row) => {
        const existing = acc[row.layer_code];
        if (!existing || row.as_of_date > existing.as_of_date) {
            acc[row.layer_code] = row;
        }
        return acc;
    }, {}) ?? {};
    return { data: latestByLayer, layers: data, ...rest };
}

/** Latest value per composite */
export function useLatestChinaDebtComposites() {
    const { data, ...rest } = useChinaDebtComposites();
    const latestById = data?.reduce<Record<string, ChinaDebtComposite>>((acc, row) => {
        if (!acc[row.composite_id]) acc[row.composite_id] = row;
        return acc;
    }, {}) ?? {};
    return { data: latestById, composites: data, ...rest };
}
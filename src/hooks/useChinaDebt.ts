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

export interface ChinaProvincialFiscalStress {
    province_code: string;
    province_name: string;
    as_of_date: string;
    land_revenue_decline_pct: number | null;
    debt_to_fiscal_revenue_pct: number | null;
    gdp_growth_deviation_pp: number | null;
    lgfv_concentration_score: number | null;
    special_bond_accel_score: number | null;
    composite_stress_score: number | null;
    watchlist_flag: boolean | null;
    risk_profile: string | null;
    source: string;
    source_ref: string | null;
    updated_at: string | null;
}

export interface ChinaFiscalSignal {
    as_of_date: string;
    signal_key: string;
    value: number;
    value_low: number | null;
    value_high: number | null;
    unit: string | null;
    source: string;
    source_ref: string | null;
    is_provisional: boolean | null;
    updated_at: string | null;
}

export function useChinaProvincialStress() {
    return useQuery({
        queryKey: ['china-provincial-fiscal-stress'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('china_provincial_fiscal_stress')
                .select('*')
                .order('composite_stress_score', { ascending: false });

            if (error) throw error;
            return data as ChinaProvincialFiscalStress[];
        },
        staleTime: 1000 * 60 * 60 * 2,
        refetchOnWindowFocus: false,
    });
}

export function useChinaFiscalSignals(signalKeys?: string[]) {
    return useQuery({
        queryKey: ['china-fiscal-signals', signalKeys],
        queryFn: async () => {
            let q = supabase
                .from('china_fiscal_signals')
                .select('*')
                .order('as_of_date', { ascending: true });
            if (signalKeys?.length) q = q.in('signal_key', signalKeys);
            const { data, error } = await q;
            if (error) throw error;
            return data as ChinaFiscalSignal[];
        },
        staleTime: 1000 * 60 * 60 * 2,
        refetchOnWindowFocus: false,
    });
}

/** Latest value per signal key */
export function useLatestChinaFiscalSignals(signalKeys?: string[]) {
    const { data, ...rest } = useChinaFiscalSignals(signalKeys);
    const latestByKey = data?.reduce<Record<string, ChinaFiscalSignal>>((acc, row) => {
        const existing = acc[row.signal_key];
        if (!existing || row.as_of_date > existing.as_of_date) {
            acc[row.signal_key] = row;
        }
        return acc;
    }, {}) ?? {};
    return { data: latestByKey, signals: data, ...rest };
}

export interface ChinaPolicyBank {
    as_of_date: string;
    institution_code: string;
    institution_name: string;
    bonds_outstanding_cny_tn: number | null;
    bonds_low_cny_tn: number | null;
    bonds_high_cny_tn: number | null;
    pct_total_bond_market: number | null;
    spread_vs_cgb_bps: number | null;
    yoy_growth_pct: number | null;
    source: string;
    source_ref: string | null;
    is_provisional: boolean | null;
    updated_at: string | null;
}

export interface ChinaSOEScenario {
    as_of_date: string;
    scenario_code: string;
    scenario_label: string;
    soe_debt_pct_gdp: number | null;
    crystallization_rate_pct: number | null;
    contingent_liability_pct_gdp: number | null;
    consolidated_debt_outcome_pct: number | null;
    probability_weight_pct: number | null;
    assumptions: string | null;
    source: string;
    source_ref: string | null;
    updated_at: string | null;
}

export interface ChinaBRIExposure {
    as_of_date: string;
    country_or_region: string;
    iso3: string | null;
    lending_outstanding_bn: number | null;
    lending_low_bn: number | null;
    lending_high_bn: number | null;
    distress_flag: boolean | null;
    restructuring_status: string | null;
    sector: string | null;
    source: string;
    source_ref: string | null;
    updated_at: string | null;
}

export function useChinaPolicyBanks() {
    return useQuery({
        queryKey: ['china-policy-banks'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('china_policy_banks')
                .select('*')
                .order('as_of_date', { ascending: true });
            if (error) throw error;
            return data as ChinaPolicyBank[];
        },
        staleTime: 1000 * 60 * 60 * 2,
        refetchOnWindowFocus: false,
    });
}

export function useChinaSOEScenarios() {
    return useQuery({
        queryKey: ['china-soe-scenarios'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('china_soe_scenarios')
                .select('*')
                .order('probability_weight_pct', { ascending: false });
            if (error) throw error;
            return data as ChinaSOEScenario[];
        },
        staleTime: 1000 * 60 * 60 * 2,
        refetchOnWindowFocus: false,
    });
}

export function useChinaBRIExposure() {
    return useQuery({
        queryKey: ['china-bri-exposure'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('china_bri_exposure')
                .select('*')
                .order('lending_outstanding_bn', { ascending: false });
            if (error) throw error;
            return data as ChinaBRIExposure[];
        },
        staleTime: 1000 * 60 * 60 * 2,
        refetchOnWindowFocus: false,
    });
}
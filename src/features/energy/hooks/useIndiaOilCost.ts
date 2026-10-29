import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export interface IndiaOilCost {
    inrPerBarrel: number;
    asOfDate: string;
    brentUsd: number | null;
    brentDate: string | null;
    usdInr: number | null;
    usdInrDate: string | null;
    sourceRef: string | null;
}

interface IndiaOilCostMetadata {
    brent_usd?: number;
    brent_date?: string;
    usd_inr?: number;
    usd_inr_date?: string;
}

/** Latest rupee cost of a barrel, with the two inputs it was computed from. null when no row exists. */
export const useIndiaOilCost = () =>
    useQuery({
        queryKey: ['india-oil-cost', MID.IN_OIL_IMPORT_COST_INR_BBL],
        queryFn: async (): Promise<IndiaOilCost | null> => {
            const { data, error } = await supabase
                .from('metric_observations')
                .select('as_of_date, value, source_ref, metadata')
                .eq('metric_id', MID.IN_OIL_IMPORT_COST_INR_BBL)
                .order('as_of_date', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (error) throw error;
            if (!data) return null;
            const meta = (data.metadata ?? {}) as IndiaOilCostMetadata;
            return {
                inrPerBarrel: Number(data.value),
                asOfDate: String(data.as_of_date),
                brentUsd: meta.brent_usd ?? null,
                brentDate: meta.brent_date ?? null,
                usdInr: meta.usd_inr ?? null,
                usdInrDate: meta.usd_inr_date ?? null,
                sourceRef: data.source_ref ?? null,
            };
        },
        staleTime: 1000 * 60 * 30,
    });

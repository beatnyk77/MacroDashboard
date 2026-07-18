import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TrafficPageRow {
    path: string;
    views?: number;
    entries?: number;
    exits?: number;
}

export interface EngagementTrendRow {
    day: string;
    avg_seconds: number | null;
    sessions: number;
}

export interface GscTrendRow {
    date: string;
    impressions: number;
    clicks: number;
}

export interface CountryRow {
    country: string;
    impressions: number;
    clicks: number;
}

export interface GscPageRow {
    page: string;
    impressions: number;
    clicks: number;
}

export interface TrafficIntelligenceSummary {
    period_days: number;
    generated_at: string;
    gsc_connected: boolean;
    gsc_last_date: string | null;
    active_users_7d: number;
    active_users_28d: number;
    page_views_7d: number;
    page_views_28d: number;
    avg_engagement_seconds_7d: number | null;
    top_pages: TrafficPageRow[];
    entry_pages: TrafficPageRow[];
    exit_pages: TrafficPageRow[];
    engagement_trend: EngagementTrendRow[];
    gsc_organic: {
        impressions_7d: number;
        clicks_7d: number;
        impressions_28d: number;
        clicks_28d: number;
        ctr_7d: number;
        trend: GscTrendRow[];
    };
    top_countries: CountryRow[];
    top_gsc_pages: GscPageRow[];
}

export function useTrafficIntelligence(days = 28, enabled = true) {
    return useQuery({
        queryKey: ['admin', 'traffic_intelligence', days],
        queryFn: async (): Promise<TrafficIntelligenceSummary | null> => {
            const { data, error } = await supabase.rpc('get_traffic_intelligence_summary', {
                p_days: days,
            });
            // RPC is service_role-only (2026-07-19); client anon key cannot call it.
            if (error) {
                console.warn('[useTrafficIntelligence] RPC unavailable:', error.message);
                return null;
            }
            return data as unknown as TrafficIntelligenceSummary;
        },
        enabled,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MacroHeadline {
    id: number;
    title: string;
    link: string;
    source: string;
    published_at: string;
    ingested_at: string;
    keywords: string[];
    category: 'India' | 'Global' | null;
}

/** Compute staleness — >48h is stale */
export function isHeadlineStale(publishedAt: string): boolean {
    const diff = Date.now() - new Date(publishedAt).getTime();
    return diff > 48 * 60 * 60 * 1000;
}

/** Relative time label */
export function timeAgo(dateStr: string): string {
    const ms = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(ms / (1000 * 60 * 60));
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export const useMacroHeadlines = (category?: 'India' | 'Global') => {
    return useQuery<MacroHeadline[]>({
        queryKey: ['macro-headlines', category],
        queryFn: async () => {
            let query = supabase
                .from('macro_news_headlines')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(15);

            if (category) {
                query = query.eq('category', category);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        refetchInterval: 1000 * 60 * 2, // 2 minutes
        staleTime: 1000 * 60 * 1, // 1 minute
    });
};

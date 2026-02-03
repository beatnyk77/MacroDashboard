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
}

export const useMacroHeadlines = () => {
    return useQuery<MacroHeadline[]>({
        queryKey: ['macro-headlines'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('macro_news_headlines')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            return data || [];
        },
        refetchInterval: 1000 * 60 * 30, // 30 minutes
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

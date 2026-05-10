import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Digest {
    id: string;
    year_month: string;
    html_content: string;
    plain_text: string;
    subject_line: string;
    created_at: string;
}

export function useRegimeDigest(year?: string, month?: string) {
    const queryClient = useQueryClient();
    const targetYM = year && month ? `${year}-${month}` : null;

    const query = useQuery({
        queryKey: ['regime-digest', targetYM],
        queryFn: async () => {
            let q = supabase
                .from('monthly_regime_digests')
                .select('*');

            if (targetYM) {
                q = q.eq('year_month', targetYM);
            } else {
                q = q.order('year_month', { ascending: false }).limit(1);
            }

            const { data, error } = await q.maybeSingle();

            if (error) throw error;
            return data as Digest | null;
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    const regenerateMutation = useMutation({
        mutationFn: async (yearMonth?: string) => {
            const { data, error } = await supabase.functions.invoke('generate-monthly-regime-digest', {
                body: { year_month: yearMonth }
            });

            if (error) throw error;
            if (data.success === false) throw new Error(data.error || 'Failed to generate digest');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regime-digest'] });
            queryClient.invalidateQueries({ queryKey: ['ingestion-health'] });
        },
    });

    return {
        ...query,
        regenerate: regenerateMutation.mutate,
        isRegenerating: regenerateMutation.isPending,
        regenerationError: regenerateMutation.error,
    };
}

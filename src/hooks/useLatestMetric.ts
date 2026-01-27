import { useQuery } from '@tanstack/react-query';
// import { supabase } from '@/lib/supabase';

export interface MetricData {
    value: number;
    delta: number;
    deltaPeriod: string;
    history: { date: string; value: number }[];
    status: 'safe' | 'warning' | 'danger' | 'neutral';
}

const STUB_DATA: Record<string, MetricData> = {
    'regime': { value: 0.8, delta: 0.1, deltaPeriod: 'MoM', history: [{ date: '2023-01', value: 0.5 }, { date: '2023-02', value: 0.6 }, { date: '2023-03', value: 0.8 }], status: 'warning' },
    'pulse': { value: 52.4, delta: 1.2, deltaPeriod: 'MoM', history: Array.from({ length: 12 }, (_, i) => ({ date: `2023-${i + 1}`, value: 50 + Math.random() * 5 })), status: 'safe' },
    'breadth': { value: 65, delta: -2.5, deltaPeriod: 'WoW', history: Array.from({ length: 12 }, (_, i) => ({ date: `2023-${i + 1}`, value: 60 + Math.random() * 10 })), status: 'neutral' },
    'm2': { value: 20.8, delta: -0.5, deltaPeriod: 'YoY', history: Array.from({ length: 12 }, (_, i) => ({ date: `2023-${i + 1}`, value: 21 - i * 0.1 })), status: 'danger' },
    'gold_reserves': { value: 12.5, delta: 5.2, deltaPeriod: 'YoY', history: Array.from({ length: 12 }, (_, i) => ({ date: `2023-${i + 1}`, value: 10 + i * 0.2 })), status: 'safe' },
    'net_supply': { value: 850, delta: 120, deltaPeriod: 'QoQ', history: Array.from({ length: 6 }, (_, i) => ({ date: `2023-Q${i + 1}`, value: 700 + i * 50 })), status: 'warning' },
    'gold_silver': { value: 85.2, delta: 1.8, deltaPeriod: 'WoW', history: Array.from({ length: 20 }, (_, i) => ({ date: `2023-W${i + 1}`, value: 80 + Math.random() * 10 })), status: 'neutral' },
    'gold_oil': { value: 24.5, delta: -0.5, deltaPeriod: 'WoW', history: Array.from({ length: 20 }, (_, i) => ({ date: `2023-W${i + 1}`, value: 25 + Math.random() * 2 })), status: 'neutral' },
};

export function useLatestMetric(metricId: string) {
    return useQuery({
        queryKey: ['metric', metricId],
        queryFn: async () => {
            // Try to fetch from Supabase
            // In a real scenario, we would have a 'metrics' table
            // const { data, error } = await supabase
            //   .from('metrics')
            //   .select('*')
            //   .eq('metric_id', metricId)
            //   .limit(1)
            //   .single();

            // if (data) return data;

            // Fallback to stub data
            return new Promise<MetricData>((resolve) => {
                setTimeout(() => {
                    resolve(STUB_DATA[metricId] || {
                        value: 0,
                        delta: 0,
                        deltaPeriod: '-',
                        history: [],
                        status: 'neutral'
                    });
                }, 500);
            });
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

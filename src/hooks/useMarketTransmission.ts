import { useQuery } from '@tanstack/react-query';
import { fetchMarketOverview, MarketTransmissionOverview } from '@/services/marketTransmissionApi';

export function useMarketTransmission(tenYearYield?: number) {
    return useQuery<MarketTransmissionOverview>({
        queryKey: ['market-transmission', 'overview', tenYearYield ?? 'default'],
        queryFn: () => fetchMarketOverview({ tenYearYield }),
        staleTime: 1000 * 60 * 15, // 15 minutes TTL matches backend cache
        gcTime: 1000 * 60 * 60,    // 1 hour
        refetchOnWindowFocus: false,
    });
}

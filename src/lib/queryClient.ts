import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 30, // 30 minutes standard (reduced from 1 hour for fresher data)
            retry: 1,
            refetchOnWindowFocus: false,
            // cacheTime: 1000 * 60 * 60 * 2, // TODO: Verify correct property name for v5; may be `gcTime`
        },
    },
});

// Per-use-case overrides (apply in individual queries as needed):
// - Real-time data (market pulse): staleTime: 60_000 (1 min)
// - Daily metrics: default 30 min ✅
// - Static reference (glossary): staleTime: 3_600_000 (1 hour)

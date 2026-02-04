import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to manage auto-refresh of dashboard data.
 * Provides a countdown and triggers QueryClient invalidation.
 */
export function useAutoRefresh(intervalMs: number = 60000) {
    const queryClient = useQueryClient();
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [nextRefresh, setNextRefresh] = useState(intervalMs / 1000);

    useEffect(() => {
        // Countdown timer (runs every second)
        const countdownInterval = setInterval(() => {
            setNextRefresh(prev => {
                if (prev <= 1) return intervalMs / 1000;
                return prev - 1;
            });
        }, 1000);

        // Data refresh trigger
        const refreshInterval = setInterval(() => {
            console.log('[AutoRefresh] Invaliding queries...');
            setLastRefresh(new Date());
            queryClient.invalidateQueries();
        }, intervalMs);

        return () => {
            clearInterval(countdownInterval);
            clearInterval(refreshInterval);
        };
    }, [intervalMs, queryClient]);

    return {
        lastRefresh,
        nextRefresh,
        formattedNextRefresh: `${Math.floor(nextRefresh)}s`
    };
}

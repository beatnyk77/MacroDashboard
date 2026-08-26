import { useEffect, useState } from 'react';

const STORAGE_KEY = 'graphiquestor.desk-watchlist.v1';

function readWatchlist(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
        return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
    } catch {
        return [];
    }
}

export function useDeskWatchlist() {
    const [watchlist, setWatchlist] = useState<string[]>(readWatchlist);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
        } catch {
            // Private browsing and storage-disabled environments remain usable.
        }
    }, [watchlist]);

    const toggle = (metricId: string) => {
        setWatchlist((current) => current.includes(metricId)
            ? current.filter((item) => item !== metricId)
            : [...current, metricId]);
    };

    return { watchlist, toggle };
}

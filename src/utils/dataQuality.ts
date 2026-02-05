export type DataQuality = 'fresh' | 'delayed' | 'stale';

/**
 * Determine data quality based on timestamp age
 * - Fresh: < 24 hours (green)
 * - Delayed: 24h - 7 days (yellow) 
 * - Stale: > 7 days or null (red)
 */
export const getDataQuality = (timestamp: Date | string | null): DataQuality => {
    if (!timestamp) return 'stale';

    const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (!dateObj || isNaN(dateObj.getTime())) return 'stale';

    const ageHours = (Date.now() - dateObj.getTime()) / (1000 * 60 * 60);

    if (ageHours < 24) return 'fresh';
    if (ageHours < 168) return 'delayed'; // 7 days
    return 'stale';
};

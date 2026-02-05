import { FreshnessStatus } from '@/components/FreshnessChip';

/**
 * Calculates staleness state and time label based on last updated timestamp and frequency.
 * Consistent with institutional grade data integrity monitoring.
 */
export const getStaleness = (
    lastUpdated?: string | Date | null,
    frequency?: string
): { state: FreshnessStatus; label: string } => {
    if (!lastUpdated) return { state: 'no_data', label: 'No data' };

    const updateDate = new Date(lastUpdated);
    const now = new Date();

    // Guard against invalid dates
    if (isNaN(updateDate.getTime())) return { state: 'no_data', label: 'Invalid date' };

    const diffMs = now.getTime() - updateDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let timeLabel = '';
    if (diffHours < 1) {
        const min = Math.floor(diffMs / (1000 * 60));
        timeLabel = min <= 1 ? 'Just now' : `${min}m ago`;
    } else if (diffHours < 24) {
        timeLabel = `${Math.floor(diffHours)}h ago`;
    } else {
        timeLabel = `${Math.floor(diffHours / 24)}d ago`;
    }

    // Institutional logic for expected update windows
    const freq = frequency?.toLowerCase() || 'daily';
    let expectedHours = 48; // Default daily fallback (allowing for weekends)

    if (freq.includes('monthly')) expectedHours = 31 * 24;
    else if (freq.includes('quarterly')) expectedHours = 92 * 24;
    else if (freq.includes('weekly')) expectedHours = 7 * 24 + 48; // 7 days + weekend grace
    else if (freq.includes('realtime') || freq.includes('intra')) expectedHours = 4;

    if (diffHours > expectedHours * 3) return { state: 'overdue', label: timeLabel };
    if (diffHours > expectedHours * 1.5) return { state: 'stale', label: timeLabel };
    if (diffHours > expectedHours) return { state: 'lagged', label: timeLabel };

    return { state: 'fresh', label: timeLabel };
};

/**
 * Hook version of getStaleness for reactive updates if needed.
 * Currently just a wrapper around the pure function.
 */
export const useStaleness = (
    lastUpdated?: string | Date | null,
    frequency?: string
) => {
    return getStaleness(lastUpdated, frequency);
};

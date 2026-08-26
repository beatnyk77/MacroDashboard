export interface ResolvedMetricDelta {
    value: number;
    period: string;
    trend: 'up' | 'down' | 'neutral';
}

/** Resolve the most meaningful available comparison without treating zero as missing. */
export function resolveMetricDelta(
    deltaMom: number | null | undefined,
    deltaWow: number | null | undefined,
    frequency?: string | null,
): ResolvedMetricDelta {
    const preferWeekly = frequency?.toLowerCase() === 'daily' || frequency?.toLowerCase() === 'weekly';
    const primary = preferWeekly ? deltaWow : deltaMom;
    const secondary = preferWeekly ? deltaMom : deltaWow;
    const value = primary ?? secondary ?? 0;
    const period = primary !== null && primary !== undefined
        ? (preferWeekly ? 'WoW' : 'MoM')
        : (preferWeekly ? 'MoM' : 'WoW');

    return { value, period, trend: value > 0 ? 'up' : value < 0 ? 'down' : 'neutral' };
}

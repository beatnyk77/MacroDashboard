/**
 * A metric is either genuinely absent (`no-data`) or present and either
 * within tolerance (`safe`) or outside it (`warning`). Never coerce a
 * missing value into `warning`/`safe` via `?? 0` — that renders a fabricated
 * status for data that was never observed.
 */
export type DataStatus = 'safe' | 'warning' | 'no-data';

export function statusFromThreshold(
    value: number | null | undefined,
    isSafe: (v: number) => boolean,
): DataStatus {
    if (value === null || value === undefined) return 'no-data';
    return isSafe(value) ? 'safe' : 'warning';
}

export const STATUS_DOT_CLASS: Record<DataStatus, string> = {
    safe: 'bg-emerald-500',
    warning: 'bg-amber-500',
    'no-data': 'bg-white/15',
};

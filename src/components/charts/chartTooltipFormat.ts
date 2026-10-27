const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ISO_DATE = /^(\d{4})-(\d{2})(?:-(\d{2}))?(?:$|T)/;

/**
 * Formats ISO dates ("2026-10-27", "2026-10", "2026-10-27T00:00:00Z") as "27 Oct 2026" / "Oct 2026".
 * Parsed from the string, never through Date, so the displayed day cannot shift with the viewer's timezone.
 * Anything else is returned unchanged.
 */
export const formatTooltipLabel = (label: unknown): string => {
    if (label === null || label === undefined) return '';
    if (typeof label !== 'string') return String(label);
    const match = ISO_DATE.exec(label);
    if (!match) return label;
    const month = MONTHS[Number(match[2]) - 1];
    if (!month) return label;
    return match[3] ? `${Number(match[3])} ${month} ${match[1]}` : `${month} ${match[1]}`;
};

export const formatTooltipValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return '—';
        return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    return String(value);
};

/** Terminal-contract tooltip class tokens, shared by TerminalChartTooltip and bespoke tooltips. */
export const TOOLTIP_SHELL_CLASS =
    'rounded-lg border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-md';
export const TOOLTIP_LABEL_CLASS = 'mb-1 font-mono text-[11px] uppercase tracking-wider text-slate-400';
export const TOOLTIP_NAME_CLASS = 'text-xs text-slate-400';
export const TOOLTIP_VALUE_CLASS = 'font-mono text-xs font-semibold tabular-nums text-slate-100';

/** valueFormatter factory: fixed decimals with an optional unit, e.g. fixed(1, '%') -> "4.2%". */
export const fixed =
    (digits: number, suffix = '') =>
    (value: unknown): string =>
        typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : '—';

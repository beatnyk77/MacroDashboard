import React from 'react';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType, Payload } from 'recharts/types/component/DefaultTooltipContent';
import { cn } from '@/lib/utils';
import {
    formatTooltipLabel,
    formatTooltipValue,
    TOOLTIP_LABEL_CLASS,
    TOOLTIP_NAME_CLASS,
    TOOLTIP_SHELL_CLASS,
    TOOLTIP_VALUE_CLASS,
} from './chartTooltipFormat';

type Item = Payload<ValueType, NameType>;

export interface TerminalChartTooltipProps extends TooltipProps<ValueType, NameType> {
    /** Overrides the default date/number label formatting. */
    labelFormatter?: (label: unknown) => React.ReactNode;
    /** Formats each series value; return a string, or [value, displayName] to rename the series. */
    valueFormatter?: (value: ValueType, name: string, item: Item) => string | [string, string];
    /** Drops series whose value is null/undefined (e.g. gaps in sparse series). Default true. */
    hideEmpty?: boolean;
    className?: string;
}

/** Container for bespoke tooltips that need custom rows but the contract look. */
export const TerminalTooltipShell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div role="tooltip" className={cn(TOOLTIP_SHELL_CLASS, 'min-w-[140px] max-w-[320px]', className)}>
        {children}
    </div>
);

export const TerminalTooltipLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn(TOOLTIP_LABEL_CLASS, className)}>{children}</div>
);

/** One label/value line. `swatch` renders a series dot; `valueClassName` can carry a signal colour. */
export const TerminalTooltipRow: React.FC<{
    label: React.ReactNode;
    children: React.ReactNode;
    swatch?: string;
    valueClassName?: string;
    className?: string;
}> = ({ label, children, swatch, valueClassName, className }) => (
    <div className={cn('flex items-center justify-between gap-4', className)}>
        <span className={cn('flex min-w-0 items-center gap-1.5', TOOLTIP_NAME_CLASS)}>
            {swatch && (
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: swatch }} />
            )}
            <span className="truncate">{label}</span>
        </span>
        <span className={cn(TOOLTIP_VALUE_CLASS, valueClassName)}>{children}</span>
    </div>
);

/**
 * Terminal-contract tooltip for Recharts: `<Tooltip content={<TerminalChartTooltip />} />`.
 * Glassmorphic container, uppercase mono label, tabular-nums mono values.
 */
export const TerminalChartTooltip: React.FC<TerminalChartTooltipProps> = ({
    active,
    payload,
    label,
    labelFormatter,
    valueFormatter,
    hideEmpty = true,
    className,
}) => {
    if (!active || !payload?.length) return null;

    const rows = payload.filter((item) => !hideEmpty || (item.value !== null && item.value !== undefined));
    if (!rows.length) return null;

    const heading = labelFormatter
        ? labelFormatter(label)
        : formatTooltipLabel(label) || (payload.length === 1 ? String(payload[0].name ?? '') : '');

    return (
        <div
            role="tooltip"
            className={cn('min-w-[140px] max-w-[320px]', TOOLTIP_SHELL_CLASS, className)}
        >
            {heading !== '' && (
                <div className={TOOLTIP_LABEL_CLASS}>{heading}</div>
            )}
            <ul className="m-0 list-none space-y-1 p-0">
                {rows.map((item, index) => {
                    const rawName = String(item.name ?? item.dataKey ?? '');
                    const formatted = valueFormatter
                        ? valueFormatter(item.value as ValueType, rawName, item)
                        : formatTooltipValue(item.value);
                    const [display, name] = Array.isArray(formatted) ? formatted : [formatted, rawName];
                    const swatch = item.color ?? item.stroke ?? (item.payload as { fill?: string } | undefined)?.fill;
                    return (
                        <li key={`${rawName}-${index}`} className="flex items-center justify-between gap-4">
                            <span className={cn('flex min-w-0 items-center gap-1.5', TOOLTIP_NAME_CLASS)}>
                                <span
                                    aria-hidden="true"
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: swatch }}
                                />
                                <span className="truncate">{name}</span>
                            </span>
                            <span className={TOOLTIP_VALUE_CLASS}>{display}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

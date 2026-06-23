import React from 'react';
import { ChevronDown, ChevronUp, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataStatePanel } from '@/components/DataStatePanel';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export type InstitutionalColumn<T> = {
    id: string;
    header: React.ReactNode;
    align?: 'left' | 'right' | 'center';
    sortable?: boolean;
    className?: string;
    cell: (row: T, index: number) => React.ReactNode;
};

export type InstitutionalTableProps<T> = {
    data: T[];
    columns: InstitutionalColumn<T>[];
    getRowKey: (row: T) => string;

    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    emptyTitle?: string;
    emptyDescription?: string;

    density?: 'compact' | 'default';
    stickyHeader?: boolean;
    maxHeight?: number | string;
    className?: string;

    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (columnId: string) => void;
    selectedRowKey?: string;
    onRowClick?: (row: T) => void;
    getRowClassName?: (row: T) => string;

    caption?: React.ReactNode;
    footer?: React.ReactNode;
};

const ALIGN_CLASS: Record<NonNullable<InstitutionalColumn<unknown>['align']>, string> = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
};

const DENSITY_CELL: Record<NonNullable<InstitutionalTableProps<unknown>['density']>, string> = {
    compact: 'py-3 px-4',
    default: 'py-4 px-4',
};

const SKELETON_WIDTHS = ['w-[88%]', 'w-[72%]', 'w-[94%]', 'w-[65%]', 'w-[80%]'];

function TableLoadingSkeleton({ density }: { density: 'compact' | 'default' }) {
    const cellPadding = DENSITY_CELL[density];

    return (
        <div className="divide-y divide-white/5" aria-hidden="true">
            {SKELETON_WIDTHS.map((width, rowIndex) => (
                <div key={rowIndex} className={cn('flex items-center gap-4', cellPadding)}>
                    <div className={cn('h-3 rounded-full bg-white/5 animate-pulse', width)} />
                    <div className="h-3 w-16 rounded-full bg-white/5 animate-pulse ml-auto" />
                </div>
            ))}
        </div>
    );
}

export function InstitutionalTable<T>({
    data,
    columns,
    getRowKey,
    isLoading = false,
    error = null,
    onRetry,
    emptyTitle = 'No data available',
    emptyDescription = 'Observations for this module are not yet populated.',
    density = 'compact',
    stickyHeader = true,
    maxHeight,
    className,
    sortKey,
    sortDirection = 'desc',
    onSort,
    selectedRowKey,
    onRowClick,
    getRowClassName,
    caption,
    footer,
}: InstitutionalTableProps<T>) {
    const cellPadding = DENSITY_CELL[density];
    const headerClass = cn(
        'label-mono bg-transparent',
        stickyHeader && 'sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md'
    );

    const containerStyle = maxHeight ? { maxHeight } : undefined;

    const renderStatePanel = (variant: 'empty' | 'error', title: string, description?: string) => (
        <DataStatePanel
            variant={variant}
            title={title}
            description={description}
            onRetry={variant === 'error' ? onRetry : undefined}
            height={200}
            accentColor={variant === 'error' ? 'rose' : 'blue'}
        />
    );

    return (
        <div
            className={cn(
                'w-full rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur overflow-auto',
                className
            )}
            style={containerStyle}
        >
            {caption && (
                <div className="px-4 pt-4 pb-2 border-b border-white/5">
                    {caption}
                </div>
            )}

            {isLoading ? (
                <TableLoadingSkeleton density={density} />
            ) : error ? (
                <div className="p-6">{renderStatePanel('error', 'Failed to load table', error)}</div>
            ) : data.length === 0 ? (
                <div className="p-6">{renderStatePanel('empty', emptyTitle, emptyDescription)}</div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-white/5 hover:bg-transparent">
                            {columns.map((column) => {
                                const align = column.align ?? 'left';
                                const isSorted = sortKey === column.id;

                                return (
                                    <TableHead
                                        key={column.id}
                                        className={cn(
                                            headerClass,
                                            cellPadding,
                                            ALIGN_CLASS[align],
                                            column.sortable && onSort && 'cursor-pointer select-none hover:text-foreground/80 transition-colors duration-200',
                                            column.className
                                        )}
                                        onClick={
                                            column.sortable && onSort
                                                ? () => onSort(column.id)
                                                : undefined
                                        }
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {column.header}
                                            {column.sortable && isSorted && (
                                                sortDirection === 'asc'
                                                    ? <ChevronUp size={10} />
                                                    : <ChevronDown size={10} />
                                            )}
                                        </span>
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-white/5">
                        {data.map((row, index) => {
                            const rowKey = getRowKey(row);
                            const isSelected = selectedRowKey === rowKey;

                            return (
                                <TableRow
                                    key={rowKey}
                                    className={cn(
                                        'border-white/5 transition-colors duration-200',
                                        onRowClick && 'cursor-pointer',
                                        isSelected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]',
                                        getRowClassName?.(row)
                                    )}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                >
                                    {columns.map((column) => {
                                        const align = column.align ?? 'left';

                                        return (
                                            <TableCell
                                                key={column.id}
                                                className={cn(
                                                    cellPadding,
                                                    ALIGN_CLASS[align],
                                                    'text-xs',
                                                    column.className
                                                )}
                                            >
                                                {column.cell(row, index)}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}

            {footer && !isLoading && !error && data.length > 0 && (
                <div className="px-4 py-3 border-t border-white/5">
                    {footer}
                </div>
            )}
        </div>
    );
}

type BadgeTone = 'safe' | 'warning' | 'danger' | 'neutral' | 'info';

const BADGE_TONE_CLASS: Record<BadgeTone, string> = {
    safe: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    danger: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    neutral: 'text-muted-foreground bg-white/5 border-white/10',
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

export function InstitutionalRankCell({ rank }: { rank: number }) {
    return (
        <span className="font-mono text-white/20 tabular-nums">
            {rank.toString().padStart(2, '0')}
        </span>
    );
}

export function InstitutionalBadgeCell({
    label,
    tone = 'neutral',
}: {
    label: string;
    tone?: BadgeTone;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded border text-xs font-semibold uppercase tracking-uppercase',
                BADGE_TONE_CLASS[tone]
            )}
        >
            {label}
        </span>
    );
}

export function InstitutionalTrendCell({
    value,
    formattedValue,
}: {
    value: number | null | undefined;
    formattedValue?: string;
}) {
    if (value === null || value === undefined) {
        return <span className="font-mono text-muted-foreground">—</span>;
    }

    const display = formattedValue ?? String(value);
    const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
    const colorClass =
        value > 0 ? 'text-emerald-500' : value < 0 ? 'text-rose-500' : 'text-muted-foreground';

    return (
        <span className={cn('inline-flex items-center justify-end gap-1.5 font-mono tabular-nums', colorClass)}>
            <Icon size={12} />
            {display}
        </span>
    );
}
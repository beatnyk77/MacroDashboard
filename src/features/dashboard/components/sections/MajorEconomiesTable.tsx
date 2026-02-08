import React from 'react';
import { SectionHeader } from '@/components/SectionHeader';
import { useMajorEconomies, MajorEconomyRow } from '@/hooks/useMajorEconomies';
import { formatMetric } from '@/utils/formatMetric';
import { DataQualityBadge } from '@/components/DataQualityBadge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SparkBar: React.FC<{ value: number, color: string, max?: number, suffix?: string }> = ({ value, color, max = 10, suffix = '%' }) => (
    <div className="w-full min-w-[60px]">
        <div className="flex justify-between mb-1">
            <span className="text-[0.65rem] font-black font-mono text-foreground">
                {value > 0 ? '+' : ''}{value.toFixed(1)}{suffix}
            </span>
        </div>
        <div className="h-1 w-full rounded bg-white/5 overflow-hidden">
            <div
                className="h-full rounded"
                style={{
                    width: `${Math.min(100, (Math.abs(value) / max) * 100)}%`,
                    backgroundColor: color
                }}
            />
        </div>
    </div>
);

const PolicyDot: React.FC<{ rate: number }> = ({ rate }) => {
    const getColor = () => {
        if (rate > 5) return '#ef4444'; // Restrictive
        if (rate > 3) return '#f59e0b'; // Neutral+
        if (rate > 0) return '#10b981'; // Accommodative
        return '#3b82f6'; // Crisis/ZIRP
    };
    const color = getColor();

    return (
        <div className="flex items-center gap-2">
            <div
                className="w-2 h-2 rounded-full"
                style={{
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}40`
                }}
            />
            <span className="font-bold font-mono text-xs">
                {rate.toFixed(2)}%
            </span>
        </div>
    );
};

export const MajorEconomiesTable: React.FC = () => {
    const { data, isLoading } = useMajorEconomies();
    const [isExpanded, setIsExpanded] = React.useState(false);

    const visibleData = data ? (isExpanded ? data : data.slice(0, 6)) : [];

    return (
        <div id="major-economies-section" className="mb-12">
            <SectionHeader
                title="Sovereign Health Matrix"
                subtitle="Comparative fundamentals across G20 anchors (Jan 2026)"
                lastUpdated={data?.[0]?.last_updated}
            />

            <div className="bg-card rounded-lg border border-border/60 overflow-hidden shadow-md">
                <Table>
                    <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                        <TableRow className="border-b border-border/50 hover:bg-transparent">
                            <TableHead className="py-4 px-5 font-semibold uppercase text-[11px] text-muted-foreground tracking-wide whitespace-nowrap">
                                Country
                            </TableHead>
                            <TableHead className="py-4 px-5 text-right font-semibold uppercase text-[11px] text-muted-foreground tracking-wide whitespace-nowrap">
                                GDP (Nom)
                            </TableHead>
                            <TableHead className="py-4 px-5 font-semibold uppercase text-[11px] text-muted-foreground tracking-wide whitespace-nowrap w-[140px]">
                                Real Growth
                            </TableHead>
                            <TableHead className="py-4 px-5 font-semibold uppercase text-[11px] text-muted-foreground tracking-wide whitespace-nowrap w-[140px]">
                                CPI Inflation
                            </TableHead>
                            <TableHead className="py-4 px-5 text-right font-semibold uppercase text-[11px] text-muted-foreground tracking-wide whitespace-nowrap">
                                Policy Rate
                            </TableHead>
                            <TableHead className="py-4 px-5 text-right font-semibold uppercase text-[11px] text-muted-foreground tracking-wide whitespace-nowrap">
                                Debt/Gold
                            </TableHead>
                            <TableHead className="py-4 px-5 text-right font-semibold uppercase text-[11px] text-muted-foreground tracking-wide whitespace-nowrap">
                                Investment
                            </TableHead>
                            <TableHead className="py-4 px-5 text-right font-semibold uppercase text-[11px] text-muted-foreground tracking-wide whitespace-nowrap">
                                Health
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border/40">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i} className="even:bg-muted/10">
                                    <TableCell className="p-5"><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell className="p-5 text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    <TableCell className="p-5"><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell className="p-5"><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell className="p-5 text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                    <TableCell className="p-5 text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                    <TableCell className="p-5 text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                    <TableCell className="p-5 text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            visibleData.map((row: MajorEconomyRow) => (
                                <TableRow
                                    key={row.code}
                                    className="group transition-colors hover:bg-muted/30 even:bg-muted/5 border-border/40"
                                >
                                    <TableCell className="py-4 px-5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl filter drop-shadow-sm">{row.flag}</span>
                                            <span className="font-bold text-sm text-foreground tracking-wide">
                                                {row.code}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-4 px-5 text-right">
                                        <span className="font-semibold font-mono tabular-nums text-sm text-foreground">
                                            ${formatMetric(row.gdp_nominal, 'trillion', { showUnit: false })}T
                                        </span>
                                    </TableCell>

                                    <TableCell className="py-4 px-5">
                                        <SparkBar
                                            value={row.growth}
                                            color={row.growth > 3 ? '#10b981' : (row.growth > 0 ? '#3b82f6' : '#ef4444')}
                                            max={8}
                                        />
                                    </TableCell>

                                    <TableCell className="py-4 px-5">
                                        <SparkBar
                                            value={row.cpi}
                                            color={row.cpi > 5 ? '#ef4444' : (row.cpi > 3 ? '#f59e0b' : '#10b981')}
                                            max={12}
                                        />
                                    </TableCell>

                                    <TableCell className="py-4 px-5 text-right">
                                        <div className="flex justify-end">
                                            <PolicyDot rate={row.policy_rate} />
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-4 px-5 text-right">
                                        <span className={cn(
                                            "font-semibold font-mono tabular-nums text-sm",
                                            row.debt_gold_ratio > 200 ? 'text-rose-500' : (row.debt_gold_ratio > 100 ? 'text-amber-500' : 'text-emerald-500')
                                        )}>
                                            {row.debt_gold_ratio.toFixed(1)}x
                                        </span>
                                    </TableCell>

                                    <TableCell className="py-4 px-5 text-right">
                                        <span className={cn(
                                            "font-semibold font-mono tabular-nums text-sm",
                                            row.gfcf_pct > 25 ? 'text-emerald-500' : (row.gfcf_pct < 20 ? 'text-rose-500' : 'text-foreground')
                                        )}>
                                            {row.gfcf_pct.toFixed(1)}%
                                        </span>
                                    </TableCell>

                                    <TableCell className="py-4 px-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <DataQualityBadge
                                                timestamp={row.staleness === 'fresh' ? new Date() : null}
                                                label={false}
                                            />
                                            <span className="text-[0.65rem] text-muted-foreground font-bold tracking-wider uppercase">
                                                {row.growth > 0 && row.cpi < 5 ? 'STABLE' : 'STRESS'}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {data && data.length > 6 && (
                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="inline-flex items-center gap-2 text-[0.7rem] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp size={12} /> CONSOLIDATE
                            </>
                        ) : (
                            <>
                                <ChevronDown size={12} /> EXPAND ALL ({data.length})
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

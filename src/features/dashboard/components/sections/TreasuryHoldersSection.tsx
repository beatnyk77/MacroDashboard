import React, { useMemo, useState } from 'react';
import { SectionHeader } from '@/components/SectionHeader';
import { useTreasuryHolders, type TreasuryHolder } from '@/hooks/useTreasuryHolders';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatNumber';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TreasuryHoldersChart } from '../charts/TreasuryHoldersChart';
import { TICWorldMapModule } from '../widgets/TICWorldMapModule';
import {
    InstitutionalTable,
    InstitutionalTrendCell,
    type InstitutionalColumn,
} from '@/components/InstitutionalTable';
import { DataStatePanel } from '@/components/DataStatePanel';

const COUNTRY_FLAGS: Record<string, string> = {
    'Japan': '🇯🇵',
    'United Kingdom': '🇬🇧',
    'China, Mainland': '🇨🇳',
    'Belgium': '🇧🇪',
    'Luxembourg': '🇱🇺',
    'Canada': '🇨🇦',
    'Cayman Islands': '🇰🇾',
    'Switzerland': '🇨🇭',
    'Ireland': '🇮🇪',
    'Taiwan': '🇹🇼',
    'India': '🇮🇳',
    'Hong Kong': '🇭🇰',
    'Singapore': '🇸🇬',
    'Brazil': '🇧🇷',
    'Norway': '🇳🇴',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Israel': '🇮🇱',
    'Total Foreign': '🌐',
    'Grand Total': '🌐',
};

const treasuryColumns: InstitutionalColumn<TreasuryHolder>[] = [
    {
        id: 'country',
        header: 'Country / Holder',
        cell: (holder) => (
            <div className="flex items-center gap-3 normal-case tracking-normal">
                <span className="text-xl">{COUNTRY_FLAGS[holder.country_name] || '🌐'}</span>
                <span className="font-semibold text-xs text-foreground">{holder.country_name}</span>
            </div>
        ),
    },
    {
        id: 'holdings',
        header: 'Holdings ($BN)',
        align: 'right',
        cell: (holder) => (
            <span className="font-semibold text-xs font-mono tabular-nums">
                {formatCurrency(holder.holdings_usd_bn, { decimals: 0 })}
            </span>
        ),
    },
    {
        id: 'mom',
        header: 'MoM %',
        align: 'right',
        cell: (holder) => (
            <InstitutionalTrendCell
                value={holder.mom_pct_change}
                formattedValue={
                    holder.mom_pct_change !== null
                        ? formatPercentage(holder.mom_pct_change, { showSign: true, decimals: 2 })
                        : undefined
                }
            />
        ),
    },
    {
        id: 'yoy',
        header: 'YoY %',
        align: 'right',
        cell: (holder) => (
            <span className="font-semibold text-xs text-muted-foreground font-mono tabular-nums">
                {holder.yoy_pct_change !== null
                    ? formatPercentage(holder.yoy_pct_change, { showSign: true, decimals: 1 })
                    : '—'}
            </span>
        ),
    },
    {
        id: 'share',
        header: 'Share (%)',
        align: 'right',
        cell: (holder) => (
            <span className="font-semibold text-xs text-blue-400 font-mono tabular-nums">
                {holder.pct_of_total_foreign
                    ? formatPercentage(holder.pct_of_total_foreign, { decimals: 1 })
                    : '—'}
            </span>
        ),
    },
];

export const TreasuryHoldersSection: React.FC = () => {
    const { data, isLoading, error, refetch } = useTreasuryHolders();
    const [viewMode, setViewMode] = useState<'chart' | 'table' | 'map'>('map');
    const [isExpanded, setIsExpanded] = useState(false);

    const latestHolders = useMemo(() => {
        if (!data?.length) return [];

        const latestDate = data[0].as_of_date;
        return data
            .filter(
                (d) =>
                    d.as_of_date === latestDate &&
                    d.country_name !== 'Total Foreign' &&
                    d.country_name !== 'Grand Total'
            )
            .sort((a, b) => b.holdings_usd_bn - a.holdings_usd_bn);
    }, [data]);

    const chartData = useMemo(() => latestHolders.slice(0, 15), [latestHolders]);
    const visibleHolders = useMemo(
        () => (isExpanded ? latestHolders : latestHolders.slice(0, 10)),
        [isExpanded, latestHolders]
    );

    if (isLoading) return <Skeleton className="h-[600px] w-full rounded-xl mb-12" />;

    if (error) {
        return (
            <div className="mb-12">
                <DataStatePanel
                    variant="error"
                    title="Error loading TIC data"
                    description="Could not fetch Treasury holdings data."
                    onRetry={() => refetch()}
                    height={240}
                    accentColor="rose"
                />
            </div>
        );
    }

    return (
        <div id="treasury-holders-section" className="mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                <SectionHeader
                    title="Major Foreign Holders of U.S. Treasuries"
                    subtitle="Tracking institutional demand and sovereign accumulation of U.S. government debt"
                    exportId="treasury-holders-section"
                    className="mb-0"
                />

                <div className="bg-slate-950/50 p-1 rounded-lg border border-white/12 flex items-center">
                    <button
                        type="button"
                        onClick={() => setViewMode('map')}
                        className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200',
                            viewMode === 'map'
                                ? 'bg-primary/20 text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        Map
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('chart')}
                        className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200',
                            viewMode === 'chart'
                                ? 'bg-primary/20 text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        Chart
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('table')}
                        className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200',
                            viewMode === 'table'
                                ? 'bg-primary/20 text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        Table
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {viewMode === 'map' ? (
                    <div className="w-full animate-in fade-in duration-500">
                        {latestHolders.length === 0 ? (
                            <DataStatePanel
                                variant="empty"
                                title="No treasury holder data"
                                description="TIC foreign holdings are not yet available for this release window."
                                height={320}
                            />
                        ) : (
                            <TICWorldMapModule />
                        )}
                    </div>
                ) : viewMode === 'chart' ? (
                    <div className="w-full animate-in fade-in duration-500">
                        {chartData.length === 0 ? (
                            <DataStatePanel
                                variant="empty"
                                title="No treasury holder data"
                                description="Switch to Table view once TIC observations are available."
                                height={400}
                            />
                        ) : (
                            <>
                                <TreasuryHoldersChart data={chartData} height={600} />
                                <div className="mt-4 flex justify-end">
                                    <span className="text-xs text-muted-foreground/60 italic">
                                        Showing top 15 holders. Switch to Table view for full list.
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="w-full animate-in fade-in duration-500">
                        <InstitutionalTable
                            data={visibleHolders}
                            columns={treasuryColumns}
                            getRowKey={(holder) => holder.country_name}
                            maxHeight={isExpanded ? 800 : 500}
                            className="bg-card/40 border-white/12 shadow-xl"
                            emptyTitle="No treasury holder data"
                            emptyDescription="TIC foreign holdings are not yet available for this release window."
                        />

                        {latestHolders.length > 10 && (
                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="inline-flex items-center gap-2 text-xs font-black text-primary hover:text-primary/80 uppercase tracking-uppercase transition-colors duration-200 hover:underline"
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronUp size={12} /> Show Less
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown size={12} /> View Full List ({latestHolders.length} Holders)
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-start gap-2 max-w-3xl">
                <Info size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Data source: U.S. Treasury International Capital (TIC). Monthly updates provided post-release (approx. 15th of month). Percentages based on total reported foreign holdings.
                </p>
            </div>
        </div>
    );
};
import React, { useMemo } from 'react';
import { useGlobalRefiningData, type GlobalRefiningFacility } from '@/hooks/useGlobalRefiningData';
import { Trophy, ArrowUpRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    InstitutionalTable,
    InstitutionalRankCell,
    InstitutionalBadgeCell,
    type InstitutionalColumn,
} from '@/components/InstitutionalTable';

const columns: InstitutionalColumn<GlobalRefiningFacility>[] = [
    {
        id: 'rank',
        header: 'Rank',
        cell: (_row, index) => <InstitutionalRankCell rank={index + 1} />,
    },
    {
        id: 'facility',
        header: 'Facility / Node',
        cell: (fac) => (
            <div className="flex flex-col normal-case tracking-normal">
                <span className="text-white font-semibold">{fac.facility_name}</span>
                <span className="caption-muted normal-case">{fac.country}</span>
            </div>
        ),
    },
    {
        id: 'capacity',
        header: 'Cap (MBPD)',
        align: 'right',
        cell: (fac) => (
            <span className="font-mono tabular-nums text-white">{fac.capacity_mbpd.toFixed(2)}</span>
        ),
    },
    {
        id: 'utilization',
        header: 'Util%',
        align: 'right',
        cell: (fac) => (
            <InstitutionalBadgeCell
                label={`${fac.utilization_pct}%`}
                tone={fac.utilization_pct > 90 ? 'safe' : 'neutral'}
            />
        ),
    },
];

export const TopRefinersTable: React.FC<{ className?: string }> = ({ className }) => {
    const { data } = useGlobalRefiningData();

    const topRefiners = useMemo(
        () =>
            [...(data?.facilities || [])]
                .sort((a, b) => b.capacity_mbpd - a.capacity_mbpd)
                .slice(0, 10),
        [data?.facilities]
    );

    const tableColumns = useMemo(() => columns, []);

    return (
        <div className={cn('p-6 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-sm flex flex-col', className)}>
            <InstitutionalTable
                data={topRefiners}
                columns={tableColumns}
                getRowKey={(fac) => fac.id}
                density="compact"
                className="border-0 bg-transparent rounded-none overflow-visible"
                emptyTitle="No refining facilities available"
                emptyDescription="Global refining capacity observations are not yet populated."
                caption={(
                    <div>
                        <h3 className="text-sm font-black text-blue-500 uppercase tracking-uppercase flex items-center gap-2">
                            <Trophy size={14} /> Refining Alpha Ranking
                        </h3>
                        <p className="section-label mt-1">Top 10 Global Assets by Scale</p>
                    </div>
                )}
                footer={(
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={12} className="text-emerald-500" />
                            <span className="text-xs text-muted-foreground uppercase">Market Consolidation: HIGH</span>
                        </div>
                        <button
                            type="button"
                            className="text-xs text-blue-500/60 hover:text-blue-400 font-black uppercase flex items-center gap-1 transition-colors duration-200"
                        >
                            Detailed Report <ArrowUpRight size={10} />
                        </button>
                    </div>
                )}
            />
        </div>
    );
};
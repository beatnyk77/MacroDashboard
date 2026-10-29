import React from 'react';
import { FreshnessChip } from '@/components/FreshnessChip';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { DataStatePanel } from '@/components/DataStatePanel';
import { getStaleness } from '@/hooks/useStaleness';
import { useIndiaOilCost } from '@/features/energy/hooks/useIndiaOilCost';

const PENDING_SOURCES = [
    { label: 'Import dependence and net oil import bill', source: 'PPAC (MoPNG), monthly' },
    { label: 'Crude imports by origin and Hormuz-exposed share', source: 'UN Comtrade HS 2709, monthly' },
    { label: 'Strategic reserve capacity', source: 'ISPRL disclosures' },
] as const;

export const IndiaOilCostPanel: React.FC = () => {
    const { data, isLoading, isError, refetch } = useIndiaOilCost();

    if (isLoading) {
        return <DataStatePanel variant="pending" title="Loading India oil cost" height={200} />;
    }

    if (isError || !data) {
        return (
            <DataStatePanel
                variant={isError ? 'error' : 'empty'}
                title="India oil import cost unavailable"
                description="No rupee-per-barrel print is stored. Reserve-day and tanker figures are not shown: no public daily source exists."
                onRetry={isError ? () => refetch() : undefined}
                height={200}
            />
        );
    }

    const staleness = getStaleness(data.asOfDate, 'daily');

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Import cost per barrel
                    </span>
                    <div className="flex items-center gap-2">
                        <DataProvenanceBadge
                            source="Yahoo Finance"
                            methodology="Brent front-month (BZ=F) × USD/INR (INR=X)"
                            lastVerified={data.asOfDate}
                            size="sm"
                        />
                        <FreshnessChip status={staleness.state} lastUpdated={data.asOfDate} />
                    </div>
                </div>
                <div className="mt-3 text-3xl font-bold tabular-nums tracking-heading text-foreground">
                    ₹{data.inrPerBarrel.toLocaleString('en-IN')}
                    <span className="ml-2 text-sm font-semibold text-muted-foreground">per barrel</span>
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase leading-relaxed tracking-wider text-muted-foreground">
                    {data.brentUsd !== null && data.usdInr !== null
                        ? `Brent front-month $${data.brentUsd.toFixed(2)}${data.brentDate ? ` (${data.brentDate})` : ''} × USD/INR ${data.usdInr.toFixed(2)}${data.usdInrDate ? ` (${data.usdInrDate})` : ''}. `
                        : ''}
                    Proxy for the Indian basket: PPAC publishes the basket price, which replaces this proxy once integrated.
                </p>
            </div>

            <div className="rounded-xl border border-border bg-card/60 p-5">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                    Not yet integrated
                </div>
                <ul className="space-y-2">
                    {PENDING_SOURCES.map(item => (
                        <li key={item.label} className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                            <span className="font-semibold text-foreground">{item.label}</span>
                            <span className="font-semibold uppercase tracking-wider text-muted-foreground">{item.source}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default IndiaOilCostPanel;

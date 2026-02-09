import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from '@/components/MetricCard';
import { useMarketPulse } from '@/hooks/useMarketPulse';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';
import { DataQualityBadge } from '@/components/DataQualityBadge';

import { formatMetric, formatDelta } from '@/utils/formatMetric';

export const CockpitKPIGrid = React.memo(() => {
    const { data: marketPulse, isLoading: isMarketLoading } = useMarketPulse();
    const { data: netLiq } = useNetLiquidity();
    const { data: integrity } = useDataIntegrity();

    const findMetric = (id: string) => marketPulse?.find(m => m.id === id);

    // Core Metrics for Hero Section
    const gold = findMetric('GOLD_PRICE_USD');
    const silver = findMetric('SILVER_PRICE_USD');
    const oil = findMetric('WTI_CRUDE_PRICE');
    const dxy = findMetric('DXY_INDEX');
    const vix = findMetric('VIX_INDEX');
    const curve = findMetric('UST_10Y_2Y_SPREAD');
    const ust10y = findMetric('UST_10Y_YIELD');
    const sofr = findMetric('SOFR_RATE');
    const btc = findMetric('BITCOIN_PRICE_USD');

    const isLoading = isMarketLoading;

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className={i === 0 ? "sm:col-span-2 h-[220px]" : "h-[220px]"} />
                ))}
            </div>
        );
    }


    return (
        <div className="p-6 rounded-xl bg-card border border-border/60 shadow-sm">
            {/* Hero Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                        DETECTION & INTEGRITY
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight mt-1">
                        System Heartbeat
                    </h2>
                </div>

                {/* Data Integrity Badge - Unified System */}
                <div>
                    <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase text-right mb-1">
                        Data Integrity
                    </div>
                    <div>
                        <DataQualityBadge
                            timestamp={integrity?.lastChecked || null}
                            size="medium"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {/* 1. Net Liquidity - THE Core Signal (Double Width) */}
                <div className="col-span-1 sm:col-span-2">
                    <MetricCard
                        label="Net Liquidity"
                        metricId="NET_LIQUIDITY"
                        description="Global central bank liquidity + Fed net liquidity injections"
                        value={formatMetric(netLiq?.current_value, 'trillion', { showUnit: false })}
                        prefix="$"
                        suffix=" T"
                        delta={netLiq ? {
                            value: formatDelta(netLiq.delta / 1e12, { unit: 'T' }) || '—',
                            period: '7D',
                            trend: netLiq.delta > 0 ? 'up' : 'down'
                        } : undefined}
                        status={netLiq?.alarm_status === 'warning' ? 'warning' : (netLiq?.alarm_status === 'expansion' ? 'safe' : 'neutral')}
                        history={netLiq?.history}
                        isLoading={isLoading}
                        lastUpdated={netLiq?.as_of_date}
                        className="bg-card/50"
                    />
                </div>

                {/* 2. US 10Y Yield */}
                <div className="col-span-1">
                    <MetricCard
                        label="US 10Y Yield"
                        metricId="UST_10Y_YIELD"
                        value={formatMetric(ust10y?.value, 'percent', { showUnit: false })}
                        suffix=" %"
                        delta={ust10y ? {
                            value: formatDelta(ust10y.delta_wow, { decimals: 1, unit: 'bps' }) || '—',
                            period: 'WoW',
                            trend: ust10y.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        status={(ust10y?.value || 0) > 4.5 ? 'warning' : 'neutral'}
                        isLoading={isLoading}
                    />
                </div>

                {/* 3. Yield Curve (2s10s) */}
                <div className="col-span-1">
                    <MetricCard
                        label="Yield Curve"
                        sublabel="10Y - 2Y Spread"
                        metricId="YIELD_CURVE"
                        value={formatMetric(curve?.value, 'index', { showUnit: false })}
                        suffix=" bps"
                        delta={curve ? {
                            value: formatDelta(curve.delta_wow, { decimals: 1 }) || '—',
                            period: 'WoW',
                            trend: curve.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        status={(curve?.value || 0) < 0 ? 'danger' : 'neutral'}
                        isLoading={isLoading}
                    />
                </div>

                {/* 4. SOFR Rate */}
                <div className="col-span-1">
                    <MetricCard
                        label="SOFR Rate"
                        sublabel="Secured Overnight Financing"
                        metricId="SOFR_RATE"
                        value={formatMetric(sofr?.value, 'percent', { showUnit: false })}
                        suffix=" %"
                        delta={sofr ? {
                            value: formatDelta(sofr.delta_wow, { decimals: 1 }) || '—',
                            period: 'WoW',
                            trend: sofr.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        status="neutral"
                        isLoading={isLoading}
                    />
                </div>

                {/* 5. DXY Index */}
                <div className="col-span-1">
                    <MetricCard
                        label="US Dollar"
                        sublabel="DXY Index"
                        metricId="DXY_INDEX"
                        value={formatMetric(dxy?.value, 'index', { showUnit: false })}
                        delta={dxy ? {
                            value: formatDelta(dxy.delta_wow, { decimals: 2 }) || '—',
                            period: 'WoW',
                            trend: dxy.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        status="neutral"
                        isLoading={isLoading}
                    />
                </div>

                {/* 6. Gold */}
                <div className="col-span-1">
                    <MetricCard
                        label="Gold"
                        sublabel="Spot / USD"
                        metricId="GOLD_PRICE_USD"
                        value={formatMetric(gold?.value, 'currency', { showUnit: false })}
                        prefix="$"
                        delta={gold ? {
                            value: formatDelta(gold.delta_wow, { decimals: 1, unit: '%' }) || '—',
                            period: 'WoW',
                            trend: gold.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        status="neutral"
                        isLoading={isLoading}
                    />
                </div>

                {/* 7. Silver */}
                <div className="col-span-1">
                    <MetricCard
                        label="Silver"
                        sublabel="Spot / USD"
                        metricId="SILVER_PRICE_USD"
                        value={formatMetric(silver?.value, 'currency', { showUnit: false })}
                        prefix="$"
                        delta={silver ? {
                            value: formatDelta(silver.delta_wow, { decimals: 1, unit: '%' }) || '—',
                            period: 'WoW',
                            trend: silver.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        status="neutral"
                        isLoading={isLoading}
                    />
                </div>

                {/* 8. WTI Crude */}
                <div className="col-span-1">
                    <MetricCard
                        label="Oil"
                        sublabel="WTI Crude"
                        metricId="WTI_CRUDE_PRICE"
                        value={formatMetric(oil?.value, 'currency', { showUnit: false })}
                        prefix="$"
                        delta={oil ? {
                            value: formatDelta(oil.delta_wow, { decimals: 1, unit: '%' }) || '—',
                            period: 'WoW',
                            trend: oil.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        status="neutral"
                        isLoading={isLoading}
                    />
                </div>

                {/* 9. Bitcoin */}
                <div className="col-span-1">
                    <MetricCard
                        label="Bitcoin"
                        sublabel="BTC / USD"
                        metricId="BITCOIN_PRICE_USD"
                        value={formatMetric(btc?.value, 'currency', { showUnit: false })}
                        prefix="$"
                        delta={btc ? {
                            value: formatDelta(btc.delta_wow, { decimals: 1, unit: '%' }) || '—',
                            period: 'WoW',
                            trend: btc.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        status="neutral"
                        isLoading={isLoading}
                    />
                </div>

                {/* 10. VIX Index */}
                <div className="col-span-1">
                    <MetricCard
                        label="VIX"
                        sublabel="Volatility"
                        metricId="VIX_INDEX"
                        value={formatMetric(vix?.value, 'index', { showUnit: false })}
                        delta={vix ? {
                            value: formatDelta(vix.delta_wow, { decimals: 1 }) || '—',
                            period: 'WoW',
                            trend: vix.delta_wow > 0 ? 'down' : 'up'
                        } : undefined}
                        status={(vix?.value || 0) > 20 ? 'warning' : (vix?.value || 0) > 30 ? 'danger' : 'safe'}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
});

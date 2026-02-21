import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from '@/components/MetricCard';
import { useMarketPulse } from '@/hooks/useMarketPulse';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';
import { DataQualityBadge } from '@/components/DataQualityBadge';

import { formatMetric, formatDelta } from '@/utils/formatMetric';
import { getRiskInterpretation, getMetricConfig } from '@/lib/metricRiskConfig';

export const CockpitKPIGrid = React.memo(() => {
    const { data: marketPulse, isLoading: isMarketLoading } = useMarketPulse();
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

    const renderMetricWithEnhancedDelta = (metric: any, metricId: string, label: string, sublabel?: string, unitType: any = 'index', prefix: string = '', suffixValue: string = '', statusType: any = 'neutral') => {
        const config = getMetricConfig(metricId);
        const valueWow = metric ? metric.value - metric.delta_wow : 0;
        const deltaPct = valueWow !== 0 ? (metric.delta_wow / valueWow) * 100 : 0;

        return (
            <MetricCard
                label={label}
                sublabel={sublabel}
                metricId={metricId}
                value={formatMetric(metric?.value, unitType, { showUnit: false })}
                prefix={prefix}
                suffix={suffixValue}
                delta={metric ? {
                    value: formatDelta(metric.delta_wow, { decimals: config.deltaDecimals, unit: config.displayUnit }) || '—',
                    period: 'WoW',
                    trend: metric.delta_wow > 0 ? 'up' : 'down',
                    tooltip: {
                        currentValue: formatMetric(metric.value, unitType) || '—',
                        previousValue: formatMetric(valueWow, unitType) || '—',
                        absoluteChange: formatDelta(metric.delta_wow, { decimals: config.deltaDecimals, unit: config.displayUnit }) || '0',
                        percentChange: formatDelta(deltaPct, { decimals: 1 }) || '0'
                    },
                    riskInterpretation: getRiskInterpretation(metricId, metric.delta_wow)
                } : { value: 'WoW n/a', period: 'WoW', trend: 'neutral' }}
                status={statusType}
                isLoading={isLoading}
            />
        );
    };

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
        <div className="p-6 md:p-10 rounded-3xl bg-card border border-border/60 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors duration-1000" />

            {/* Hero Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <div className="text-xs font-bold tracking-[0.2em] text-blue-400 uppercase">
                            Live Market Terminal
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter mt-1 text-white">
                        System <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Heartbeat</span>
                    </h2>
                    <p className="text-muted-foreground text-sm font-medium mt-2 max-w-xl">
                        Real-time cross-asset monitoring of liquidity conditions, volatility, and sovereign stress.
                    </p>
                </div>

                {/* Data Integrity Badge */}
                <div className="flex flex-col items-end">
                    <div className="text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase mb-2">
                        Signal Integrity
                    </div>
                    <DataQualityBadge
                        timestamp={integrity?.lastChecked || null}
                        size="medium"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {/* 2. US 10Y Yield */}
                <div className="col-span-1 min-h-[180px] md:min-h-[200px]">
                    {renderMetricWithEnhancedDelta(
                        ust10y,
                        'UST_10Y_YIELD',
                        'US 10Y Yield',
                        undefined,
                        'percent',
                        '',
                        ' %',
                        (ust10y?.value || 0) > 4.5 ? 'warning' : 'neutral'
                    )}
                </div>

                {/* 3. Yield Curve (2s10s) */}
                <div className="col-span-1 min-h-[180px] md:min-h-[200px]">
                    {renderMetricWithEnhancedDelta(
                        curve,
                        'UST_10Y_2Y_SPREAD',
                        'Yield Curve',
                        '10Y - 2Y Spread',
                        'index',
                        '',
                        ' bps',
                        (curve?.value || 0) < 0 ? 'danger' : 'neutral'
                    )}
                </div>

                {/* 4. SOFR Rate */}
                <div className="col-span-1 min-h-[180px] md:min-h-[200px]">
                    {renderMetricWithEnhancedDelta(
                        sofr,
                        'SOFR_RATE',
                        'SOFR Rate',
                        'Secured Overnight Financing',
                        'percent',
                        '',
                        ' %'
                    )}
                </div>

                {/* 5. DXY Index */}
                <div className="col-span-1 min-h-[180px] md:min-h-[200px]">
                    {renderMetricWithEnhancedDelta(
                        dxy,
                        'DXY_INDEX',
                        'US Dollar',
                        'DXY Index',
                        'index'
                    )}
                </div>

                {/* 6. Gold */}
                <div className="col-span-1 min-h-[180px] md:min-h-[200px]">
                    {renderMetricWithEnhancedDelta(
                        gold,
                        'GOLD_PRICE_USD',
                        'Gold',
                        'Spot / USD',
                        'currency',
                        '$'
                    )}
                </div>

                {/* 7. Silver */}
                <div className="col-span-1 min-h-[180px] md:min-h-[200px]">
                    {renderMetricWithEnhancedDelta(
                        silver,
                        'SILVER_PRICE_USD',
                        'Silver',
                        'Spot / USD',
                        'currency',
                        '$'
                    )}
                </div>

                {/* 8. WTI Crude */}
                <div className="col-span-1 min-h-[180px] md:min-h-[200px]">
                    {renderMetricWithEnhancedDelta(
                        oil,
                        'WTI_CRUDE_PRICE',
                        'Oil',
                        'WTI Crude',
                        'currency',
                        '$'
                    )}
                </div>

                {/* 9. Bitcoin */}
                <div className="col-span-1 min-h-[180px] md:min-h-[200px]">
                    {renderMetricWithEnhancedDelta(
                        btc,
                        'BITCOIN_PRICE_USD',
                        'Bitcoin',
                        'BTC / USD',
                        'currency',
                        '$'
                    )}
                </div>

                {/* 10. VIX Index */}
                <div className="col-span-1 min-h-[180px] md:min-h-[200px]">
                    {renderMetricWithEnhancedDelta(
                        vix,
                        'VIX_INDEX',
                        'VIX',
                        'Volatility',
                        'index',
                        '',
                        '',
                        (vix?.value || 0) >= 35 ? 'danger' : (vix?.value || 0) >= 25 ? 'warning' : 'safe'
                    )}
                </div>
            </div>
        </div>
    );
});

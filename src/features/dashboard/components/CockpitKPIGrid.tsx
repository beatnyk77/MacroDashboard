import React from 'react';
import { Grid, Skeleton } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { useMarketPulse } from '@/hooks/useMarketPulse';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { formatNumber, formatBillions, formatPercentage, formatDelta } from '@/utils/formatNumber';

export const CockpitKPIGrid = React.memo(() => {
    const { data: marketPulse, isLoading: isMarketLoading } = useMarketPulse();
    const { data: netLiq, isLoading: isLiqLoading } = useNetLiquidity();

    const findMetric = (id: string) => marketPulse?.find(m => m.id === id);

    const gold = findMetric('GOLD_PRICE_USD');
    const oil = findMetric('WTI_CRUDE_PRICE');
    const dxy = findMetric('DXY_INDEX');
    const vix = findMetric('VIX_INDEX');
    const curve = findMetric('UST_10Y_2Y_SPREAD');

    const isLoading = isMarketLoading || isLiqLoading;

    if (isLoading) {
        return (
            <Grid container spacing={2}>
                {[...Array(6)].map((_, i) => (
                    <Grid item xs={12} sm={6} md={4} key={i}>
                        <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
                    </Grid>
                ))}
            </Grid>
        );
    }

    return (
        <Grid container spacing={2}>
            {/* 1. Net Liquidity - THE Core Signal */}
            <Grid item xs={12} sm={6} md={4}>
                <MetricCard
                    label="Net Liquidity"
                    metricId="NET_LIQUIDITY"
                    value={netLiq?.current_value || 0}
                    prefix="$"
                    suffix="T"
                    delta={netLiq ? {
                        value: `${netLiq.delta > 0 ? '+' : ''}${formatBillions(netLiq.delta / 1e9, { decimals: 1 })}`,
                        period: '7D',
                        trend: netLiq.delta > 0 ? 'up' : 'down'
                    } : undefined}
                    status={netLiq?.alarm_status === 'warning' ? 'warning' : (netLiq?.alarm_status === 'expansion' ? 'safe' : 'neutral')}
                    history={netLiq?.history}
                    isLoading={isLoading}
                    lastUpdated={netLiq?.as_of_date}
                    sx={{ height: '100%' }}
                />
            </Grid>

            {/* 2. Yield Curve (10Y-2Y) */}
            <Grid item xs={12} sm={6} md={4}>
                <MetricCard
                    label="Yield Curve (2s10s)"
                    metricId="YIELD_CURVE"
                    value={curve?.value || 0}
                    suffix=" bps"
                    delta={curve ? {
                        value: formatDelta(curve.delta_wow, { decimals: 1 }),
                        period: 'WoW',
                        trend: curve.delta_wow > 0 ? 'up' : 'down'
                    } : undefined}
                    status={(curve?.value || 0) < 0 ? 'danger' : 'neutral'}
                    isLoading={isLoading}
                    sx={{ height: '100%' }}
                />
            </Grid>

            {/* 3. Gold */}
            <Grid item xs={12} sm={6} md={4}>
                <MetricCard
                    label="Gold (Spot)"
                    metricId="GOLD_PRICE"
                    value={gold?.value || 0}
                    prefix="$"
                    delta={gold ? {
                        value: formatDelta(gold.delta_wow, { decimals: 1, suffix: '%' }),
                        period: 'WoW',
                        trend: gold.delta_wow > 0 ? 'up' : 'down'
                    } : undefined}
                    status="neutral"
                    isLoading={isLoading}
                    sx={{ height: '100%' }}
                />
            </Grid>

            {/* 4. DXY Index */}
            <Grid item xs={12} sm={6} md={4}>
                <MetricCard
                    label="US Dollar (DXY)"
                    metricId="DXY_INDEX"
                    value={dxy?.value || 0}
                    delta={dxy ? {
                        value: formatDelta(dxy.delta_wow, { decimals: 2 }),
                        period: 'WoW',
                        trend: dxy.delta_wow > 0 ? 'up' : 'down'
                    } : undefined}
                    status="neutral"
                    isLoading={isLoading}
                    sx={{ height: '100%' }}
                />
            </Grid>

            {/* 5. WTI Crude */}
            <Grid item xs={12} sm={6} md={4}>
                <MetricCard
                    label="WTI Crude"
                    metricId="CRUDE_OIL"
                    value={oil?.value || 0}
                    prefix="$"
                    delta={oil ? {
                        value: formatDelta(oil.delta_wow, { decimals: 1, suffix: '%' }),
                        period: 'WoW',
                        trend: oil.delta_wow > 0 ? 'up' : 'down'
                    } : undefined}
                    status="neutral"
                    isLoading={isLoading}
                    sx={{ height: '100%' }}
                />
            </Grid>

            {/* 6. VIX Index */}
            <Grid item xs={12} sm={6} md={4}>
                <MetricCard
                    label="VIX (Volatility)"
                    metricId="VIX_INDEX"
                    value={vix?.value || 0}
                    delta={vix ? {
                        value: formatDelta(vix.delta_wow, { decimals: 1 }),
                        period: 'WoW',
                        trend: vix.delta_wow > 0 ? 'down' : 'up'
                    } : undefined}
                    status={(vix?.value || 0) > 20 ? 'warning' : (vix?.value || 0) > 30 ? 'danger' : 'safe'}
                    isLoading={isLoading}
                    sx={{ height: '100%' }}
                />
            </Grid>
        </Grid>
    );
});

import React from 'react';
import { Grid, Skeleton } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { useMarketPulse } from '@/hooks/useMarketPulse';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';

export const CockpitKPIGrid: React.FC = () => {
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
                    value={netLiq?.current_value || 0}
                    prefix="$"
                    suffix="T"
                    delta={netLiq ? {
                        value: `${netLiq.delta > 0 ? '+' : ''}${(netLiq.delta / 1e9).toFixed(1)}B`,
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
                    value={curve?.value || 0}
                    suffix=" bps"
                    delta={curve ? {
                        value: `${curve.delta_wow > 0 ? '+' : ''}${curve.delta_wow.toFixed(1)}`,
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
                    value={gold?.value || 0}
                    prefix="$"
                    delta={gold ? {
                        value: `${gold.delta_wow > 0 ? '+' : ''}${gold.delta_wow.toFixed(1)}%`,
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
                    value={dxy?.value || 0}
                    delta={dxy ? {
                        value: `${dxy.delta_wow > 0 ? '+' : ''}${dxy.delta_wow.toFixed(2)}`,
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
                    value={oil?.value || 0}
                    prefix="$"
                    delta={oil ? {
                        value: `${oil.delta_wow > 0 ? '+' : ''}${oil.delta_wow.toFixed(1)}%`,
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
                    value={vix?.value || 0}
                    delta={vix ? {
                        value: `${vix.delta_wow > 0 ? '+' : ''}${vix.delta_wow.toFixed(1)}`,
                        period: 'WoW',
                        trend: vix.delta_wow > 0 ? 'down' : 'up' // Lower VIX is usually "up" trend for markets
                    } : undefined}
                    status={(vix?.value || 0) > 20 ? 'warning' : (vix?.value || 0) > 30 ? 'danger' : 'safe'}
                    isLoading={isLoading}
                    sx={{ height: '100%' }}
                />
            </Grid>
        </Grid>
    );
};

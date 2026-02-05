import React from 'react';
import { Grid, Skeleton, Box, Typography } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { useMarketPulse } from '@/hooks/useMarketPulse';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';
import { formatBillions, formatDelta } from '@/utils/formatNumber';
import { Activity } from 'lucide-react';

export const CockpitKPIGrid = React.memo(() => {
    const { data: marketPulse, isLoading: isMarketLoading } = useMarketPulse();
    const { data: netLiq, isLoading: isLiqLoading } = useNetLiquidity();
    const { data: integrity } = useDataIntegrity(); // Moved from Ticker

    const findMetric = (id: string) => marketPulse?.find(m => m.id === id);

    // Core 10 Metrics for Hero Section
    const gold = findMetric('GOLD_PRICE_USD');
    const silver = findMetric('SILVER_PRICE_USD');
    const oil = findMetric('WTI_CRUDE'); // Updated ID match
    const dxy = findMetric('DXY_INDEX');
    const vix = findMetric('VIX_INDEX');
    const curve = findMetric('UST_10Y_2Y_SPREAD');
    const ust10y = findMetric('UST_10Y_YIELD');
    const sofr = findMetric('SOFR_RATE');
    const btc = findMetric('BTC_PRICE');

    const isLoading = isMarketLoading || isLiqLoading;

    if (isLoading) {
        return (
            <Grid container spacing={2.5}>
                {[...Array(8)].map((_, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
                    </Grid>
                ))}
            </Grid>
        );
    }

    return (
        <Box sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(16, 185, 129, 0.02) 100%)',
            borderTop: '2px solid',
            borderColor: 'primary.main',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Hero Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.1em' }}>
                        DETECTION & INTEGRITY
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 0.5 }}>
                        System Heartbeat
                    </Typography>
                </Box>

                {/* Data Integrity Badge */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: integrity?.status === 'healthy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid',
                    borderColor: integrity?.status === 'healthy' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: integrity?.status === 'healthy' ? '#10b981' : '#f59e0b',
                }}>
                    <Activity size={16} />
                    <Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, fontSize: '0.65rem', lineHeight: 1, opacity: 0.8 }}>
                            DATA INTEGRITY
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1, fontSize: '0.85rem' }}>
                            {integrity?.status === 'healthy' ? 'OPTIMAL' : 'LAGGED'}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Grid container spacing={2.5}>
                {/* 1. Net Liquidity - THE Core Signal (Double Width) */}
                <Grid item xs={12} sm={12} md={6} lg={4}>
                    <MetricCard
                        label="Net Liquidity"
                        metricId="NET_LIQUIDITY"
                        description="Global central bank liquidity + Fed net liquidity injections"
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
                        sx={{ height: '100%', minHeight: 220, bgcolor: 'background.paper' }}
                    />
                </Grid>

                {/* 2. US 10Y Yield */}
                <Grid item xs={12} sm={6} md={3} lg={2}>
                    <MetricCard
                        label="US 10Y Yield"
                        metricId="UST_10Y_YIELD"
                        value={ust10y?.value || 0}
                        suffix="%"
                        delta={ust10y ? {
                            value: formatDelta(ust10y.delta_wow, { decimals: 1, suffix: 'bps' }),
                            period: 'WoW',
                            trend: ust10y.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        status={(ust10y?.value || 0) > 4.5 ? 'warning' : 'neutral'}
                        isLoading={isLoading}
                        sx={{ height: '100%' }}
                    />
                </Grid>

                {/* 3. Yield Curve (2s10s) */}
                <Grid item xs={12} sm={6} md={3} lg={2}>
                    <MetricCard
                        label="Yield Curve"
                        sublabel="10Y - 2Y Spread"
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

                {/* 4. SOFR Rate */}
                <Grid item xs={12} sm={6} md={3} lg={2}>
                    <MetricCard
                        label="SOFR Rate"
                        sublabel="Secured Overnight Financing"
                        metricId="SOFR_RATE"
                        value={sofr?.value || 0}
                        suffix="%"
                        delta={sofr ? {
                            value: formatDelta(sofr.delta_wow, { decimals: 1 }),
                            period: 'WoW',
                            trend: sofr.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        status="neutral"
                        isLoading={isLoading}
                        sx={{ height: '100%' }}
                    />
                </Grid>

                {/* 5. DXY Index */}
                <Grid item xs={12} sm={6} md={3} lg={2}>
                    <MetricCard
                        label="US Dollar"
                        sublabel="DXY Index"
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

                {/* 6. Gold */}
                <Grid item xs={12} sm={6} md={3} lg={2.4}>
                    <MetricCard
                        label="Gold"
                        sublabel="Spot / USD"
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

                {/* 7. Silver */}
                <Grid item xs={12} sm={6} md={3} lg={2.4}>
                    <MetricCard
                        label="Silver"
                        sublabel="Spot / USD"
                        metricId="SILVER_PRICE"
                        value={silver?.value || 0}
                        prefix="$"
                        delta={silver ? {
                            value: formatDelta(silver.delta_wow, { decimals: 1, suffix: '%' }),
                            period: 'WoW',
                            trend: silver.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        status="neutral"
                        isLoading={isLoading}
                        sx={{ height: '100%' }}
                    />
                </Grid>

                {/* 8. WTI Crude */}
                <Grid item xs={12} sm={6} md={3} lg={2.4}>
                    <MetricCard
                        label="Oil"
                        sublabel="WTI Crude"
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

                {/* 9. Bitcoin */}
                <Grid item xs={12} sm={6} md={3} lg={2.4}>
                    <MetricCard
                        label="Bitcoin"
                        sublabel="BTC / USD"
                        metricId="BTC_PRICE"
                        value={btc?.value || 0}
                        prefix="$"
                        delta={btc ? {
                            value: formatDelta(btc.delta_wow, { decimals: 1, suffix: '%' }),
                            period: 'WoW',
                            trend: btc.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        status="neutral"
                        isLoading={isLoading}
                        sx={{ height: '100%' }}
                    />
                </Grid>

                {/* 10. VIX Index */}
                <Grid item xs={12} sm={6} md={3} lg={2.4}>
                    <MetricCard
                        label="VIX"
                        sublabel="Volatility"
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
        </Box>
    );
});

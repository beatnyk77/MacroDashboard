import React from 'react';
import { Grid, Skeleton, Box, Typography } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { useMarketPulse } from '@/hooks/useMarketPulse';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';
import { DataQualityBadge } from '@/components/DataQualityBadge';
import { metricTypography, spacing } from '@/theme';
import { formatMetric, formatDelta } from '@/utils/formatMetric';

export const CockpitKPIGrid = React.memo(() => {
    const { data: marketPulse, isLoading: isMarketLoading } = useMarketPulse();
    const { data: netLiq, isLoading: isLiqLoading } = useNetLiquidity();
    const { data: integrity } = useDataIntegrity();

    const findMetric = (id: string) => marketPulse?.find(m => m.id === id);

    // Core Metrics for Hero Section
    const gold = findMetric('GOLD_PRICE_USD');
    const silver = findMetric('SILVER_PRICE_USD');
    const oil = findMetric('WTI_CRUDE');
    const dxy = findMetric('DXY_INDEX');
    const vix = findMetric('VIX_INDEX');
    const curve = findMetric('UST_10Y_2Y_SPREAD');
    const ust10y = findMetric('UST_10Y_YIELD');
    const sofr = findMetric('SOFR_RATE');
    const btc = findMetric('BTC_PRICE');

    const isLoading = isMarketLoading || isLiqLoading;

    if (isLoading) {
        return (
            <Grid container spacing={spacing.cardGap}>
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
                    <Typography variant="overline" sx={metricTypography.label}>
                        DETECTION & INTEGRITY
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 0.5 }}>
                        System Heartbeat
                    </Typography>
                </Box>

                {/* Data Integrity Badge - Unified System */}
                <Box>
                    <Typography variant="caption" sx={metricTypography.label}>
                        Data Integrity
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                        <DataQualityBadge
                            timestamp={integrity?.lastChecked || null}
                            size="medium"
                        />
                    </Box>
                </Box>
            </Box>

            <Grid container spacing={spacing.cardGap}>
                {/* 1. Net Liquidity - THE Core Signal (Double Width) */}
                <Grid item xs={12} sm={12} md={6} lg={4}>
                    <MetricCard
                        label="Net Liquidity"
                        metricId="NET_LIQUIDITY"
                        description="Global central bank liquidity + Fed net liquidity injections"
                        value={formatMetric(netLiq?.current_value, 'trillion', { showUnit: false })}
                        prefix="$"
                        suffix=" T"
                        delta={netLiq ? {
                            value: formatDelta(netLiq.delta / 1e9, { unit: 'B' }) || '—',
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
                        value={formatMetric(ust10y?.value, 'percent', { showUnit: false })}
                        suffix=" %"
                        delta={ust10y ? {
                            value: formatDelta(ust10y.delta_wow, { decimals: 1, unit: 'bps' }) || '—',
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
                        value={formatMetric(curve?.value, 'index', { showUnit: false })}
                        suffix=" bps"
                        delta={curve ? {
                            value: formatDelta(curve.delta_wow, { decimals: 1 }) || '—',
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
                        value={formatMetric(sofr?.value, 'percent', { showUnit: false })}
                        suffix=" %"
                        delta={sofr ? {
                            value: formatDelta(sofr.delta_wow, { decimals: 1 }) || '—',
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
                        value={formatMetric(dxy?.value, 'index', { showUnit: false })}
                        delta={dxy ? {
                            value: formatDelta(dxy.delta_wow, { decimals: 2 }) || '—',
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
                        value={formatMetric(gold?.value, 'currency', { showUnit: false })}
                        prefix="$"
                        delta={gold ? {
                            value: formatDelta(gold.delta_wow, { decimals: 1, unit: '%' }) || '—',
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
                        value={formatMetric(silver?.value, 'currency', { showUnit: false })}
                        prefix="$"
                        delta={silver ? {
                            value: formatDelta(silver.delta_wow, { decimals: 1, unit: '%' }) || '—',
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
                        value={formatMetric(oil?.value, 'currency', { showUnit: false })}
                        prefix="$"
                        delta={oil ? {
                            value: formatDelta(oil.delta_wow, { decimals: 1, unit: '%' }) || '—',
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
                        value={formatMetric(btc?.value, 'currency', { showUnit: false })}
                        prefix="$"
                        delta={btc ? {
                            value: formatDelta(btc.delta_wow, { decimals: 1, unit: '%' }) || '—',
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
                        value={formatMetric(vix?.value, 'index', { showUnit: false })}
                        delta={vix ? {
                            value: formatDelta(vix.delta_wow, { decimals: 1 }) || '—',
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

import React from 'react';
import { Box, Grid, Typography, useTheme, Paper, Skeleton } from '@mui/material';
import { useBoJBalanceSheet } from '@/hooks/useBoJBalanceSheet';
import { MetricCard } from '@/components/MetricCard';
import { Sparkline } from '@/components/Sparkline';

const BoJSubCard: React.FC<{
    label: string,
    value: number | undefined,
    history: { date: string; value: number }[] | undefined,
    isLoading: boolean,
    secondaryValue?: string
}> = ({ label, value, history, isLoading, secondaryValue }) => {
    const theme = useTheme();

    return (
        <Paper sx={{
            p: 1.5,
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            '&:hover': {
                bgcolor: 'rgba(255,255,255,0.04)',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s'
            }
        }}>
            <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
                    {label}
                </Typography>
                {isLoading ? (
                    <Skeleton variant="text" width="60%" />
                ) : (
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'monospace', mb: 0.5 }}>
                            ¥{value?.toFixed(1)}T
                        </Typography>
                        {secondaryValue && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontFamily: 'monospace' }}>
                                {secondaryValue}
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>

            {!isLoading && history && history.length > 0 && (
                <Box sx={{ height: 24, opacity: 0.6, mt: 1 }}>
                    <Sparkline data={history} color={theme.palette.primary.main} height={24} />
                </Box>
            )}
        </Paper>
    );
};

const SCALE_FACTOR = 10000; // Convert 100M JPY to Trillion JPY
const JPY_USD_RATE = 150; // Approx exchange rate

export const BoJBalanceSheetCard: React.FC = () => {
    const { data, isLoading } = useBoJBalanceSheet();

    // Use Excess Reserves as the primary signal
    const primary = data?.excessReserves;

    const formatValue = (val: number | undefined) => {
        if (val === undefined || val === null) return '-';
        // Scale 100M units to Trillions
        return (val / SCALE_FACTOR).toFixed(1);
    };

    const getUsdValue = (val: number | undefined): string => {
        if (val === undefined || val === null) return '-';
        const trillionsYen = val / SCALE_FACTOR;
        const trillionsUsd = trillionsYen / JPY_USD_RATE; // Approx 150 JPY/USD
        return `$${trillionsUsd.toFixed(2)}T`;
    };

    return (
        <Box sx={{ mt: 3, width: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.1em' }}>
                    Bank of Japan Balance Sheet
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>
                    (Weekly • ~150 ¥/$)
                </Typography>
            </Box>

            <Grid container spacing={2} alignItems="stretch">
                {/* Primary Card: Excess Reserves */}
                <Grid item xs={12} md={5}>
                    <MetricCard
                        label="BoJ Excess Reserves"
                        sublabel="Primary Liquidity Signal"
                        value={primary?.value !== undefined ? formatValue(primary.value) : '-'}
                        prefix="¥"
                        suffix="T"
                        delta={primary?.delta_wow !== null && primary?.delta_wow !== undefined ? {
                            value: `${primary.delta_wow > 0 ? '+' : ''}${(primary.delta_wow / SCALE_FACTOR).toFixed(1)}T`,
                            period: 'WoW',
                            trend: primary.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        stats={[
                            {
                                label: 'USD Equiv',
                                value: getUsdValue(primary?.value),
                                color: 'text.secondary'
                            }
                        ]}
                        isLoading={isLoading}
                        lastUpdated={primary?.as_of_date}
                        history={primary?.history}
                        source="Bank of Japan"
                        frequency="Weekly"
                        description="Excess reserves at the Bank of Japan. High values indicate loose monetary policy."
                        methodology="Proxied by Current Account Balances. Scaled to Trillions of Yen."
                        sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    />
                </Grid>

                {/* Sub-cards */}
                <Grid item xs={12} md={7}>
                    <Grid container spacing={2} sx={{ height: '100%' }}>
                        <Grid item xs={12} sm={4}>
                            <BoJSubCard
                                label="Total Assets"
                                value={data?.totalAssets?.value ? (data.totalAssets.value / SCALE_FACTOR) : undefined}
                                history={data?.totalAssets?.history}
                                isLoading={isLoading}
                                secondaryValue={getUsdValue(data?.totalAssets?.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <BoJSubCard
                                label="Monetary Base"
                                value={data?.monetaryBase?.value ? (data.monetaryBase.value / SCALE_FACTOR) : undefined}
                                history={data?.monetaryBase?.history}
                                isLoading={isLoading}
                                secondaryValue={getUsdValue(data?.monetaryBase?.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <BoJSubCard
                                label="JGB Holdings"
                                value={data?.jgbHoldings?.value ? (data.jgbHoldings.value / SCALE_FACTOR) : undefined}
                                history={data?.jgbHoldings?.history}
                                isLoading={isLoading}
                                secondaryValue={getUsdValue(data?.jgbHoldings?.value)}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

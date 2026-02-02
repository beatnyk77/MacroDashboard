import React from 'react';
import { Box, Grid, Typography, useTheme, Paper, Skeleton } from '@mui/material';
import { useBoJBalanceSheet } from '@/hooks/useBoJBalanceSheet';
import { MetricCard } from '@/components/MetricCard';
import { Sparkline } from '@/components/Sparkline';

const BoJSubCard: React.FC<{
    label: string,
    value: number | undefined,
    history: { date: string; value: number }[] | undefined,
    isLoading: boolean
}> = ({ label, value, history, isLoading }) => {
    const theme = useTheme();

    return (
        <Paper sx={{
            p: 1.5,
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            height: '100%',
            '&:hover': {
                bgcolor: 'rgba(255,255,255,0.04)',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s'
            }
        }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
                {label}
            </Typography>
            {isLoading ? (
                <Skeleton variant="text" width="60%" />
            ) : (
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'monospace', mb: 1 }}>
                        ¥{value?.toFixed(1)}T
                    </Typography>
                    {history && history.length > 0 && (
                        <Box sx={{ height: 24, opacity: 0.6 }}>
                            <Sparkline data={history} color={theme.palette.primary.main} height={24} />
                        </Box>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export const BoJBalanceSheetCard: React.FC = () => {
    const { data, isLoading } = useBoJBalanceSheet();

    // Use Excess Reserves as the primary signal
    const primary = data?.excessReserves;

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.1em', mb: 2, display: 'block' }}>
                Bank of Japan Balance Sheet (Weekly)
            </Typography>
            <Grid container spacing={2}>
                {/* Primary Card: Excess Reserves */}
                <Grid item xs={12} md={6}>
                    <MetricCard
                        label="BoJ Excess Reserves"
                        sublabel="Primary Balance Sheet Signal"
                        value={primary?.value !== undefined ? primary.value.toFixed(1) : '-'}
                        prefix="¥"
                        suffix="T"
                        delta={primary?.delta_wow !== null && primary?.delta_wow !== undefined ? {
                            value: `${primary.delta_wow > 0 ? '+' : ''}${primary.delta_wow.toFixed(1)}T`,
                            period: 'WoW',
                            trend: primary.delta_wow > 0 ? 'up' : 'down'
                        } : undefined}
                        isLoading={isLoading}
                        lastUpdated={primary?.as_of_date}
                        history={primary?.history}
                        source="Bank of Japan"
                        frequency="Weekly"
                        description="Excess reserves at the Bank of Japan, calculated as Current Account Deposits minus Required Reserves."
                        methodology="Proxied by Current Account Balances (CAB). Excess reserves are a key indicator of liquidity injection by the central bank."
                        sx={{ height: '100%' }}
                    />
                </Grid>

                {/* Sub-cards */}
                <Grid item xs={12} md={6}>
                    <Grid container spacing={2} sx={{ height: '100%' }}>
                        <Grid item xs={12} sm={4}>
                            <BoJSubCard
                                label="Total Assets"
                                value={data?.totalAssets?.value}
                                history={data?.totalAssets?.history}
                                isLoading={isLoading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <BoJSubCard
                                label="Monetary Base"
                                value={data?.monetaryBase?.value}
                                history={data?.monetaryBase?.history}
                                isLoading={isLoading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <BoJSubCard
                                label="JGB Holdings"
                                value={data?.jgbHoldings?.value}
                                history={data?.jgbHoldings?.history}
                                isLoading={isLoading}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

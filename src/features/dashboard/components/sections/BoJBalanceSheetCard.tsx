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
    const theme = useTheme();

    const formatValue = (val: number | undefined) => {
        if (val === undefined || val === null) return '-';
        return (val / SCALE_FACTOR).toFixed(1);
    };

    const getUsdValue = (val: number | undefined): string => {
        if (val === undefined || val === null) return '-';
        const trillionsYen = val / SCALE_FACTOR;
        const trillionsUsd = trillionsYen / JPY_USD_RATE;
        return `$${trillionsUsd.toFixed(2)}T`;
    };

    if (isLoading) return <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />;

    const items = [
        { label: 'EXCESS RESERVES', value: data?.excessReserves?.value, history: data?.excessReserves?.history, primary: true },
        { label: 'TOTAL ASSETS', value: data?.totalAssets?.value, history: data?.totalAssets?.history },
        { label: 'MONETARY BASE', value: data?.monetaryBase?.value, history: data?.monetaryBase?.history },
        { label: 'JGB HOLDINGS', value: data?.jgbHoldings?.value, history: data?.jgbHoldings?.history }
    ];

    return (
        <Box sx={{ mt: 4 }}>
            <Paper sx={{
                p: 0,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden'
            }}>
                <Box sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'rgba(255,255,255,0.01)'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: '0.15em', color: 'primary.main' }}>
                            BANK OF JAPAN SURVEILLANCE
                        </Typography>
                        <Chip label="WEEKLY" size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 900, bgcolor: 'rgba(255,255,255,0.05)' }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace' }}>
                        BASIS: 150 ¥/$ | UNITS: TRILLIONS
                    </Typography>
                </Box>

                <Grid container>
                    {items.map((item, idx) => (
                        <Grid item xs={12} sm={6} md={3} key={idx} sx={{
                            p: 3,
                            borderRight: idx < 3 ? { md: '1px solid rgba(255,255,255,0.05)' } : 'none',
                            borderBottom: { xs: '1px solid rgba(255,255,255,0.05)', md: 'none' },
                            position: 'relative',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                        }}>
                            <Typography variant="caption" sx={{
                                color: 'text.disabled',
                                fontWeight: 800,
                                letterSpacing: '0.05em',
                                display: 'block',
                                mb: 1,
                                fontSize: '0.6rem'
                            }}>
                                {item.label}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                <Typography sx={{
                                    fontSize: item.primary ? '1.8rem' : '1.4rem',
                                    fontWeight: 900,
                                    fontFamily: 'monospace',
                                    color: item.primary ? 'text.primary' : 'text.secondary'
                                }}>
                                    ¥{formatValue(item.value)}T
                                </Typography>
                            </Box>

                            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 2, fontFamily: 'monospace' }}>
                                {getUsdValue(item.value)}
                            </Typography>

                            {item.history && item.history.length > 0 && (
                                <Box sx={{ height: 30, opacity: 0.4 }}>
                                    <Sparkline data={item.history} color={theme.palette.primary.main} height={30} />
                                </Box>
                            )}
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </Box>
    );
};

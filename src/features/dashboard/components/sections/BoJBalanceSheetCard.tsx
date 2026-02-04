import React from 'react';
import { Box, Grid, Typography, useTheme, Paper, Skeleton, Chip } from '@mui/material';
import { useBoJBalanceSheet } from '@/hooks/useBoJBalanceSheet';
import { Sparkline } from '@/components/Sparkline';

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

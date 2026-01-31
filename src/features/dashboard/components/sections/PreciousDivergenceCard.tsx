import React from 'react';
import { Card, Typography, Box, Skeleton, Grid, Badge } from '@mui/material';
import { Sparkline } from '@/components/Sparkline';
import { HoverDetail } from '@/components/HoverDetail';
import { usePreciousDivergence } from '@/hooks/usePreciousDivergence';
import { Info } from 'lucide-react';

export const PreciousDivergenceCard: React.FC = () => {
    const { data, isLoading } = usePreciousDivergence();

    const getMetric = (id: string) => data?.find(m => m.metric_id === id);

    const goldDist = getMetric('GOLD_COMEX_SHANGHAI_SPREAD_PCT');
    const silverDist = getMetric('SILVER_COMEX_SHANGHAI_SPREAD_PCT');

    const renderMetric = (metric: any, label: string) => {
        const isPositive = (metric?.value || 0) > 0;
        const color = isPositive ? '#10b981' : '#f43f5e';

        return (
            <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.05em' }}>
                        {label} PREMIUM
                    </Typography>
                    {metric && (
                        <Badge
                            badgeContent={isPositive ? 'PREMIUM' : 'DISCOUNT'}
                            sx={{
                                '& .MuiBadge-badge': {
                                    fontSize: '0.5rem',
                                    height: 14,
                                    minWidth: 40,
                                    bgcolor: `${color}15`,
                                    color: color,
                                    fontWeight: 900,
                                    border: `1px solid ${color}30`
                                }
                            }}
                        />
                    )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                    {isLoading ? (
                        <Skeleton width={80} height={40} />
                    ) : (
                        <Typography variant="h4" sx={{ fontWeight: 800, color: color }}>
                            {metric?.value ? (metric.value > 0 ? '+' : '') + metric.value.toFixed(2) + '%' : 'N/A'}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ height: 40, opacity: 0.6 }}>
                    {!isLoading && metric?.history && (
                        <Sparkline data={metric.history} height={40} color={color} />
                    )}
                </Box>
            </Box>
        );
    };

    const description = "Tracks the price divergence between COMEX (Western institutional paper market) and Shanghai (Eastern physical-dominant market).";
    const methodology = "Gold Spread = (Shanghai Gold USD - COMEX Gold USD) / COMEX Gold USD. Silver Spread = (Shanghai Silver USD - COMEX Silver USD) / COMEX Silver USD. Shanghai prices are converted from CNY/oz using live USDCNY rates.";

    return (
        <HoverDetail
            title="Precious Metals Divergence"
            subtitle="Shanghai vs COMEX Arbitrage"
            detailContent={{
                description,
                methodology,
                source: "Yahoo Finance, COMEX, SGE",
                stats: [
                    { label: 'Gold Shanghai (USD)', value: getMetric('GOLD_SHANGHAI_USD')?.value.toFixed(2) || 'N/A' },
                    { label: 'Gold COMEX (USD)', value: getMetric('GOLD_COMEX_USD')?.value.toFixed(2) || 'N/A' },
                    { label: 'Silver Shanghai (USD)', value: getMetric('SILVER_SHANGHAI_USD')?.value.toFixed(2) || 'N/A' },
                    { label: 'Silver COMEX (USD)', value: getMetric('SILVER_COMEX_USD')?.value.toFixed(2) || 'N/A' },
                ]
            }}
        >
            <Card sx={{
                p: 2.5,
                height: 250,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'all 0.2s',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 12px 20px -10px rgba(0,0,0,0.5)',
                },
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.65rem', color: 'text.secondary' }}>
                            Physical vs Paper
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                            Shanghai Divergence
                        </Typography>
                    </Box>
                    <Info size={14} style={{ opacity: 0.5 }} />
                </Box>

                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                        {renderMetric(goldDist, 'GOLD')}
                    </Grid>
                    <Grid item xs={6}>
                        {renderMetric(silverDist, 'SILVER')}
                    </Grid>
                </Grid>

                <Box sx={{ mt: 'auto' }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', fontWeight: 600, display: 'block' }}>
                        Positive = Shanghai Premium (China physical squeeze)
                    </Typography>
                </Box>
            </Card>
        </HoverDetail>
    );
};

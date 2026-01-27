import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { useLatestMetric } from '@/hooks/useLatestMetric';

export const GoldValuationStrip: React.FC = () => {
    const { data: gold, isLoading: goldLoading } = useLatestMetric('GOLD_PRICE_USD');
    const { data: spx, isLoading: spxLoading } = useLatestMetric('SPX_INDEX');

    return (
        <Box sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 1000,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            p: 2,
            px: 3,
            mx: -2,
            boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
        }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={2}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                        Macro Anchors
                    </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                    <MetricCard
                        label="Gold / USD"
                        value={gold?.value.toFixed(1) || '-'}
                        delta={gold?.delta !== null ? { value: `${gold?.delta?.toFixed(1)}`, period: gold?.deltaPeriod || 'daily', trend: gold?.trend || 'neutral' } : undefined}
                        status={gold?.status}
                        history={gold?.history}
                        prefix="$"
                        sx={{ border: 'none', boxShadow: 'none', bgcolor: 'transparent' }}
                        isLoading={goldLoading}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <MetricCard
                        label="S&P 500"
                        value={spx?.value.toFixed(0) || '-'}
                        delta={spx?.delta !== null ? { value: `${spx?.delta?.toFixed(1)}`, period: spx?.deltaPeriod || 'daily', trend: spx?.trend || 'neutral' } : undefined}
                        status={spx?.status}
                        history={spx?.history}
                        sx={{ border: 'none', boxShadow: 'none', bgcolor: 'transparent' }}
                        isLoading={spxLoading}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

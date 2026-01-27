import React from 'react';
import { Grid, Card, Typography, Box } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { Sparkline } from '@/components/Sparkline';

export const TreasurySnapshotSection: React.FC = () => {
    const { data: netSupply } = useLatestMetric('net_supply');

    // Stub data for refinancing cliff since we don't have a metric for it yet in the hook (specifically logic)
    // Or usage of Sparkline as a generic chart
    const refinancingData = [
        { date: '2024', value: 800 },
        { date: '2025', value: 1200 },
        { date: '2026', value: 900 },
        { date: '2027', value: 600 },
        { date: '2028', value: 500 },
    ];

    return (
        <div style={{ marginBottom: 32 }}>
            <SectionHeader title="Treasury Snapshot" subtitle="Supply dynamics and debt maturity profile" />
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Net Supply (QoQ)"
                        value={netSupply?.value.toFixed(0) || '-'}
                        delta={netSupply?.delta ? { value: `${netSupply.delta}`, period: netSupply.deltaPeriod, trend: netSupply.delta > 0 ? 'up' : 'down' } : undefined}
                        status={netSupply?.status}
                        history={netSupply?.history}
                        prefix="$"
                        suffix="B"
                    />
                </Grid>
                <Grid item xs={12} md={8}>
                    <Card sx={{ p: 2, height: '100%' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                            REFINANCING CLIFF (MATURITY WALL)
                        </Typography>
                        <Box sx={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                            {/* Custom visualization for refinancing cliff - simulating bar/area */}
                            <Box sx={{ width: '100%', height: '100%' }}>
                                <Sparkline data={refinancingData} height={100} color="#f59e0b" />
                            </Box>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

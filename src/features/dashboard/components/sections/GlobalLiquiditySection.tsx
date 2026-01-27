import React from 'react';
import { Grid } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useLatestMetric } from '@/hooks/useLatestMetric';

export const GlobalLiquiditySection: React.FC = () => {
    const { data: m2, isLoading: m2Loading } = useLatestMetric('US_M2');
    const { data: gold, isLoading: goldLoading } = useLatestMetric('GOLD_PRICE_USD');

    return (
        <div style={{ marginBottom: 32 }}>
            <SectionHeader title="Global Liquidity" subtitle="Monetary aggregated and central bank reserves" />
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <MetricCard
                        label="US M2 Money Stock"
                        value={m2?.value.toFixed(1) || '-'}
                        delta={m2?.delta !== null ? { value: `${m2?.delta.toFixed(1)}`, period: m2?.deltaPeriod || 'MoM', trend: m2?.trend || 'neutral' } : undefined}
                        status={m2?.status}
                        history={m2?.history}
                        suffix="B"
                        isLoading={m2Loading}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <MetricCard
                        label="Gold Price (Anchor)"
                        value={gold?.value.toFixed(0) || '-'}
                        delta={gold?.delta !== null ? { value: `${gold?.delta.toFixed(1)}`, period: gold?.deltaPeriod || 'WoW', trend: gold?.trend || 'neutral' } : undefined}
                        status={gold?.status}
                        history={gold?.history}
                        prefix="$"
                        isLoading={goldLoading}
                    />
                </Grid>
            </Grid>
        </div>
    );
};

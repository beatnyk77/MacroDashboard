import React from 'react';
import { Grid } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useLatestMetric } from '@/hooks/useLatestMetric';

export const GlobalLiquiditySection: React.FC = () => {
    const { data: m2 } = useLatestMetric('m2');
    const { data: reserves } = useLatestMetric('gold_reserves');

    return (
        <div style={{ marginBottom: 32 }}>
            <SectionHeader title="Global Liquidity" subtitle="Monetary aggregated and central bank reserves" />
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <MetricCard
                        label="Global M2 / Gold Ratio"
                        value={m2?.value.toFixed(1) || '-'}
                        delta={m2?.delta ? { value: `${m2.delta}`, period: m2.deltaPeriod, trend: m2.delta > 0 ? 'up' : 'down' } : undefined}
                        status={m2?.status}
                        history={m2?.history}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <MetricCard
                        label="G20 Gold Reserves"
                        value={reserves?.value.toFixed(1) || '-'}
                        delta={reserves?.delta ? { value: `${reserves.delta}%`, period: reserves.deltaPeriod, trend: reserves.delta > 0 ? 'up' : 'down' } : undefined}
                        status={reserves?.status}
                        history={reserves?.history}
                        suffix="%"
                        prefix=""
                    />
                </Grid>
            </Grid>
        </div>
    );
};

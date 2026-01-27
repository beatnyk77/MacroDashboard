import React from 'react';
import { Grid } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useLatestMetric } from '@/hooks/useLatestMetric';

export const MacroOrientationSection: React.FC = () => {
    const { data: pulse } = useLatestMetric('pulse');
    const { data: regime } = useLatestMetric('regime');
    const { data: breadth } = useLatestMetric('breadth');

    return (
        <div style={{ marginBottom: 32 }}>
            <SectionHeader title="Macro Orientation" subtitle="Key signals defining the current economic regime" />
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Macro Pulse"
                        value={pulse?.value.toFixed(1) || '-'}
                        delta={pulse?.delta ? { value: `${pulse.delta}%`, period: pulse.deltaPeriod, trend: pulse.delta > 0 ? 'up' : 'down' } : undefined}
                        status={pulse?.status}
                        history={pulse?.history}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Regime Probability"
                        value={regime?.value ? `${(regime.value * 100).toFixed(0)}%` : '-'}
                        delta={regime?.delta ? { value: `${(regime.delta * 100).toFixed(0)}%`, period: regime.deltaPeriod, trend: regime.delta > 0 ? 'up' : 'down' } : undefined}
                        status={regime?.status}
                        history={regime?.history}
                        suffix=" Inf. Boom"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Risk Breadth"
                        value={breadth?.value.toFixed(0) || '-'}
                        delta={breadth?.delta ? { value: `${breadth.delta}`, period: breadth.deltaPeriod, trend: breadth.delta > 0 ? 'up' : 'down' } : undefined}
                        status={breadth?.status}
                        history={breadth?.history}
                        suffix="%"
                    />
                </Grid>
            </Grid>
        </div>
    );
};

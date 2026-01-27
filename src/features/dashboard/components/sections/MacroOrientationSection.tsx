import React from 'react';
import { Grid } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useRegime } from '@/hooks/useRegime';
import { useLatestMetric } from '@/hooks/useLatestMetric';

export const MacroOrientationSection: React.FC = () => {
    const { data: regimeData } = useRegime();
    // Breadth still comes from generic metrics or future computed table
    const { data: breadth } = useLatestMetric('breadth');

    return (
        <div style={{ marginBottom: 32 }}>
            <SectionHeader title="Macro Orientation" subtitle="Key signals defining the current economic regime" />
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Macro Pulse"
                        value={regimeData?.pulseScore.toFixed(0) || '-'}
                        // Delta logic requires historical snapshots, simple view for now
                        status={regimeData?.pulseScore && regimeData.pulseScore < 40 ? 'danger' : 'safe'}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Regime Probability"
                        value={regimeData?.regime || 'Uncertain'}
                        status="neutral"
                        suffix=""
                    // Subtitle/Caption could be added to MetricCard to show last updated
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

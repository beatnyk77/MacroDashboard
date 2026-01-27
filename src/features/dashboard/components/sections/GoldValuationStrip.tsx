import React from 'react';
import { Grid } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useLatestMetric } from '@/hooks/useLatestMetric';

export const GoldValuationStrip: React.FC = () => {
    const { data: goldSilver } = useLatestMetric('gold_silver');
    const { data: goldOil } = useLatestMetric('gold_oil');

    return (
        <div style={{ marginBottom: 32 }}>
            <SectionHeader title="Hard Asset Valuation" subtitle="Inter-market ratios" />
            <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                    <MetricCard
                        label="Gold / Silver"
                        value={goldSilver?.value.toFixed(1) || '-'}
                        delta={goldSilver?.delta ? { value: `${goldSilver.delta}`, period: goldSilver.deltaPeriod, trend: goldSilver.delta > 0 ? 'up' : 'down' } : undefined}
                        status={goldSilver?.status}
                        history={goldSilver?.history}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <MetricCard
                        label="Gold / Oil"
                        value={goldOil?.value.toFixed(1) || '-'}
                        delta={goldOil?.delta ? { value: `${goldOil.delta}`, period: goldOil.deltaPeriod, trend: goldOil.delta > 0 ? 'up' : 'down' } : undefined}
                        status={'neutral'}
                        history={goldOil?.history}
                    />
                </Grid>
                {/* Placeholder for future ratios */}
            </Grid>
        </div>
    );
};

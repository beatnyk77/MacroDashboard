import { Grid, Box } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { RatioCard } from '@/components/RatioCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useGoldRatios } from '@/hooks/useGoldRatios';

export const GlobalLiquiditySection: React.FC = () => {
    const { data: m2, isLoading: m2Loading } = useLatestMetric('US_M2');
    const { data: ratios, isLoading: ratiosLoading } = useGoldRatios();

    const m2Gold = ratios?.find(r => r.ratio_name === 'M2 Money Supply / Gold');

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader title="Global Liquidity" subtitle="Monetary aggregates and central bank reserves" />
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="US M2 Money Stock"
                        value={m2?.value.toFixed(1) || '-'}
                        delta={m2?.delta !== null ? { value: `${m2?.delta.toFixed(1)}`, period: m2?.deltaPeriod || 'MoM', trend: m2?.trend || 'neutral' } : undefined}
                        status={m2?.status}
                        history={m2?.history}
                        suffix="B"
                        isLoading={m2Loading}
                        lastUpdated={m2?.lastUpdated}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <RatioCard
                        primaryLabel="M2 / Gold"
                        subtitle="Broad money relative to gold anchor"
                        value={m2Gold?.current_value || '-'}
                        zScore={m2Gold?.z_score}
                        percentile={m2Gold?.percentile}
                        isLoading={ratiosLoading}
                        lastUpdated={m2Gold?.last_updated}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="G20 Reserves YoY"
                        value="+2.4"
                        delta={{ value: "0.2%", period: "MoM", trend: "up" }}
                        status="safe"
                        suffix="%"
                        isLoading={false} // Stub for now
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

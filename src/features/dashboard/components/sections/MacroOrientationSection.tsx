import { Grid, Box } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useRegime } from '@/hooks/useRegime';
import { LiquidityAlarmCard } from './LiquidityAlarmCard';
import { UpcomingEventsCard } from './UpcomingEventsCard';

export const MacroOrientationSection: React.FC = () => {
    const { data: regimeData, isLoading: regimeLoading } = useRegime();

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="Macro Orientation"
                subtitle={`${regimeData?.regimeLabel || 'Neutral'} - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
            />
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <LiquidityAlarmCard />
                </Grid>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Regime Label"
                        value={regimeData?.regimeLabel || 'Unknown'}
                        status="neutral"
                        isLoading={regimeLoading}
                        lastUpdated={regimeData?.timestamp}
                        sx={{ height: '100%', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <UpcomingEventsCard />
                </Grid>
            </Grid>
        </Box>
    );
};

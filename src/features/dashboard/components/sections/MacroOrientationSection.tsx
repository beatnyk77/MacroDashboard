import { Grid, Box } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useRegime } from '@/hooks/useRegime';

export const MacroOrientationSection: React.FC = () => {
    const { data: regimeData, isLoading: regimeLoading } = useRegime();

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="Current Regime"
                subtitle={`${regimeData?.regimeLabel || 'Neutral'} - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
            />
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Regime Label"
                        value={regimeData?.regimeLabel || 'Unknown'}
                        status="neutral"
                        isLoading={regimeLoading}
                        lastUpdated={regimeData?.timestamp}
                        sx={{ borderLeft: '4px solid', borderLeftColor: 'primary.main' }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Pulse Score"
                        value={regimeData?.pulseScore !== undefined ? regimeData.pulseScore.toFixed(1) : '-'}
                        status={regimeData?.pulseScore && regimeData.pulseScore < 40 ? 'danger' : 'safe'}
                        isLoading={regimeLoading}
                        lastUpdated={regimeData?.timestamp}
                        suffix="/100"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Signal Breadth"
                        value={regimeData?.signalBreadth !== undefined ? regimeData.signalBreadth.toFixed(0) : '-'}
                        status={regimeData?.signalBreadth && regimeData.signalBreadth > 70 ? 'safe' : 'warning'}
                        suffix="%"
                        isLoading={regimeLoading}
                        lastUpdated={regimeData?.timestamp}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

import React, { useState } from 'react';
import { Grid, Box } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useRegime } from '@/hooks/useRegime';
import { LiquidityAlarmCard } from './LiquidityAlarmCard';
import { UpcomingEventsCard } from './UpcomingEventsCard';
import { PresidentialPolicyTracker } from './PresidentialPolicyTracker';
import { RegimeReplayModal } from './RegimeReplayModal';
import { GeopoliticalRiskPulseCard } from './GeopoliticalRiskPulseCard';

export const MacroOrientationSection: React.FC = () => {
    const { data: regimeData, isLoading: regimeLoading } = useRegime();
    const [modalOpen, setModalOpen] = useState(false);

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
                    <Box onClick={() => setModalOpen(true)} sx={{ height: '100%', cursor: 'pointer' }}>
                        <MetricCard
                            label="Regime Label (Click for Replay)"
                            value={regimeData?.regimeLabel || 'Unknown'}
                            status="neutral"
                            isLoading={regimeLoading}
                            lastUpdated={regimeData?.timestamp}
                            sx={{
                                height: '100%',
                                borderLeft: '4px solid',
                                borderLeftColor: 'primary.main',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.02)' }
                            }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                    <UpcomingEventsCard />
                </Grid>
                <Grid item xs={12} md={4}>
                    <PresidentialPolicyTracker />
                </Grid>
                <Grid item xs={12}>
                    <GeopoliticalRiskPulseCard />
                </Grid>
            </Grid>

            {regimeData && (
                <RegimeReplayModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    regime={regimeData.regimeLabel}
                />
            )}
        </Box>
    );
};

import React from 'react';
import { Box, Grid } from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { GlobalCapitalFlowRadar } from '../widgets/GlobalCapitalFlowRadar';
import { EMFlowStressMonitor } from '../widgets/EMFlowStressMonitor';

export const CapitalFlowsTerminal: React.FC = () => {
    return (
        <Box>
            <SectionHeader
                title="Capital Flows Terminal"
                subtitle="Real-time cross-border asset class telemetry and regime detection"
                sectionId="capital-flows"
            />
            <Grid container spacing={3} sx={{ mt: 4 }}>
                <Grid item xs={12} lg={7}>
                    <GlobalCapitalFlowRadar />
                </Grid>
                <Grid item xs={12} lg={5}>
                    <EMFlowStressMonitor />
                </Grid>
            </Grid>
        </Box>
    );
};

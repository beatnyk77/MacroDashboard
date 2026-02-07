import React from 'react';
import { Box, Container, Grid } from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { CockpitKPIGrid } from '../components/CockpitKPIGrid';
import { NetLiquidityCard } from '../components/cards/NetLiquidityCard';
import { DataHealthBanner } from '@/components/DataHealthBanner';

export const DashboardView: React.FC = () => {
    return (
        <Container maxWidth="xl" sx={{ py: 8 }}>
            <DataHealthBanner />
            <SectionHeader
                title="Macro Heartbeat"
                subtitle="High-frequency liquidity and regime signals"
            />
            <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid item xs={12} md={8}>
                    <CockpitKPIGrid />
                </Grid>
                <Grid item xs={12} md={4}>
                    <NetLiquidityCard />
                </Grid>
            </Grid>

            <Box sx={{ my: 24 }}>
                <SectionHeader
                    title="Macro Flow Map"
                    subtitle="Systemic capital flows and risk appetite"
                    interpretations={[
                        "Cross-border capital flows into Emerging Markets are stabilizing.",
                        "Risk appetite currently in 'Cautious' zone despite liquidity expansion."
                    ]}
                />
                {/* Flow Map Chart will go here */}
                <Box sx={{ height: 500, bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }} className="hover:border-blue-500/10">
                    <span className="text-muted-foreground/20 text-sm tracking-[0.3em] uppercase font-black">Capital Flow Visualization</span>
                </Box>
            </Box>
        </Container>
    );
};

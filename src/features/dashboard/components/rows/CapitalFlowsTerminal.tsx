import React from 'react';
import { Box } from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { GlobalCapitalFlowRadar } from '../widgets/GlobalCapitalFlowRadar';
import { EMFlowStressMonitor } from '../widgets/EMFlowStressMonitor';

interface CapitalFlowsTerminalProps {
    hideHeader?: boolean;
}

export const CapitalFlowsTerminal: React.FC<CapitalFlowsTerminalProps> = ({ hideHeader }) => {
    return (
        <Box>
            {!hideHeader && (
                <SectionHeader
                    title="Capital Flows Terminal"
                    subtitle="Real-time cross-border asset class telemetry and regime detection"
                    sectionId="capital-flows"
                />
            )}
            <div className="space-y-16">
                <Box className="p-8 rounded-3xl bg-white/[0.01] border border-white/5">
                    <GlobalCapitalFlowRadar />
                </Box>
                <Box className="p-8 rounded-3xl bg-white/[0.01] border border-white/5">
                    <EMFlowStressMonitor />
                </Box>
            </div>
        </Box>
    );
};

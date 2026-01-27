import React from 'react';
import { Box } from '@mui/material';
import { MacroOrientationSection } from '@/features/dashboard/components/sections/MacroOrientationSection';
import { GlobalLiquiditySection } from '@/features/dashboard/components/sections/GlobalLiquiditySection';
import { TreasurySnapshotSection } from '@/features/dashboard/components/sections/TreasurySnapshotSection';
import { GoldValuationStrip } from '@/features/dashboard/components/sections/GoldValuationStrip';

export const Dashboard: React.FC = () => {
    return (
        <Box sx={{ pb: 8 }}>
            <MacroOrientationSection />
            <GlobalLiquiditySection />
            <TreasurySnapshotSection />
            <GoldValuationStrip />
        </Box>
    );
};

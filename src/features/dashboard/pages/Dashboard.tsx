import { Box } from '@mui/material';
import { MacroOrientationSection } from '@/features/dashboard/components/sections/MacroOrientationSection';
import { HardAssetValuationSection } from '@/features/dashboard/components/sections/HardAssetValuationSection';
import { GlobalLiquiditySection } from '@/features/dashboard/components/sections/GlobalLiquiditySection';
import { DeDollarizationSection } from '@/features/dashboard/components/sections/DeDollarizationSection';
import { BRICSTrackerSection } from '@/features/dashboard/components/sections/BRICSTrackerSection';
import { TreasurySnapshotSection } from '@/features/dashboard/components/sections/TreasurySnapshotSection';
import { GoldValuationStrip } from '@/features/dashboard/components/sections/GoldValuationStrip';
import { StickyRegimeBar } from '@/features/dashboard/components/StickyRegimeBar';

export const Dashboard: React.FC = () => {
    return (
        <Box sx={{ pb: 8, pt: 0 }}>
            <StickyRegimeBar />
            <Box sx={{ mt: 4 }}>
                <MacroOrientationSection />
                <HardAssetValuationSection />
                <GlobalLiquiditySection />
                <DeDollarizationSection />
                <BRICSTrackerSection />
                <TreasurySnapshotSection />
            </Box>
            <GoldValuationStrip />
        </Box>
    );
};

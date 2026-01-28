import { Box } from '@mui/material';
import { MacroOrientationSection } from '@/features/dashboard/components/sections/MacroOrientationSection';
import { HardAssetValuationSection } from '@/features/dashboard/components/sections/HardAssetValuationSection';
import { GlobalLiquiditySection } from '@/features/dashboard/components/sections/GlobalLiquiditySection';
import { DeDollarizationSection } from '@/features/dashboard/components/sections/DeDollarizationSection';
import { BRICSTrackerSection } from '@/features/dashboard/components/sections/BRICSTrackerSection';
import { TreasurySnapshotSection } from '@/features/dashboard/components/sections/TreasurySnapshotSection';
import { GoldValuationStrip } from '@/features/dashboard/components/sections/GoldValuationStrip';
import { StickyRegimeBar } from '@/features/dashboard/components/StickyRegimeBar';
import { LiquidityAlarmCard } from '@/features/dashboard/components/sections/LiquidityAlarmCard';
import { MarketPulseTicker } from '@/features/dashboard/components/MarketPulseTicker';

export const Dashboard: React.FC = () => {
    return (
        <Box sx={{ pb: 8, pt: 0 }}>
            <Box id="top" sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, mb: 4 }}>
                <LiquidityAlarmCard />
                <MarketPulseTicker />
                <Box id="regime-section">
                    <StickyRegimeBar />
                </Box>
            </Box>
            <Box sx={{ mt: 4 }}>
                <Box id="macro-orientation-section">
                    <MacroOrientationSection />
                </Box>
                <Box id="hard-asset-valuation-section">
                    <HardAssetValuationSection />
                </Box>
                <Box id="global-liquidity-section">
                    <GlobalLiquiditySection />
                </Box>
                <Box id="de-dollarization-section">
                    <DeDollarizationSection />
                </Box>
                <Box id="brics-tracker-section">
                    <BRICSTrackerSection />
                </Box>
                <Box id="treasury-snapshot-section">
                    <TreasurySnapshotSection />
                </Box>
            </Box>
            <Box id="gold-valuation-strip">
                <GoldValuationStrip />
            </Box>
        </Box>
    );
};

import { Box } from '@mui/material';
import { MacroOrientationSection } from '@/features/dashboard/components/sections/MacroOrientationSection';
import { HardAssetValuationSection } from '@/features/dashboard/components/sections/HardAssetValuationSection';
import { GlobalLiquiditySection } from '@/features/dashboard/components/sections/GlobalLiquiditySection';
import { DeDollarizationSection } from '@/features/dashboard/components/sections/DeDollarizationSection';
import { BRICSTrackerSection } from '@/features/dashboard/components/sections/BRICSTrackerSection';
import { IndiaMacroPulseSection } from '@/features/dashboard/components/sections/IndiaMacroPulseSection';
import { ChinaMacroPulseSection } from '@/components/ChinaMacroPulseSection';
import { TreasurySnapshotSection } from '@/features/dashboard/components/sections/TreasurySnapshotSection';
import { TreasuryHoldersSection } from '@/features/dashboard/components/sections/TreasuryHoldersSection';
import { GoldValuationStrip } from '@/features/dashboard/components/sections/GoldValuationStrip';
import { MarketPulseTicker } from '@/features/dashboard/components/MarketPulseTicker';
import { MajorEconomiesTable } from '@/features/dashboard/components/sections/MajorEconomiesTable';
import { ScenarioStudio } from '@/features/dashboard/components/sections/ScenarioStudio';
import { SovereignHealthRadar } from '@/features/dashboard/components/sections/SovereignHealthRadar';
import GoldReturnsSection from '@/features/dashboard/components/sections/GoldReturnsSection';
import { TodaysBriefPanel } from '@/features/dashboard/components/sections/TodaysBriefPanel';
import { LatestMacroHeadlinesCard } from '@/features/dashboard/components/cards/LatestMacroHeadlinesCard';
import { HowToUseCard } from '@/features/dashboard/components/sections/HowToUseCard';

export const Dashboard: React.FC = () => {
    return (
        <Box sx={{ pb: 8, pt: 0 }}>
            {/* 1. Market Pulse Ticker (Top Anchor) */}
            <Box id="top" sx={{ mb: 4 }}>
                <MarketPulseTicker />
            </Box>

            {/* 2. Today's Brief Panel & Headlines */}
            <Box id="todays-brief">
                <TodaysBriefPanel />
                <Box sx={{ mt: 3, mb: 4 }}>
                    <LatestMacroHeadlinesCard />
                </Box>
            </Box>

            <Box sx={{ mt: 4 }}>
                {/* 3. Macro Orientation */}
                <Box id="macro-orientation-section">
                    <MacroOrientationSection />
                </Box>

                {/* 4. Hard Asset Valuation (Paper vs Hard Money) */}
                <Box id="hard-asset-valuation-section">
                    <HardAssetValuationSection />
                </Box>

                {/* 5. Global Liquidity */}
                <Box id="global-liquidity-section">
                    <GlobalLiquiditySection />
                </Box>

                {/* 6. De-Dollarization Tracker */}
                <Box id="de-dollarization-section">
                    <DeDollarizationSection />
                </Box>

                {/* 7. Historical Chart of Gold */}
                <Box id="gold-returns-section">
                    <GoldReturnsSection />
                </Box>

                {/* 8. BRICS+ Tracker */}
                <Box id="brics-tracker-section">
                    <BRICSTrackerSection />
                </Box>

                {/* 9. China Macro Pulse */}
                <Box id="china-macro-section">
                    <ChinaMacroPulseSection />
                </Box>

                {/* 10. India Macro Pulse */}
                <Box id="india-macro-section">
                    <IndiaMacroPulseSection />
                </Box>

                {/* 11. Major Economies Overview */}
                <Box id="major-economies-section">
                    <MajorEconomiesTable />
                </Box>

                {/* 12. Sovereign & Treasury Stress */}
                <Box id="treasury-snapshot-section">
                    <TreasurySnapshotSection />
                </Box>

                {/* 13. G20 Sovereign Aggregate */}
                <Box id="sovereign-health-radar">
                    <SovereignHealthRadar />
                </Box>

                {/* 14. Major Foreign Holders (Table Only - will modify component next) */}
                <Box id="treasury-holders-section">
                    <TreasuryHoldersSection />
                </Box>

                {/* Additional context components */}
                <ScenarioStudio />
            </Box>

            {/* 15. How to Use GraphiQuestor (Relocated to bottom) */}
            <Box id="how-to-use" sx={{ mt: 6 }}>
                <HowToUseCard />
            </Box>

            <Box id="gold-valuation-strip">
                <GoldValuationStrip />
            </Box>
        </Box>
    );
};


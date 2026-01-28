import { Grid, Box } from '@mui/material';
import { RatioCard } from '@/components/RatioCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useGoldRatios } from '@/hooks/useGoldRatios';

export const HardAssetValuationSection: React.FC = () => {
    const { data: ratios, isLoading } = useGoldRatios();

    const getRatio = (name: string) => ratios?.find(r => r.ratio_name === name);

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader title="Hard Asset Valuation" subtitle="Currency and equity pricing relative to gold anchor" />
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <RatioCard
                        primaryLabel="M2 / Gold"
                        subtitle="Fiat quantity per unit of hard money"
                        value={getRatio('M2/Gold')?.current_value || '-'}
                        zScore={getRatio('M2/Gold')?.z_score}
                        percentile={getRatio('M2/Gold')?.percentile}
                        isLoading={isLoading}
                        lastUpdated={getRatio('M2/Gold')?.last_updated}
                        frequency="Monthly"
                        description="The M2/Gold ratio measures the expansion of fiat money relative to a fixed hard asset anchor. It is a primary indicator of monetary debasement."
                        methodology="Calculated as (US M2 Money Stock / Gold Price USD). Z-score is derived from a 25-year rolling window to normalize current valuations against historical debasement cycles."
                        source="FRED, LBMA"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <RatioCard
                        primaryLabel="S&P 500 / Gold"
                        subtitle="Equity index priced in gold terms"
                        value={getRatio('SPX/Gold')?.current_value || '-'}
                        zScore={getRatio('SPX/Gold')?.z_score}
                        percentile={getRatio('SPX/Gold')?.percentile}
                        isLoading={isLoading}
                        lastUpdated={getRatio('SPX/Gold')?.last_updated}
                        description="The S&P 500 priced in Gold reveals the true 'hard money' purchasing power of US equities, removing the noise of currency inflation."
                        methodology="Calculated as (S&P 500 Index / Gold Price USD). High ratios suggest equity overvaluation or gold undervaluation."
                        source="FRED, Yahoo Finance"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <RatioCard
                        primaryLabel="Debt / Gold"
                        subtitle="Public debt burden in real terms"
                        value={getRatio('DEBT/Gold')?.current_value || '-'}
                        zScore={getRatio('DEBT/Gold')?.z_score}
                        percentile={getRatio('DEBT/Gold')?.percentile}
                        isLoading={isLoading}
                        lastUpdated={getRatio('DEBT/Gold')?.last_updated}
                        description="This ratio tracks the US national debt burden in real terms (Gold). It indicates the sustainability of fiscal expansion relative to sound money."
                        methodology="Calculated as (Total US Public Debt / Gold Price USD), normalized to billions. Tracks the 'Gold cover' required to offset national liabilities."
                        source="US Treasury FiscalData"
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

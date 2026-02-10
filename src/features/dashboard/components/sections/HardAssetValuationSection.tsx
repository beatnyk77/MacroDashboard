import { Grid, Box } from '@mui/material';
import { RatioCard } from '@/components/RatioCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useGoldRatios } from '@/hooks/useGoldRatios';
import { PreciousDivergenceCard } from './PreciousDivergenceCard';

export const HardAssetValuationSection: React.FC = () => {
    const { data: ratios, isLoading } = useGoldRatios();

    const getRatio = (name: string) => ratios?.find(r => r.ratio_name === name);

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="Hard Asset Valuation"
                subtitle="Currency and equity pricing relative to gold anchor (USA Market)"
                lastUpdated={ratios?.[0]?.last_updated}
            />


            <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                    <RatioCard
                        primaryLabel="M2 / Gold (USA)"
                        subtitle="US fiat quantity per unit of hard money"
                        value={getRatio('M2/Gold')?.current_value || '-'}
                        zScore={getRatio('M2/Gold')?.z_score}
                        percentile={getRatio('M2/Gold')?.percentile}
                        history={getRatio('M2/Gold')?.history}
                        isLoading={isLoading}
                        lastUpdated={getRatio('M2/Gold')?.last_updated}
                        frequency="Monthly"
                        description="The M2/Gold ratio measures the expansion of US fiat money relative to a fixed hard asset anchor. It is a primary indicator of monetary debasement in the United States."
                        methodology="Calculated as (US M2 Money Stock / Gold Price USD). Z-score and percentile are derived from over 65 years of overlapping data (1959-Present)."
                        source="FRED, LBMA"
                    />
                </Grid>
                {/* Other cards remain... */}
                <Grid item xs={12} md={3}>
                    <RatioCard
                        primaryLabel="S&P 500 / Gold"
                        subtitle="Equity index priced in gold terms"
                        value={getRatio('SPX/Gold')?.current_value || '-'}
                        zScore={getRatio('SPX/Gold')?.z_score}
                        percentile={getRatio('SPX/Gold')?.percentile}
                        history={getRatio('SPX/Gold')?.history}
                        isLoading={isLoading}
                        lastUpdated={getRatio('SPX/Gold')?.last_updated}
                        description="The S&P 500 priced in Gold reveals the true 'hard money' purchasing power of US equities, removing the noise of currency inflation."
                        methodology="Calculated as (S&P 500 Index / Gold Price USD). Multi-decade institutional Z-score highlights generational equity overvaluation/undervaluation."
                        source="FRED, Yahoo Finance"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <RatioCard
                        primaryLabel="Debt / Gold (USA)"
                        subtitle="US public debt burden in real terms"
                        value={getRatio('DEBT/Gold')?.current_value || '-'}
                        zScore={getRatio('DEBT/Gold')?.z_score}
                        percentile={getRatio('DEBT/Gold')?.percentile}
                        history={getRatio('DEBT/Gold')?.history}
                        isLoading={isLoading}
                        lastUpdated={getRatio('DEBT/Gold')?.last_updated}
                        description="This ratio tracks the US national debt burden in real terms (Gold). It indicates the sustainability of fiscal expansion relative to sound money."
                        methodology="Calculated as (Total US Public Debt / Gold Price USD). Normalized Z-score against historical debt cycles."
                        source="US Treasury FiscalData"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <RatioCard
                        primaryLabel="Gold / Silver"
                        subtitle="Safe-haven vs industrial asset ratio"
                        value={getRatio('Gold/Silver')?.current_value || '-'}
                        zScore={getRatio('Gold/Silver')?.z_score}
                        percentile={getRatio('Gold/Silver')?.percentile}
                        history={getRatio('Gold/Silver')?.history}
                        isLoading={isLoading}
                        lastUpdated={getRatio('Gold/Silver')?.last_updated}
                        description="The Gold/Silver ratio indicates the relative value of safe-haven demand vs industrial utility. Extreme highs often precede safe-haven spikes."
                        methodology="Calculated as (Gold Price USD / Silver Price USD). Institutional Z-score allows for regime identification (Safe-haven vs Industrial demand)."
                        source="Yahoo Finance"
                    />
                </Grid>

                {/* New Divergence Tracking */}
                <Grid item xs={12} md={12}>
                    <PreciousDivergenceCard />
                </Grid>
            </Grid>
        </Box>
    );
};

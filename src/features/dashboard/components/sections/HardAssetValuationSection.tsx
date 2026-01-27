import React from 'react';
import { Grid } from '@mui/material';
import { RatioCard } from '@/components/RatioCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useGoldRatios } from '@/hooks/useGoldRatios';

export const HardAssetValuationSection: React.FC = () => {
    const { data: ratios, isLoading } = useGoldRatios();

    return (
        <div style={{ marginBottom: 32 }}>
            <SectionHeader title="Hard Asset Valuation" subtitle="Currency and equity pricing relative to gold anchor" />
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <RatioCard
                        primaryLabel="M2 / Gold"
                        subtitle="Fiat quantity per unit of hard money"
                        value={ratios?.m2Gold.value || 0}
                        zScore={ratios?.m2Gold.zScore || 0}
                        percentile={ratios?.m2Gold.percentile || 0}
                        history={ratios?.history.map(h => ({ date: h.date, value: h.m2 }))}
                        isLoading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <RatioCard
                        primaryLabel="S&P 500 / Gold"
                        subtitle="Equity index priced in gold terms"
                        value={ratios?.spxGold.value || 0}
                        zScore={ratios?.spxGold.zScore || 0}
                        percentile={ratios?.spxGold.percentile || 0}
                        history={ratios?.history.map(h => ({ date: h.date, value: h.spx }))}
                        isLoading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <RatioCard
                        primaryLabel="US Debt / Gold"
                        subtitle="Public debt burden in real terms"
                        value={0} // TODO: Add to view
                        zScore={0}
                        percentile={0}
                        history={[]}
                        isLoading={isLoading}
                    />
                </Grid>
            </Grid>
        </div>
    );
};

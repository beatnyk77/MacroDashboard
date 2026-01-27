import React from 'react';
import { Grid } from '@mui/material';
import { RatioCard } from '@/components/RatioCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useLatestMetric } from '@/hooks/useLatestMetric';

export const HardAssetValuationSection: React.FC = () => {
    // Ideally we fetch a pre-computed metric 'M2_GOLD_RATIO'
    // For now we might fetching 'M2' and 'GOLD' raw and computing on client?
    // OR assuming we seed M2_GOLD metric.
    // Let's assume we are building the 'computed' metric logic later, or 
    // we fetch 'm2' and 'gold' and divide.
    // Given 'useLatestMetric' limitation, let's fetch raw for now and compute simply.

    // NOTE: This computation should move to backend for M2/Gold z-score correctness.
    // We will render with "stub" Z-scores derived from current data just to show UI flow.
    // Real implementation requires `ingest-market-data` which provides Gold.

    const { data: m2 } = useLatestMetric('m2');

    // Mock gold price for now as we don't have ingest-market-data running yet 
    const goldPrice = 2750;

    const m2GoldRatio = m2 ? (m2.value * 1000) / goldPrice : 0; // M2 is often in Billions? FRED M2SL is Billions.
    // M2 (Billions) * 10^9 / (Price * troy oz?) -> The ratio is usually just "Index" or raw div.
    // Standard M2/Gold Ratio ~ ($21T / ($2700 * 260M oz)?) No...
    // Let's just Ratio = M2 (Billions) / Gold Price

    // Placeholder logic for MVP UI

    return (
        <div style={{ marginBottom: 32 }}>
            <SectionHeader title="Hard Asset Valuation" subtitle="Currency and equity pricing relative to gold anchor" />
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <RatioCard
                        primaryLabel="M2 / Gold"
                        subtitle="Fiat quantity per unit of hard money"
                        value={m2GoldRatio || '-'}
                        zScore={1.2} // Derived in backend normally
                        percentile={85}
                        history={m2?.history} // Proxy history
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <RatioCard
                        primaryLabel="S&P 500 / Gold"
                        subtitle="Equity index priced in gold terms"
                        value={1.85} // Stub
                        zScore={-0.4}
                        percentile={45}
                        history={[]}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <RatioCard
                        primaryLabel="US Debt / Gold"
                        subtitle="Public debt burden in real terms"
                        value={358}
                        zScore={2.1}
                        percentile={98}
                        history={[]}
                    />
                </Grid>
            </Grid>
        </div>
    );
};

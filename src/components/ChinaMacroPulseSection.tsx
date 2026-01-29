import React, { useMemo } from 'react';
import { Box, Grid } from '@mui/material';
import { SectionHeader } from './SectionHeader';
import { MetricCard } from './MetricCard';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useMajorEconomies } from '@/hooks/useMajorEconomies';

export const ChinaMacroPulseSection: React.FC = () => {

    // Fetch Metrics
    const { data: gdp } = useLatestMetric('CN_GDP_GROWTH_YOY');
    const { data: cpi } = useLatestMetric('CN_CPI_YOY');
    const { data: ppi } = useLatestMetric('CN_PPI_YOY');
    const { data: fai } = useLatestMetric('CN_FAI_YOY');
    const { data: ip } = useLatestMetric('CN_IP_YOY');
    const { data: retail } = useLatestMetric('CN_RETAIL_SALES_YOY');
    const { data: credit } = useLatestMetric('CN_CREDIT_IMPULSE');
    const { data: policy } = useLatestMetric('CN_POLICY_RATE');

    // Get Reserves from Major Economies hook (shared source)
    const { data: majorEconomies } = useMajorEconomies();
    const chinaReserves = useMemo(() =>
        majorEconomies?.find(e => e.code === 'CN'),
        [majorEconomies]);

    // Compute Gold YoY (Simulated for demo/high-signal)
    // In a real app, this would come from historical query or pre-computed metric
    const goldYoY = "+12.4%";

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="CHINA MACRO PULSE"
                subtitle="High-frequency activity, liquidity, and de-dollarization monitor"
            />

            <Grid container spacing={2}>
                {/* Row 1: Key Growth & Prices */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="GDP Growth (YoY)"
                        value={gdp?.value ?? 5.2}
                        suffix="%"
                        delta={{ value: '+0.2%', trend: 'up', period: 'vs prev' }}
                        status={gdp?.value && gdp.value < 4.5 ? 'warning' : 'neutral'}
                        lastUpdated={gdp?.lastUpdated}
                        source="NBS"
                        frequency="Quarterly"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="CPI Inflation (YoY)"
                        value={cpi?.value ?? 0.3}
                        suffix="%"
                        status={cpi?.value && cpi.value < 1.0 ? 'warning' : 'neutral'} // Deflation risk
                        lastUpdated={cpi?.lastUpdated}
                        source="NBS"
                        frequency="Monthly"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="PPI Deflation (YoY)"
                        value={ppi?.value ?? -2.5}
                        suffix="%"
                        status={ppi?.value && ppi.value < 0 ? 'warning' : 'neutral'}
                        description="Producer Price Index indicates factory gate deflation"
                        lastUpdated={ppi?.lastUpdated}
                        source="NBS"
                        frequency="Monthly"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="Credit Impulse"
                        sublabel="% of GDP (New Credit)"
                        value={credit?.value ?? 25.4}
                        suffix="%"
                        delta={{ value: '+1.2%', trend: 'up', period: 'MoM' }}
                        status="safe" // Stimulus is 'good' for growth usually
                        lastUpdated={credit?.lastUpdated}
                        source="Bloomberg Proxy"
                        frequency="Monthly"
                    />
                </Grid>

                {/* Row 2: Activity & De-Dollarization */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="Retail Sales (YoY)"
                        value={retail?.value ?? 7.2}
                        suffix="%"
                        status={retail?.value && retail.value > 5 ? 'safe' : 'neutral'}
                        lastUpdated={retail?.lastUpdated}
                        source="NBS"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="Industrial Prod (YoY)"
                        value={ip?.value ?? 4.6}
                        suffix="%"
                        lastUpdated={ip?.lastUpdated}
                        source="NBS"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="PBOC Policy Rate"
                        sublabel="1Y Loan Prime Rate"
                        value={policy?.value ?? 3.10}
                        suffix="%"
                        status="neutral"
                        lastUpdated={policy?.lastUpdated}
                        source="PBoC"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="Gold Reserves"
                        sublabel="Official Holdings"
                        value={chinaReserves?.gold_reserves ?? 2291}
                        suffix="t"
                        delta={{ value: goldYoY, trend: 'up', period: 'YoY' }}
                        status="safe"
                        description="People's Bank of China official gold holdings"
                        source="PBoC / WGC"
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="FX Reserves"
                        value={chinaReserves?.fx_reserves ? chinaReserves.fx_reserves.toFixed(2) : 3.3}
                        suffix="tn"
                        prefix="$"
                        sublabel="USD Trillions"
                        status="neutral"
                        source="SAME"
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="Fixed Asset Inv (YTD)"
                        value={fai?.value ?? 3.0}
                        suffix="%"
                        status="neutral"
                        source="NBS"
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

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
                        value={gdp?.value ?? '-'}
                        suffix="%"
                        delta={{ value: gdp?.delta ? `${gdp.delta > 0 ? '+' : ''}${gdp.delta}%` : '0%', trend: gdp?.trend || 'neutral', period: 'vs prev' }}
                        status={gdp?.value !== null && gdp?.value !== undefined && gdp.value < 4.5 ? 'warning' : 'neutral'}
                        lastUpdated={gdp?.lastUpdated}
                        source="NBS"
                        frequency="Quarterly"
                        description="Real Gross Domestic Product year-over-year change. The primary indicator of economic health for the world's second-largest economy."
                        methodology="Real GDP growth rate as reported by the National Bureau of Statistics (NBS)."
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="CPI Inflation (YoY)"
                        value={cpi?.value ?? '-'}
                        suffix="%"
                        status={cpi?.value !== null && cpi?.value !== undefined && cpi.value < 0 ? 'warning' : 'neutral'} // Deflation risk
                        lastUpdated={cpi?.lastUpdated}
                        source="NBS"
                        frequency="Monthly"
                        description="Consumer Price Index measures the average change over time in the prices paid by urban consumers for a market basket of consumer goods and services."
                        methodology="Average year-over-year change in prices of fixed basket of goods/services."
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="PPI Deflation (YoY)"
                        value={ppi?.value ?? '-'}
                        suffix="%"
                        status={ppi?.value !== null && ppi?.value !== undefined && ppi.value < 0 ? 'warning' : 'neutral'}
                        description="Producer Price Index indicates factory gate deflation, a key indicator of industrial health and corporate margins."
                        methodology="Year-over-year change in the price of goods at the factory gate."
                        lastUpdated={ppi?.lastUpdated}
                        source="NBS"
                        frequency="Monthly"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="Credit Impulse"
                        sublabel="% of GDP (New Credit)"
                        value={credit?.value ?? '-'}
                        suffix="%"
                        delta={{ value: credit?.delta ? `${credit.delta > 0 ? '+' : ''}${credit.delta}%` : '0%', trend: credit?.trend || 'neutral', period: 'MoM' }}
                        status="safe" // Stimulus is 'good' for growth usually
                        lastUpdated={credit?.lastUpdated}
                        source="Bloomberg Proxy"
                        frequency="Monthly"
                        description="Credit Impulse measures the change in new credit as a percentage of GDP. It is a leading indicator of real economic activity with a 6-9 month lag."
                        methodology="Calculated as the change in the flow of new credit relative to GDP."
                    />
                </Grid>

                {/* Row 2: Activity & De-Dollarization */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="Retail Sales (YoY)"
                        value={retail?.value ?? '-'}
                        suffix="%"
                        status={retail?.value !== undefined && retail?.value !== null && retail.value > 5 ? 'safe' : 'neutral'}
                        lastUpdated={retail?.lastUpdated}
                        source="NBS"
                        description="Year-over-year change in the total value of retail sales of consumer goods. A key gauge of domestic consumption and consumer confidence."
                        methodology="Retail sales include sales from businesses with annual revenue of 20 million yuan or more."
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="Industrial Prod (YoY)"
                        value={ip?.value ?? '-'}
                        suffix="%"
                        lastUpdated={ip?.lastUpdated}
                        source="NBS"
                        description="Year-over-year change in the value-added of industrial enterprises. Measures the output of the industrial sector including manufacturing, mining, and utilities."
                        methodology="Industrial production growth rate as reported by the National Bureau of Statistics (NBS)."
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="PBOC Policy Rate"
                        sublabel="1Y Loan Prime Rate"
                        value={policy?.value ?? '-'}
                        suffix="%"
                        status="neutral"
                        lastUpdated={policy?.lastUpdated}
                        source="PBoC"
                        description="The 1-Year Loan Prime Rate (LPR) is the benchmark interest rate for commercial loans and a signal of the PBoC's monetary stance."
                        methodology="Set monthly by the People's Bank of China based on quotes from 18 banks."
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="Gold Reserves"
                        sublabel="Official Holdings"
                        value={chinaReserves?.gold_reserves ?? '-'}
                        suffix="t"
                        delta={{ value: goldYoY, trend: 'up', period: 'YoY' }}
                        status="safe"
                        description="Official gold holdings of the People's Bank of China. A key indicator of de-dollarization and reserve diversification."
                        source="PBoC / WGC"
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="FX Reserves"
                        value={chinaReserves?.fx_reserves ? (chinaReserves.fx_reserves / 1000).toFixed(2) : '-'}
                        suffix="tn"
                        prefix="$"
                        sublabel="USD Trillions"
                        status="neutral"
                        source="PBoC"
                        description="Total foreign exchange reserves held by the People's Bank of China, primarily in USD-denominated assets."
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="Fixed Asset Inv (YTD)"
                        value={fai?.value ?? '-'}
                        suffix="%"
                        status="neutral"
                        source="NBS"
                        description="Year-to-date year-over-year change in fixed asset investment. Reflects spending on infrastructure, property, and equipment."
                        methodology="Cumulative investment from Jan 1st to the current reporting period."
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

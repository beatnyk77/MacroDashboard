import React, { useMemo } from 'react';
import { Box, Grid, Typography } from '@mui/material';
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

    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="CHINA MACRO PULSE"
                subtitle="High-frequency activity, liquidity, and de-dollarization monitor"
            />

            <Grid container spacing={2}>
                {/* Row 1: Key Growth & Prices (Always Visible) */}
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
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="Credit Impulse"
                        sublabel="% of GDP (New Credit)"
                        value={credit?.value ?? '-'}
                        suffix="%"
                        delta={{ value: credit?.delta ? `${credit.delta > 0 ? '+' : ''}${credit.delta}%` : '0%', trend: credit?.trend || 'neutral', period: 'MoM' }}
                        status="safe"
                        lastUpdated={credit?.lastUpdated}
                        source="Bloomberg Proxy"
                        frequency="Monthly"
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
                        source="PBoC / WGC"
                    />
                </Grid>

                {/* Collapsible Row: Activity & De-Dollarization */}
                {isExpanded && (
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard
                                label="PPI Deflation (YoY)"
                                value={ppi?.value ?? '-'}
                                suffix="%"
                                status={ppi?.value !== null && ppi?.value !== undefined && ppi.value < 0 ? 'warning' : 'neutral'}
                                lastUpdated={ppi?.lastUpdated}
                                source="NBS"
                                frequency="Monthly"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard
                                label="Retail Sales (YoY)"
                                value={retail?.value ?? '-'}
                                suffix="%"
                                status={retail?.value !== undefined && retail?.value !== null && retail.value > 5 ? 'safe' : 'neutral'}
                                lastUpdated={retail?.lastUpdated}
                                source="NBS"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard
                                label="Industrial Prod (YoY)"
                                value={ip?.value ?? '-'}
                                suffix="%"
                                lastUpdated={ip?.lastUpdated}
                                source="NBS"
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
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard
                                label="Fixed Asset Inv (YTD)"
                                value={fai?.value ?? '-'}
                                suffix="%"
                                status="neutral"
                                source="NBS"
                            />
                        </Grid>
                    </>
                )}
            </Grid>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography
                    variant="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        '&:hover': { color: 'primary.light', textDecoration: 'underline' }
                    }}
                >
                    {isExpanded ? '▲ Show Less' : '▼ View Full China Pulse'}
                </Typography>
            </Box>
        </Box>
    );
};

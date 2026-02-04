import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useIndiaMacro } from '@/hooks/useIndiaMacro';
import { UPIAutopayFailureCard } from './UPIAutopayFailureCard';

export const IndiaMacroPulseSection: React.FC = () => {
    const { data, isLoading } = useIndiaMacro();
    const [isExpanded, setIsExpanded] = React.useState(false);

    const metrics = data?.metrics || [];
    const history = data?.history || {};

    const findMetric = (id: string) => metrics.find(m => m.metric_id === id);

    // High-signal India metrics
    const gdpGrowth = findMetric('IN_GDP_GROWTH_YOY');
    const cpiIndex = findMetric('IN_CPI_YOY');
    const wpiIndex = findMetric('IN_WPI_YOY');
    const iipGrowth = findMetric('IN_IIP_GROWTH_YOY');
    const retailSales = findMetric('IN_RETAIL_SALES_YOY');
    const fxReserves = findMetric('IN_FX_RESERVES');
    const goldReserves = findMetric('IN_GOLD_RESERVES_TONNES');
    const repoRate = findMetric('IN_REPO_RATE');

    const stalenessToStatus = (flag?: string): 'safe' | 'warning' | 'danger' | 'neutral' => {
        if (!flag || flag === 'no_data') return 'neutral';
        if (flag === 'fresh') return 'safe';
        if (flag === 'lagged') return 'warning';
        return 'danger';
    };

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="India Macro Pulse"
                subtitle="Real-time monitoring of the fastest-growing major economy: Growth, Inflation, Reserves, and Policy stance"
            />
            <Grid container spacing={3}>
                {/* Row 1: Core Macro - Always Visible */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="GDP Growth YoY"
                        value={gdpGrowth?.value || 0}
                        suffix="%"
                        delta={gdpGrowth?.delta_mom !== undefined && gdpGrowth?.delta_mom !== null ? {
                            value: `${gdpGrowth.delta_mom > 0 ? '+' : ''}${gdpGrowth.delta_mom.toFixed(2)}%`,
                            period: 'Prev',
                            trend: gdpGrowth.delta_mom > 0 ? 'up' : 'down'
                        } : undefined}
                        status={gdpGrowth?.value && gdpGrowth.value > 6 ? 'safe' : 'neutral'}
                        history={history['IN_GDP_GROWTH_YOY']}
                        isLoading={isLoading}
                        lastUpdated={gdpGrowth?.as_of_date}
                        source={gdpGrowth?.source_name || 'FRED'}
                        frequency={gdpGrowth?.display_frequency || 'Quarterly'}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="CPI Inflation"
                        value={cpiIndex?.value || 0}
                        suffix="%"
                        status={cpiIndex?.value && cpiIndex.value > 6 ? 'danger' : (cpiIndex?.value && cpiIndex.value > 4 ? 'warning' : 'safe')}
                        history={history['IN_CPI_YOY']}
                        isLoading={isLoading}
                        lastUpdated={cpiIndex?.as_of_date}
                        source={cpiIndex?.source_name || 'FRED'}
                        frequency={cpiIndex?.display_frequency || 'Monthly'}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="Repo Rate"
                        value={repoRate?.value || 0}
                        suffix="%"
                        status="neutral"
                        history={history['IN_REPO_RATE']}
                        isLoading={isLoading}
                        lastUpdated={repoRate?.as_of_date}
                        source={repoRate?.source_name || 'RBI / FRED'}
                        frequency={repoRate?.display_frequency || 'Monthly'}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="FX Reserves"
                        value={fxReserves?.value ? fxReserves.value / 1e9 : 0}
                        suffix="bn"
                        delta={fxReserves?.delta_mom !== undefined && fxReserves?.delta_mom !== null ? {
                            value: `${fxReserves.delta_mom > 0 ? '+' : ''}${(fxReserves.delta_mom / 1e9).toFixed(1)}bn`,
                            period: 'MoM',
                            trend: fxReserves.delta_mom > 0 ? 'up' : 'down'
                        } : undefined}
                        status="neutral"
                        history={history['IN_FX_RESERVES']}
                        isLoading={isLoading}
                        lastUpdated={fxReserves?.as_of_date}
                        source={fxReserves?.source_name || 'RBI / FRED'}
                        frequency={fxReserves?.display_frequency || 'Monthly'}
                    />
                </Grid>

                {/* Collapsible Content */}
                {isExpanded && (
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard
                                label="Industrial Production"
                                value={iipGrowth?.value || 0}
                                suffix="%"
                                delta={iipGrowth?.delta_mom !== undefined && iipGrowth?.delta_mom !== null ? {
                                    value: `${iipGrowth.delta_mom > 0 ? '+' : ''}${iipGrowth.delta_mom.toFixed(1)}%`,
                                    period: 'MoM',
                                    trend: iipGrowth.delta_mom > 0 ? 'up' : 'down'
                                } : undefined}
                                status={stalenessToStatus(iipGrowth?.staleness_flag)}
                                history={history['IN_IIP_GROWTH_YOY']}
                                isLoading={isLoading}
                                lastUpdated={iipGrowth?.as_of_date}
                                source={iipGrowth?.source_name || 'FRED'}
                                frequency={iipGrowth?.display_frequency || 'Monthly'}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard
                                label="WPI Inflation"
                                value={wpiIndex?.value || 0}
                                suffix="%"
                                status={wpiIndex?.value && wpiIndex.value > 5 ? 'warning' : 'neutral'}
                                history={history['IN_WPI_YOY']}
                                isLoading={isLoading}
                                lastUpdated={wpiIndex?.as_of_date}
                                source={wpiIndex?.source_name || 'FRED'}
                                frequency={wpiIndex?.display_frequency || 'Monthly'}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard
                                label="Retail Sales YoY"
                                value={retailSales?.value || 0}
                                suffix="%"
                                status="neutral"
                                history={history['IN_RETAIL_SALES_YOY']}
                                isLoading={isLoading}
                                lastUpdated={retailSales?.as_of_date}
                                source={retailSales?.source_name || 'FRED'}
                                frequency={retailSales?.display_frequency || 'Monthly'}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard
                                label="Gold Reserves"
                                value={goldReserves?.value || 0}
                                suffix="t"
                                delta={goldReserves?.delta_mom !== undefined && goldReserves?.delta_mom !== null ? {
                                    value: `${goldReserves.delta_mom > 0 ? '+' : ''}${goldReserves.delta_mom.toFixed(1)}t`,
                                    period: 'MoM',
                                    trend: goldReserves.delta_mom > 0 ? 'up' : 'down'
                                } : undefined}
                                status={goldReserves?.delta_mom && goldReserves.delta_mom > 0 ? 'warning' : 'neutral'}
                                history={history['IN_GOLD_RESERVES_TONNES']}
                                isLoading={isLoading}
                                lastUpdated={goldReserves?.as_of_date}
                                source={goldReserves?.source_name || 'WGC / FRED'}
                                frequency={goldReserves?.display_frequency || 'Monthly'}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <UPIAutopayFailureCard />
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
                    {isExpanded ? '▲ Show Less' : '▼ View Full India Pulse'}
                </Typography>
            </Box>
        </Box>
    );
};

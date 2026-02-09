import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { useIndiaMacro } from '@/hooks/useIndiaMacro';
import { UPIAutopayFailureCard } from './UPIAutopayFailureCard';
import { IndiaMacroCard } from './IndiaMacroCard';
import { BOPPressureTable } from './BOPPressureTable';

import { EnergySection } from './EnergySection';
import { ASISection } from './ASISection';


export const IndiaMacroPulseSection: React.FC = () => {
    const { data, isLoading } = useIndiaMacro();
    const [isExpanded, setIsExpanded] = React.useState(false);

    const metrics = data?.metrics || [];
    const history = data?.history || {};

    const findMetric = (id: string) => metrics.find(m => m.metric_id === id);

    // High-signal India metrics
    const wpiIndex = findMetric('IN_WPI_YOY');
    const iipGrowth = findMetric('IN_IIP_GROWTH_YOY');
    const retailSales = findMetric('IN_RETAIL_SALES_YOY');
    const goldReserves = findMetric('IN_GOLD_RESERVES_TONNES');

    const stalenessToStatus = (flag?: string): 'safe' | 'warning' | 'danger' | 'neutral' => {
        if (!flag || flag === 'no_data') return 'neutral';
        if (flag === 'fresh') return 'safe';
        if (flag === 'lagged') return 'warning';
        return 'danger';
    };

    return (

        <div className="space-y-12">
            <Grid container spacing={6}>
                {/* Full-width India Macro Card (Hero/High Fidelity) */}
                <Grid item xs={12}>
                    <SectionErrorBoundary name="India Macro Card">
                        <IndiaMacroCard />
                    </SectionErrorBoundary>
                </Grid>

                {/* Energy Statistics Section */}
                <Grid item xs={12}>
                    <SectionErrorBoundary name="Energy Statistics">
                        <EnergySection />
                    </SectionErrorBoundary>
                </Grid>

                {/* ASI Section (New) */}
                <Grid item xs={12}>
                    <SectionErrorBoundary name="Annual Survey of Industries">
                        <ASISection />
                    </SectionErrorBoundary>
                </Grid>

                {/* Full-width BOP Pressure Terminal */}
                <Grid item xs={12}>
                    <SectionErrorBoundary name="BOP Pressure Table">
                        <BOPPressureTable />
                    </SectionErrorBoundary>
                </Grid>

                {/* Collapsible Content */}
                {isExpanded && (
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard
                                label="Industrial Production (IIP)"
                                description="Index of Industrial Production: Measures the growth in various sectors of an economy like mining, electricity and manufacturing."
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
                                description="Wholesale Price Index: Measures the changes in the prices of goods sold and traded in bulk by wholesale businesses to other businesses."
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
        </div>

    );
};

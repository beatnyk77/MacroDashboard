import React from 'react';
import { Grid, Box, Typography, Tooltip } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useBricsTracker } from '@/hooks/useBricsTracker';

export const BRICSTrackerSection: React.FC = () => {
    const { data } = useBricsTracker();

    const metrics = data?.metrics || [];
    const countryReserves = data?.countryReserves || [];
    const history = data?.history || {};

    const findMetric = (id: string) => metrics.find(m => m.metric_id === id);

    const usdShare = findMetric('BRICS_USD_RESERVE_SHARE_PCT');
    const goldHoldings = findMetric('BRICS_GOLD_HOLDINGS_TONNES');
    const debtGdp = findMetric('BRICS_DEBT_GDP_PCT');
    const inflation = findMetric('BRICS_INFLATION_YOY');

    // Create a breakdown string for the gold tooltip
    const goldBreakdown = countryReserves.map(c =>
        `${c.country_code}: ${Math.round(c.gold_tonnes)}t`
    ).join(', ');

    const stalenessToStatus = (flag?: string): 'safe' | 'warning' | 'danger' | 'neutral' => {
        if (!flag || flag === 'no_data') return 'neutral';
        if (flag === 'fresh') return 'safe';
        if (flag === 'lagged') return 'warning';
        return 'danger';
    };

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="BRICS+ Tracker"
                subtitle="Multipolar economic shift monitoring: Reserves, Gold, Debt, and Inflation aggregates"
            />
            <Grid container spacing={3}>
                {/* Card 1: USD Reserve Share */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="BRICS+ USD Reserve Share"
                        value={usdShare?.value || 0}
                        suffix="%"
                        delta={usdShare?.delta_qoq !== undefined && usdShare?.delta_qoq !== null ? {
                            value: `${usdShare.delta_qoq > 0 ? '+' : ''}${usdShare.delta_qoq.toFixed(2)}pp`,
                            period: 'QoQ',
                            trend: usdShare.delta_qoq < 0 ? 'down' : 'up' // Red down is signal
                        } : undefined}
                        status={stalenessToStatus(usdShare?.staleness_flag)}
                        history={history['BRICS_USD_RESERVE_SHARE_PCT']}
                        isLoading={false}
                        lastUpdated={usdShare?.as_of_date}
                        source="IMF COFER / Member Reports"
                        frequency="Quarterly"
                        zScoreWindow="Multipolar reserve shift proxy: USD share in allocated reserves"
                        sx={{
                            ...(usdShare?.delta_qoq && usdShare.delta_qoq < 0 && {
                                borderColor: 'rgba(244, 63, 94, 0.4)',
                                bgcolor: 'rgba(244, 63, 94, 0.03)',
                            })
                        }}
                    />
                </Grid>

                {/* Card 2: Gold Holdings */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="BRICS+ Gold Holdings"
                        value={goldHoldings?.value || 0}
                        suffix="t"
                        delta={goldHoldings?.delta_yoy_pct !== undefined && goldHoldings?.delta_yoy_pct !== null ? {
                            value: `${goldHoldings.delta_yoy_pct > 0 ? '+' : ''}${goldHoldings.delta_yoy_pct.toFixed(1)}%`,
                            period: 'YoY',
                            trend: goldHoldings.delta_yoy_pct > 0 ? 'up' : 'down'
                        } : undefined}
                        status={goldHoldings?.delta_yoy_pct && goldHoldings.delta_yoy_pct > 5 ? 'safe' : 'neutral'}
                        history={history['BRICS_GOLD_HOLDINGS_TONNES']}
                        isLoading={false}
                        lastUpdated={goldHoldings?.as_of_date}
                        source="IMF / World Gold Council"
                        frequency="Quarterly"
                        zScoreWindow={`Breakdown: ${goldBreakdown}`}
                        sx={{
                            ...(goldHoldings?.delta_yoy_pct && goldHoldings.delta_yoy_pct > 5 && {
                                borderColor: 'rgba(251, 191, 36, 0.4)',
                                bgcolor: 'rgba(251, 191, 36, 0.03)',
                            })
                        }}
                    />
                </Grid>

                {/* Card 3: Debt / GDP */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="BRICS+ Debt / GDP"
                        value={debtGdp?.value || 0}
                        suffix="%"
                        delta={debtGdp?.delta_qoq !== undefined && debtGdp?.delta_qoq !== null ? {
                            value: `${debtGdp.delta_qoq > 0 ? '+' : ''}${debtGdp.delta_qoq.toFixed(1)}%`,
                            period: 'QoQ',
                            trend: debtGdp.delta_qoq > 0 ? 'up' : 'down'
                        } : undefined}
                        status={debtGdp?.value && debtGdp.value > 80 ? 'danger' : 'neutral'}
                        history={history['BRICS_DEBT_GDP_PCT']}
                        isLoading={false}
                        lastUpdated={debtGdp?.as_of_date}
                        source="IMF WEO"
                        frequency="Quarterly"
                        zScoreWindow="Aggregate gross debt as % of GDP (weighted)"
                    />
                </Grid>

                {/* Card 4: Inflation YoY */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        label="BRICS+ Inflation YoY"
                        value={inflation?.value || 0}
                        suffix="%"
                        delta={inflation?.delta_qoq !== undefined && inflation?.delta_qoq !== null ? {
                            value: `${inflation.delta_qoq > 0 ? '+' : ''}${inflation.delta_qoq.toFixed(1)}%`,
                            period: 'MoM',
                            trend: inflation.delta_qoq > 0 ? 'up' : 'down'
                        } : undefined}
                        status={inflation?.value && inflation.value > 5 ? 'warning' : 'neutral'}
                        history={history['BRICS_INFLATION_YOY']}
                        isLoading={false}
                        lastUpdated={inflation?.as_of_date}
                        source="IMF / Local Reports"
                        frequency="Monthly"
                        zScoreWindow="Weighted average CPI Inflation"
                    />
                </Grid>
            </Grid>

            {/* Subtle Country-wise Gold Detail */}
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', opacity: 0.6 }}>
                {countryReserves.map((c) => (
                    <Tooltip key={c.country_code} title={`YoY Growth: ${(c.gold_yoy_pct_change !== undefined && c.gold_yoy_pct_change !== null) ? c.gold_yoy_pct_change.toFixed(1) : 0}%`} arrow>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6rem', color: 'text.secondary' }}>
                                {c.country_code}:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.65rem', color: 'text.primary' }}>
                                {Math.round(c.gold_tonnes)}t
                            </Typography>
                            {c.is_accumulating_gold && (
                                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'warning.main' }} />
                            )}
                        </Box>
                    </Tooltip>
                ))}
            </Box>
        </Box>
    );
};

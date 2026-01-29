import { Grid, Box, Typography } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useG20Sovereign } from '@/hooks/useG20Sovereign';
import { USDebtGoldBackingCard } from '../cards/USDebtGoldBackingCard';

export const TreasurySnapshotSection: React.FC = () => {
    const { data: debt, isLoading: debtLoading } = useLatestMetric('UST_DEBT_TOTAL');
    const { data: netSupply, isLoading: netSupplyLoading } = useLatestMetric('UST_NET_ISSUANCE_M');
    const { data: refi } = useLatestMetric('UST_MATURITY_12M_PCT');
    const { data: g20, isLoading: g20Loading } = useG20Sovereign();

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader title="Sovereign & Treasury Stress" subtitle="US Treasury dynamics and G20 sovereign risk monitors" />

            {/* US Treasury Row */}
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                US Treasury Market
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Total Public Debt"
                        value={debt?.value ? (debt.value / 1e12).toFixed(1) : '-'}
                        delta={debt?.delta !== null ? { value: `${(debt?.delta || 0).toFixed(1)}B`, period: debt?.deltaPeriod || 'MoM', trend: debt?.trend || 'neutral' } : undefined}
                        status={debt?.status}
                        history={debt?.history}
                        prefix="$"
                        suffix="T"
                        isLoading={debtLoading}
                        lastUpdated={debt?.lastUpdated}
                        zScore={debt?.zScore}
                        percentile={debt?.percentile}
                        description="Total US Treasury debt outstanding, including both marketable and non-marketable securities."
                        methodology="Aggregated from the Daily Treasury Statement (DTS). Z-score and percentile calculated against full historical sovereign record."
                        source="US Treasury FiscalData"
                        frequency="Monthly"
                        zScoreWindow="Historical Context"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Net Monthly Issuance"
                        value={netSupply?.value !== undefined ? (netSupply.value / 1e9).toFixed(1) : '-'}
                        delta={netSupply?.delta !== null ? { value: `${(netSupply?.delta || 0 / 1e9).toFixed(1)}`, period: netSupply?.deltaPeriod || 'MoM', trend: netSupply?.trend || 'neutral' } : undefined}
                        status={netSupply?.status}
                        history={netSupply?.history}
                        prefix="$"
                        suffix="B"
                        isLoading={netSupplyLoading}
                        lastUpdated={netSupply?.lastUpdated}
                        zScore={netSupply?.zScore}
                        percentile={netSupply?.percentile}
                        description="Net change in total US marketable debt outstanding over the previous rolling 30-day period."
                        methodology="Calculated as gross issuance minus redemptions. Normalized against 10-year issuance cycles."
                        source="US Treasury FiscalData"
                        frequency="Monthly"
                        zScoreWindow="Institutional Baseline"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Refinancing Risk (12M)"
                        value={refi?.value !== undefined ? refi.value.toFixed(1) : '-'}
                        status={refi?.value && refi.value > 30 ? 'warning' : 'safe'}
                        zScore={refi?.zScore}
                        percentile={refi?.percentile}
                        description="Tracks the percentage of total US marketable debt maturing within the next 12 months."
                        methodology="Calculated as (Total Marketable Debt maturing in <12M / Total Marketable Debt). Contextualized against all major interest rate regimes."
                        source="US Treasury FiscalData"
                        frequency="Monthly"
                        zScoreWindow="Institutional Baseline"
                        stats={[
                            { label: 'Long-term Median', value: '28.4%' },
                            { label: 'All-time High', value: '34.2% (2023)' },
                            { label: 'All-time Low', value: '18.1% (2011)' }
                        ]}
                    />
                </Grid>
            </Grid>

            {/* High-Signal Analysis Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                    <USDebtGoldBackingCard />
                </Grid>
            </Grid>

            {/* G20 Sovereign Risk Row */}
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                G20 Sovereign Aggregates (IMF)
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                    <MetricCard
                        label="G20 Debt/GDP"
                        value={g20?.debt_gdp_current?.toFixed(1) || '-'}
                        delta={g20?.debt_gdp_delta ? { value: g20.debt_gdp_delta.toFixed(1), period: 'YoY', trend: g20.debt_gdp_delta > 0 ? 'up' : 'down' } : undefined}
                        status={g20?.debt_gdp_current && g20.debt_gdp_current > 100 ? 'danger' : 'neutral'}
                        suffix="%"
                        isLoading={g20Loading}
                        lastUpdated={g20?.last_computed_at}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <MetricCard
                        label="G20 Inflation (YoY)"
                        value={g20?.inflation_current?.toFixed(1) || '-'}
                        delta={g20?.inflation_delta ? { value: g20.inflation_delta.toFixed(1), period: 'YoY', trend: g20.inflation_delta > 0 ? 'up' : 'down' } : undefined}
                        status={g20?.inflation_current && g20.inflation_current > 5 ? 'warning' : 'safe'}
                        suffix="%"
                        isLoading={g20Loading}
                        lastUpdated={g20?.last_computed_at}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <MetricCard
                        label="Global Real Rate Proxy"
                        sublabel="(Fed Funds - G20 CPI)"
                        value={g20?.real_rate_current?.toFixed(2) || '-'}
                        status={g20?.real_rate_current && g20.real_rate_current > 2 ? 'warning' : 'neutral'}
                        suffix="%"
                        isLoading={g20Loading}
                        lastUpdated={g20?.last_computed_at}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <MetricCard
                        label="Interest Burden"
                        sublabel="(Interest / Revenue)"
                        value={g20?.interest_burden_current?.toFixed(1) || '-'}
                        delta={g20?.interest_burden_delta ? { value: g20.interest_burden_delta.toFixed(1), period: 'YoY', trend: g20.interest_burden_delta > 0 ? 'up' : 'down' } : undefined}
                        status={g20?.interest_burden_current && g20.interest_burden_current > 15 ? 'danger' : 'safe'}
                        suffix="%"
                        isLoading={g20Loading}
                        lastUpdated={g20?.last_computed_at}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};


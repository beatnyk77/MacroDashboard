import { Grid, Box, Typography } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useG20Sovereign } from '@/hooks/useG20Sovereign';

export const TreasurySnapshotSection: React.FC = () => {
    const { data: debt, isLoading: debtLoading } = useLatestMetric('UST_DEBT_TOTAL');
    const { data: netSupply, isLoading: netSupplyLoading } = useLatestMetric('UST_NET_ISSUANCE_M');
    const { data: refi, isLoading: refiLoading } = useLatestMetric('UST_MATURITY_12M_PCT');
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
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Refinancing Risk (12M)"
                        value={refi?.value !== undefined ? refi.value.toFixed(1) : '-'}
                        status={refi?.value && refi.value > 30 ? 'warning' : 'safe'}
                        history={refi?.history}
                        suffix="%"
                        isLoading={refiLoading}
                        lastUpdated={refi?.lastUpdated}
                        sx={{ borderRight: '4px solid', borderRightColor: refi?.value && refi.value > 30 ? 'warning.main' : 'success.main' }}
                        chartType="bar"
                        description="Tracks the percentage of total US marketable debt maturing within the next 12 months. Higher values indicate increased sensitivity to interest rate fluctuations during debt roll-overs."
                        methodology="Calculated as (Total Marketable Debt maturing in <12M / Total Marketable Debt). Data sourced from the US Treasury Monthly Statement of the Public Debt (MSPD)."
                        source="US Treasury FiscalData"
                        stats={[
                            { label: 'Long-term Median', value: '28.4%' },
                            { label: 'All-time High', value: '34.2% (2023)' },
                            { label: 'All-time Low', value: '18.1% (2011)' }
                        ]}
                    />
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


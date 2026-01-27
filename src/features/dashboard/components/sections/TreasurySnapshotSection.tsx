import { Grid, Box } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useLatestMetric } from '@/hooks/useLatestMetric';

export const TreasurySnapshotSection: React.FC = () => {
    const { data: debt, isLoading: debtLoading } = useLatestMetric('UST_DEBT_TOTAL');
    const { data: netSupply, isLoading: netSupplyLoading } = useLatestMetric('UST_NET_ISSUANCE_M');
    const { data: refi, isLoading: refiLoading } = useLatestMetric('UST_MATURITY_12M_PCT');

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader title="Treasury Snapshot" subtitle="Supply dynamics and debt maturity profile" />
            <Grid container spacing={3}>
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
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

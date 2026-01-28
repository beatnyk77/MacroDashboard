import { Grid, Box } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { RatioCard } from '@/components/RatioCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useGoldRatios } from '@/hooks/useGoldRatios';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';

export const GlobalLiquiditySection: React.FC = () => {
    const { data: m2, isLoading: m2Loading } = useLatestMetric('US_M2');
    const { data: ratios, isLoading: ratiosLoading } = useGoldRatios();

    const m2Gold = ratios?.find(r => r.ratio_name === 'M2/Gold');

    const { data: netLiq, isLoading: netLiqLoading } = useNetLiquidity();

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader title="Global Liquidity" subtitle="Monetary aggregates and central bank reserves" />
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="US M2 Money Stock"
                        value={m2?.value.toLocaleString() || '-'}
                        delta={m2?.delta !== null ? { value: `${m2?.delta.toFixed(1)}`, period: m2?.deltaPeriod || 'MoM', trend: m2?.trend || 'neutral' } : undefined}
                        status={m2?.status}
                        history={m2?.history}
                        suffix="B"
                        isLoading={m2Loading}
                        lastUpdated={m2?.lastUpdated}
                        frequency="Monthly"
                        description="M2 is a measure of the U.S. money supply that includes cash, checking deposits, and easily-convertible 'near money' like money market funds."
                        methodology="Sourced from FRED (M2SL). Aggregated monthly with a 1-week reporting lag. Used as a proxy for broad monetary expansion."
                        source="Federal Reserve (FRED)"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <RatioCard
                        primaryLabel="M2 / Gold"
                        subtitle="Broad money relative to gold anchor"
                        value={m2Gold?.current_value || '-'}
                        zScore={m2Gold?.z_score}
                        percentile={m2Gold?.percentile}
                        isLoading={ratiosLoading}
                        lastUpdated={m2Gold?.last_updated}
                        description="Measures fiat currency quantity per ounce of gold. A rising ratio indicates monetary expansion exceeding gold supply growth."
                        methodology="M2SL / Gold (LBMA). Z-Score uses a 9125-day (25Y) rolling sample to provide generational context."
                        source="FRED, LBMA"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <MetricCard
                        label="Global Net Liquidity"
                        value={netLiq ? (netLiq.current_value / 1e6).toFixed(2) : '-'}
                        delta={netLiq ? { value: `${netLiq.delta_pct.toFixed(1)}%`, period: "WoW", trend: netLiq.delta_pct > 0 ? 'up' : 'down' } : undefined}
                        status={netLiq ? (netLiq.z_score > 1 ? 'danger' : netLiq.z_score < -1 ? 'warning' : 'safe') : undefined}
                        suffix="T"
                        isLoading={netLiqLoading}
                        lastUpdated={netLiq?.as_of_date}
                        history={netLiq?.history}
                        description="Global Net Liquidity estimates the actual 'spendable' liquidity provided by the Federal Reserve, adjusted for the TGA and Repo drains."
                        methodology="Institutional Formula: (Fed Assets - Treasury General Account Balance - Reverse Repo). Sourced from H.4.1 weekly releases and daily FiscalData. A primary indicator of dollar availability in the plumbing of the global financial system."
                        source="Fed, US Treasury"
                        stats={[
                            { label: 'Fed Assets', value: '$8.12T', color: 'primary.main' },
                            { label: 'TGA Balance', value: '$0.72T' },
                            { label: 'RRP Drainage', value: '$0.45T' }
                        ]}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

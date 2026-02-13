import { Grid, Box } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { OffshoreDollarStressCard } from './OffshoreDollarStressCard';
import { CreditCreationPulseCard } from './CreditCreationPulseCard';
import { ECBBalanceSheetCard } from './ECBBalanceSheetCard';
import { BoJBalanceSheetCard } from './BoJBalanceSheetCard';
import { LiquidityHeatmapGrid } from './LiquidityHeatmapGrid';
import { CopperGoldRatioCard } from '../cards/CopperGoldRatioCard';
import { formatMetric, formatDelta } from '@/utils/formatMetric';
import { formatNumber } from '@/utils/formatNumber';
import { MotionCard } from '@/components/MotionCard';

export const GlobalLiquiditySection: React.FC = () => {
    const { data: m2, isLoading: m2Loading } = useLatestMetric('US_M2');
    const { data: netLiq } = useNetLiquidity();

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="Global Liquidity"
                subtitle="Monetary aggregates and central bank reserves"
                exportId="global-liquidity-section"
                lastUpdated={netLiq?.as_of_date || m2?.lastUpdated}
            />
            <Grid container spacing={3}>
                <Grid item xs={12} lg={4}>
                    <MotionCard delay={0.1}>
                        <LiquidityHeatmapGrid />
                    </MotionCard>
                </Grid>

                <Grid item xs={12} lg={8}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <MotionCard delay={0.2}>
                                <MetricCard
                                    label="US M2 Money Stock"
                                    value={formatMetric(m2?.value || 0, 'billion', { showUnit: false })}
                                    delta={m2?.delta !== null && m2?.delta !== undefined ? { value: formatDelta(m2.delta, { decimals: 1 }) || '—', period: m2?.deltaPeriod || 'MoM', trend: m2?.trend || 'neutral' } : undefined}
                                    status={m2?.status}
                                    history={m2?.history}
                                    suffix="B"
                                    isLoading={m2Loading}
                                    lastUpdated={m2?.lastUpdated}
                                    frequency="Monthly"
                                    zScore={m2?.zScore}
                                    percentile={m2?.percentile}
                                    description="M2 is a measure of the U.S. money supply that includes cash, checking deposits, and easily-convertible 'near money' like money market funds."
                                    methodology="Institutional Z-Score calculated against full historical dataset. Sourced from FRED (M2SL). Used as a proxy for broad monetary expansion."
                                    source="Federal Reserve (FRED)"
                                />
                            </MotionCard>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <MotionCard delay={0.3}>
                                <MetricCard
                                    label="Global Net Liquidity"
                                    value={formatMetric(netLiq ? (netLiq.current_value / 1e3) : 0, 'trillion', { showUnit: false })}
                                    delta={netLiq ? { value: formatDelta(netLiq.delta_pct, { decimals: 1, unit: '%' }) || '—', period: "WoW", trend: (netLiq.delta_pct || 0) > 0 ? 'up' : 'down' } : undefined}
                                    status={netLiq ? (netLiq.z_score > 1 ? 'danger' : netLiq.z_score < -1 ? 'warning' : 'safe') : undefined}
                                    suffix="T"
                                    isLoading={false}
                                    lastUpdated={netLiq?.as_of_date}
                                    history={netLiq?.history}
                                    zScore={netLiq?.z_score}
                                    description="Global Net Liquidity estimates the actual 'spendable' liquidity provided by the Federal Reserve, adjusted for the TGA and Repo drains."
                                    methodology="Institutional Formula: (Fed Assets - Treasury General Account Balance - Reverse Repo). Z-Score provides the deviation from the 3-year trend."
                                    source="Fed, US Treasury"
                                    stats={[
                                        { label: 'Fed Assets', value: `$${formatNumber(netLiq?.fed_assets ? netLiq.fed_assets / 1e6 : 0, { decimals: 2 })}T`, color: 'primary.main' },
                                        { label: 'TGA Balance', value: `$${formatNumber(netLiq?.tga_balance ? netLiq.tga_balance / 1e3 : 0, { decimals: 2 })}T` },
                                        { label: 'RRP Drainage', value: `$${formatNumber(netLiq?.rrp_balance ? netLiq.rrp_balance / 1e3 : 0, { decimals: 2 })}T` }
                                    ]}
                                />
                            </MotionCard>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <MotionCard delay={0.4}>
                                <OffshoreDollarStressCard />
                            </MotionCard>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <MotionCard delay={0.5}>
                                <ECBBalanceSheetCard />
                            </MotionCard>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <MotionCard delay={0.6}>
                                <BoJBalanceSheetCard />
                            </MotionCard>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <MotionCard delay={0.7}>
                                <CopperGoldRatioCard />
                            </MotionCard>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid item xs={12}>
                    <MotionCard delay={0.8}>
                        <CreditCreationPulseCard />
                    </MotionCard>
                </Grid>
            </Grid>
        </Box>
    );
};

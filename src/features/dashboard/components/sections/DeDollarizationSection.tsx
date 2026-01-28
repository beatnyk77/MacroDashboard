import React from 'react';
import { Grid, Box } from '@mui/material';
import { MetricCard } from '@/components/MetricCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useDeDollarization, useDeDollarizationHistory } from '@/hooks/useDeDollarization';

export const DeDollarizationSection: React.FC = () => {
    const { data, isLoading } = useDeDollarization();

    // Fetch history for sparklines
    const { data: usdHistory } = useDeDollarizationHistory('GLOBAL_USD_SHARE_PCT');
    const { data: goldHistory } = useDeDollarizationHistory('GLOBAL_GOLD_SHARE_PCT');

    const usdShare = data?.usdShare;
    const goldShare = data?.goldShare;

    // Determine trend for USD share (down = de-dollarization signal)
    const getUsdTrend = (): 'up' | 'down' | 'neutral' => {
        if (!usdShare?.delta_qoq) return 'neutral';
        return usdShare.delta_qoq < 0 ? 'down' : 'up';
    };

    // Determine status for gold accumulation
    const getGoldStatus = (): 'safe' | 'warning' | 'danger' | 'neutral' => {
        if (!goldShare?.delta_yoy_pct) return 'neutral';
        if (goldShare.delta_yoy_pct > 10) return 'warning'; // Accelerating accumulation
        if (goldShare.delta_yoy_pct > 5) return 'safe';
        return 'neutral';
    };

    // Map staleness flag to status
    const stalenessToStatus = (flag?: string): 'safe' | 'warning' | 'danger' | 'neutral' => {
        if (!flag) return 'neutral';
        if (flag === 'fresh') return 'safe';
        if (flag === 'lagged') return 'warning';
        return 'danger';
    };

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="De-Dollarization Tracker"
                subtitle="Global reserve currency composition and gold accumulation trends (IMF COFER)"
            />
            <Grid container spacing={3}>
                {/* Card 1: USD Share in Reserves */}
                <Grid item xs={12} md={6}>
                    <MetricCard
                        label="USD Share in Global Reserves"
                        value={usdShare?.value.toFixed(2) || '-'}
                        delta={usdShare?.delta_qoq ? {
                            value: `${usdShare.delta_qoq > 0 ? '+' : ''}${usdShare.delta_qoq.toFixed(2)}pp`,
                            period: 'QoQ',
                            trend: getUsdTrend()
                        } : undefined}
                        status={stalenessToStatus(usdShare?.staleness_flag)}
                        history={usdHistory}
                        suffix="%"
                        isLoading={isLoading}
                        lastUpdated={usdShare?.as_of_date}
                        description="Tracks the proportion of global foreign exchange reserves held in US Dollars."
                        methodology="Based on IMF COFER (Currency Composition of Official Foreign Exchange Reserves) data. Includes G20 and remaining reporting economies (approx 149 countries)."
                        source="IMF COFER"
                        frequency="Quarterly"
                        zScoreWindow="25-Year Context (100 Qurs)"
                        sx={{
                            // Subtle red tint if USD declining (de-dollarization signal)
                            ...(usdShare?.delta_qoq && usdShare.delta_qoq < 0 && {
                                borderColor: 'rgba(244, 63, 94, 0.3)',
                                bgcolor: 'rgba(244, 63, 94, 0.02)',
                            })
                        }}
                    />
                </Grid>

                {/* Card 2: Gold Reserves YoY */}
                <Grid item xs={12} md={6}>
                    <MetricCard
                        label="Gold Reserve Share (YoY Change)"
                        value={goldShare?.delta_yoy_pct?.toFixed(1) || '-'}
                        delta={goldShare?.value ? {
                            value: `${goldShare.value.toFixed(1)}%`,
                            period: 'Total Share',
                            trend: (goldShare?.delta_yoy_pct || 0) > 0 ? 'up' : 'down'
                        } : undefined}
                        status={getGoldStatus()}
                        history={goldHistory}
                        suffix="%"
                        isLoading={isLoading}
                        lastUpdated={goldShare?.as_of_date}
                        description="Tracks the annual percentage change in the share of global reserves held in gold bullion."
                        methodology="Derived from IMF COFER global holdings and LBMA gold pricing. Trends >10% accumulation signal significant central bank diversification into hard assets."
                        source="IMF COFER, LBMA"
                        frequency="Quarterly"
                        zScoreWindow="25-Year Context (100 Qurs)"
                        sx={{
                            // Subtle gold tint if accelerating accumulation
                            ...(goldShare?.delta_yoy_pct && goldShare.delta_yoy_pct > 10 && {
                                borderColor: 'rgba(251, 191, 36, 0.3)',
                                bgcolor: 'rgba(251, 191, 36, 0.02)',
                            })
                        }}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

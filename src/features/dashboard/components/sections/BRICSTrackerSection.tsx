import React from 'react';
import { Grid, Box } from '@mui/material';
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

            {/* Main Metrics Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* 1. USD Reserve Share */}
                <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
                    <MetricCard
                        label="USD Reserve Share"
                        value={usdShare?.value || 0}
                        suffix="%"
                        delta={usdShare?.delta_qoq ? {
                            value: `${usdShare.delta_qoq > 0 ? '+' : ''}${usdShare.delta_qoq.toFixed(2)}pp`,
                            period: 'QoQ',
                            trend: usdShare.delta_qoq < 0 ? 'down' : 'up' // Red down is signal
                        } : undefined}
                        status={stalenessToStatus(usdShare?.staleness_flag)}
                        history={history['BRICS_USD_RESERVE_SHARE_PCT']}
                        isLoading={false}
                        lastUpdated={usdShare?.as_of_date}
                        source="IMF COFER"
                        frequency="Quarterly"
                        sx={{ flex: 1, minHeight: 220 }}
                        className="h-full"
                    />
                </Grid>

                {/* 2. Gold Holdings */}
                <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
                    <MetricCard
                        label="Gold Holdings"
                        value={goldHoldings?.value || 0}
                        suffix="t"
                        delta={goldHoldings?.delta_yoy_pct ? {
                            value: `${goldHoldings.delta_yoy_pct > 0 ? '+' : ''}${goldHoldings.delta_yoy_pct.toFixed(1)}%`,
                            period: 'YoY',
                            trend: goldHoldings.delta_yoy_pct > 0 ? 'up' : 'down'
                        } : undefined}
                        status={goldHoldings?.delta_yoy_pct && goldHoldings.delta_yoy_pct > 5 ? 'safe' : 'neutral'}
                        history={history['BRICS_GOLD_HOLDINGS_TONNES']}
                        isLoading={false}
                        lastUpdated={goldHoldings?.as_of_date}
                        source="WGC"
                        frequency="Quarterly"
                        sx={{ flex: 1, minHeight: 220 }}
                        className="h-full"
                    />
                </Grid>

                {/* 3. Debt / GDP */}
                <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
                    <MetricCard
                        label="Debt / GDP"
                        value={debtGdp?.value || 0}
                        suffix="%"
                        delta={debtGdp?.delta_qoq ? {
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
                        sx={{ flex: 1, minHeight: 220 }}
                        className="h-full"
                    />
                </Grid>

                {/* 4. Inflation YoY */}
                <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
                    <MetricCard
                        label="Inflation YoY"
                        value={inflation?.value || 0}
                        suffix="%"
                        delta={inflation?.delta_qoq ? {
                            value: `${inflation.delta_qoq > 0 ? '+' : ''}${inflation.delta_qoq.toFixed(1)}%`,
                            period: 'MoM',
                            trend: inflation.delta_qoq > 0 ? 'up' : 'down'
                        } : undefined}
                        status={inflation?.value && inflation.value > 5 ? 'warning' : 'neutral'}
                        history={history['BRICS_INFLATION_YOY']}
                        isLoading={false}
                        lastUpdated={inflation?.as_of_date}
                        source="Local Stats"
                        frequency="Monthly"
                        sx={{ flex: 1, minHeight: 220 }}
                        className="h-full"
                    />
                </Grid>
            </Grid>

            {/* Gold Reserves Visualization */}
            <Box sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'rgba(255,215,0,0.03)',
                border: '1px solid rgba(255,215,0,0.1)',
                backdropFilter: 'blur(10px)'
            }}>
                <div className="flex justify-between items-end mb-4">
                    <span className="text-[0.65rem] font-black text-amber-500/80 uppercase tracking-widest">
                        Strategic Gold Accumulation
                    </span>
                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase">
                        Tonnes • YoY Change
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    {countryReserves
                        .filter(c => c.gold_tonnes > 0)
                        .sort((a, b) => b.gold_tonnes - a.gold_tonnes)
                        .slice(0, 9) // Top 9
                        .map((c) => {
                            const maxVal = Math.max(...countryReserves.map(x => x.gold_tonnes));
                            const pct = (c.gold_tonnes / maxVal) * 100;
                            const isAccumulating = (c.gold_yoy_pct_change || 0) > 0;

                            // Map country codes to emojis roughly
                            const flags: Record<string, string> = {
                                CN: '🇨🇳', IN: '🇮🇳', RU: '🇷🇺', BR: '🇧🇷', ZA: '🇿🇦',
                                SA: '🇸🇦', AE: '🇦🇪', IR: '🇮🇷', EG: '🇪🇬', ET: '🇪🇹', TR: '🇹🇷'
                            };

                            return (
                                <div key={c.country_code} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-end text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{flags[c.country_code] || '🏳️'}</span>
                                            <span className="font-bold text-muted-foreground">{c.country_code}</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-black text-foreground">{Math.round(c.gold_tonnes).toLocaleString()}t</span>
                                            <span className={`text-[0.65rem] font-bold ${isAccumulating ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {c.gold_yoy_pct_change ? (c.gold_yoy_pct_change > 0 ? '+' : '') + c.gold_yoy_pct_change.toFixed(1) + '%' : '—'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bar */}
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out relative"
                                            style={{
                                                width: `${pct}%`,
                                                background: 'linear-gradient(90deg, #b45309 0%, #f59e0b 100%)'
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </Box>
        </Box>
    );
};

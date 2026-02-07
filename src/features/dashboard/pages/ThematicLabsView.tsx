import React from 'react';
import { Container, Box } from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { SovereignRiskMatrix } from '../components/sections/SovereignRiskMatrix';
import { MetricCard } from '@/components/MetricCard';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { formatMetric, formatDelta } from '@/utils/formatMetric';

const ThematicMetricCard: React.FC<{ id: string; label: string; subtitle: string; unit: 'currency' | 'percent' }> = ({ id, label, subtitle, unit }) => {
    const { data: m, isLoading } = useLatestMetric(id);
    return (
        <MetricCard
            label={label}
            sublabel={subtitle}
            metricId={id}
            value={formatMetric(m?.value || 0, unit, { showUnit: false })}
            prefix={unit === 'currency' ? '$' : ''}
            suffix={unit === 'percent' ? '%' : ''}
            delta={m?.delta !== null && m?.delta !== undefined ? {
                value: formatDelta(m.delta, { decimals: 1, unit: unit === 'percent' ? '%' : '' }) || '—',
                period: m?.deltaPeriod || 'WoW',
                trend: m?.trend || 'neutral'
            } : undefined}
            status={m?.status}
            history={m?.history}
            isLoading={isLoading}
            lastUpdated={m?.lastUpdated}
            zScore={m?.zScore}
            percentile={m?.percentile}
            source="Institutional Feed"
        />
    );
};

export const ThematicLabsView: React.FC = () => {
    return (
        <Container maxWidth="xl" sx={{ py: 8 }}>
            <SectionHeader
                title="Thematic Labs"
                subtitle="Deep-dive signals for Gold, BRICS, and Sovereign Risk"
                interpretations={[
                    "Gold-USD divergence confirming structural shifts in central bank reserves.",
                    "Sovereign Risk Matrix indicates elevated stress in Frontier Markets.",
                    "BRICS basket shows increasing internal trade settlement in non-USD currencies."
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-10">
                <div className="lg:col-span-3">
                    <SovereignRiskMatrix />
                </div>
                <div className="lg:col-span-1">
                    <div className="h-full p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm flex flex-col justify-center text-center">
                        <h4 className="text-[0.65rem] font-black tracking-widest text-muted-foreground/30 uppercase mb-4">Risk Concentration</h4>
                        <div className="aspect-square w-full max-w-[200px] mx-auto rounded-full border-2 border-dashed border-white/5 flex items-center justify-center italic text-[0.6rem] text-muted-foreground/20 px-8">
                            Heatmap concentration visualization pending
                        </div>
                    </div>
                </div>
            </div>

            <Box sx={{ my: 24 }}>
                <SectionHeader
                    title="Gold Anchor"
                    subtitle="Precious divergence and US debt backing"
                    interpretations={[
                        "Real rates are no longer the sole anchor for Gold pricing.",
                        "USD Liquidity correlation remains positive but weakening."
                    ]}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <ThematicMetricCard id="GOLD_PRICE_USD" label="Gold Spot" subtitle="XAU / USD" unit="currency" />
                    <ThematicMetricCard id="SILVER_PRICE_USD" label="Silver Spot" subtitle="XAG / USD" unit="currency" />
                    <ThematicMetricCard id="UST_10Y_YIELD" label="US 10Y Yield" subtitle="UST Benchmark" unit="percent" />
                </div>

                <div className="relative h-[500px] w-full bg-slate-950/40 rounded-3xl border border-white/5 overflow-hidden flex items-center justify-center group">
                    <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/[0.02] to-transparent" />
                    <span className="text-muted-foreground/20 text-sm tracking-[0.3em] font-black uppercase opacity-20 group-hover:opacity-40 transition-opacity">Gold Ribbon Signal Engine</span>
                    {/* Decorative element */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
                </div>
            </Box>
        </Container>
    );
};

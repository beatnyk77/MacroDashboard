import React from 'react';
import { Container, Box } from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { ChinaMacroPulseSection } from '@/components/ChinaMacroPulseSection';
import { MetricCard } from '@/components/MetricCard';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { formatMetric, formatDelta } from '@/utils/formatMetric';

const IndiaMetricCard: React.FC<{ id: string; label: string; subtitle: string }> = ({ id, label, subtitle }) => {
    const { data: m, isLoading } = useLatestMetric(id);
    return (
        <MetricCard
            label={label}
            sublabel={subtitle}
            metricId={id}
            value={formatMetric(m?.value || 0, 'percent', { showUnit: false })}
            suffix="%"
            delta={m?.delta !== null && m?.delta !== undefined ? {
                value: formatDelta(m.delta, { decimals: 1, unit: '%' }) || '—',
                period: m?.deltaPeriod || 'YoY',
                trend: m?.trend || 'neutral'
            } : undefined}
            status={m?.status}
            history={m?.history}
            isLoading={isLoading}
            lastUpdated={m?.lastUpdated}
            zScore={m?.zScore}
            percentile={m?.percentile}
            source="MoSPI / RBI"
        />
    );
};

export const CountryPulsesView: React.FC = () => {
    return (
        <Container maxWidth="xl" sx={{ py: 8 }}>
            <SectionHeader
                title="Country Pulses"
                subtitle="Institutional coverage of India, China, and US domestic macro"
                interpretations={[
                    "India activity remains robust; PLFS data showing structural tightening in labor slack.",
                    "China PBoC intervention signals a 'liquidity floor' in the local equity market.",
                    "US domestic demand softening but Treasury yields remain sticky due to supply concerns."
                ]}
            />

            <Box sx={{ mt: 10 }}>
                <ChinaMacroPulseSection />
            </Box>

            <Box sx={{ my: 24 }}>
                <SectionHeader
                    title="India Pulse"
                    subtitle="RBI, MoSPI, and High-Frequency Activity"
                    interpretations={[
                        "Prioritizing MoSPI Official PLFS feeds for labor market accuracy.",
                        "RBI Repo Rate manually verified at 5.5% following the Feb 6 decision."
                    ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* India Institutional Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-bold text-[0.6rem] text-slate-900 shadow-xl overflow-hidden shrink-0 text-center">
                                    MoSPI<br />INDIA
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-foreground">Official Series</h3>
                                    <p className="text-[0.65rem] font-bold text-muted-foreground/50">Government of India</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[0.65rem] font-bold border-b border-white/[0.03] pb-2">
                                    <span className="text-muted-foreground/40 uppercase tracking-widest">Data Health</span>
                                    <span className="text-emerald-500">EXCELLENT</span>
                                </div>
                                <div className="flex justify-between items-center text-[0.65rem] font-bold border-b border-white/[0.03] pb-2">
                                    <span className="text-muted-foreground/40 uppercase tracking-widest">Signal Strength</span>
                                    <span className="text-emerald-400">HIGH</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-blue-500/[0.02] border border-blue-500/10">
                            <h4 className="text-[0.65rem] font-black tracking-[0.2em] text-blue-400/60 uppercase mb-4 text-center">RBI Institutional Log</h4>
                            <div className="space-y-3">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 shadow-inner">
                                    <div className="flex justify-between text-[0.6rem] font-black mb-1.5 uppercase tracking-tighter">
                                        <span className="text-muted-foreground/40">Decision: FEB 06</span>
                                        <span className="text-blue-400">STATUS: DONE</span>
                                    </div>
                                    <div className="text-sm font-black text-foreground">Repo Rate: 5.50%</div>
                                    <div className="mt-2 text-[0.55rem] font-bold text-muted-foreground/30 uppercase tracking-widest">
                                        Surprise: -1.0% (Manual Override)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* India Metric Grid */}
                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <IndiaMetricCard id="IN_CPI_YOY" label="India CPI Inflation" subtitle="CPI Combined (YoY)" />
                            <IndiaMetricCard id="IN_GDP_GROWTH_YOY" label="India GDP Growth" subtitle="Real GDP (YoY)" />
                            <IndiaMetricCard id="IN_IIP_YOY" label="Industrial Production" subtitle="IIP General (YoY)" />
                            <IndiaMetricCard id="IN_UNEMPLOYMENT_RATE" label="Urban Unemployment" subtitle="PLFS PL (CWS)" />
                        </div>
                    </div>
                </div>
            </Box>
        </Container>
    );
};

// src/pages/labs/EnergyCommoditiesLab.tsx
import React, { Suspense, lazy, useMemo, useState } from 'react';
import { PublisherOrganizationSchema } from '@/config/brandConfig';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import {
    ChevronRight,
    ArrowLeft,
    Fuel,
    Activity,
    Globe,
    Clock,
    BarChart2,
    Gauge,
    ShieldAlert,
    Factory,
    Droplets,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { SectionLoadingFallback } from '@/components/SectionLoadingFallback';
import { LazyRender } from '@/components/LazyRender';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { CurrentEnergyRegimeCard } from '@/features/energy/components/CurrentEnergyRegimeCard';
import { useEnergyRegime } from '@/hooks/useEnergyRegime';
import { useFuelSecurityIndia } from '@/features/energy/hooks/useFuelSecurityIndia';
import { cn } from '@/lib/utils';
import type { FreshnessStatus } from '@/components/FreshnessChip';
import type { MetricData } from '@/hooks/useLatestMetric';

const SovereignEnergySecuritySection = lazy(() => import('@/features/dashboard/components/sections/SovereignEnergySecuritySection').then(m => ({ default: m.SovereignEnergySecuritySection })));
const AsiaCommodityFlowsSection = lazy(() => import('@/features/dashboard/components/sections/AsiaCommodityFlowsSection').then(m => ({ default: m.AsiaCommodityFlowsSection })));
const GlobalRefiningMonitorSection = lazy(() => import('@/features/dashboard/components/refining/GlobalRefiningMonitorSection').then(m => ({ default: m.GlobalRefiningMonitorSection })));
const CommodityTerminalRow = lazy(() => import('@/features/commodities/CommodityTerminalRow').then(m => ({ default: m.CommodityTerminalRow })));
const FuelSecurityClockIndia = lazy(() => import('@/features/energy/components/FuelSecurityClockIndia'));
const WTICalendarSpread = lazy(() => import('@/features/energy/components/WTICalendarSpread').then(m => ({ default: m.WTICalendarSpread })));
const PriceTerminalCard = lazy(() => import('@/features/commodities/components/PriceTerminalCard').then(m => ({ default: m.PriceTerminalCard })));

type EnergyTab = 'oil' | 'refining' | 'buffers' | 'india' | 'metals';

const TAB_CONFIG: Array<{ id: EnergyTab; label: string; icon: LucideIcon }> = [
    { id: 'oil', label: 'Oil Market', icon: BarChart2 },
    { id: 'refining', label: 'Refining', icon: Factory },
    { id: 'buffers', label: 'Sovereign Buffers', icon: ShieldAlert },
    { id: 'india', label: 'India', icon: Clock },
    { id: 'metals', label: 'Metals', icon: Activity },
];

const metricFreshnessStatus = (metric?: MetricData | null): FreshnessStatus => {
    if (!metric?.lastUpdated) return 'no_data';
    if (metric.status === 'safe') return 'fresh';
    if (metric.status === 'warning') return 'lagged';
    if (metric.status === 'danger') return 'stale';
    return 'no_data';
};

const formatCurrency = (value?: number | null, digits = 2) => {
    if (value == null || !Number.isFinite(value)) return '—';
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};

const formatPercent = (value?: number | null, digits = 1) => {
    if (value == null || !Number.isFinite(value)) return '—';
    return `${value.toFixed(digits)}%`;
};

function SignalTile({
    label,
    value,
    context,
    tone = 'neutral',
}: {
    label: string;
    value: React.ReactNode;
    context: string;
    tone?: 'good' | 'warn' | 'bad' | 'neutral';
}) {
    const toneClass = {
        good: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.04]',
        warn: 'text-amber-400 border-amber-500/20 bg-amber-500/[0.04]',
        bad: 'text-rose-400 border-rose-500/20 bg-rose-500/[0.04]',
        neutral: 'text-blue-400 border-blue-500/20 bg-blue-500/[0.04]',
    }[tone];

    return (
        <div className={cn('min-h-[124px] rounded-xl border p-4', toneClass)}>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{label}</div>
            <div className="mt-3 text-2xl font-black tabular-nums tracking-heading text-white">{value}</div>
            <div className="mt-2 text-[11px] font-bold uppercase leading-relaxed text-white/45">{context}</div>
        </div>
    );
}

function FeedHealthStrip({
    feeds,
}: {
    feeds: Array<{ label: string; status: FreshnessStatus; lastUpdated?: string | Date }>;
}) {
    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {feeds.map(feed => (
                <div key={feed.label} className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">{feed.label}</span>
                    <FreshnessChip status={feed.status} lastUpdated={feed.lastUpdated} />
                </div>
            ))}
        </div>
    );
}

function TabButton({
    tab,
    active,
    onClick,
}: {
    tab: (typeof TAB_CONFIG)[number];
    active: boolean;
    onClick: () => void;
}) {
    const Icon = tab.icon;
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-colors cursor-pointer',
                active
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-white/8 bg-white/[0.02] text-white/40 hover:bg-white/[0.04] hover:text-white/70',
            )}
            aria-pressed={active}
        >
            <Icon size={14} />
            {tab.label}
        </button>
    );
}

export const EnergyCommoditiesLab: React.FC = () => {
    const [activeTab, setActiveTab] = useState<EnergyTab>('oil');
    const regime = useEnergyRegime();
    const { data: brentMetric } = useLatestMetric(MID.BRENT_CRUDE_PRICE);
    const { data: sprMetric } = useLatestMetric(MID.OIL_SPR_LEVEL_US);
    const { data: copperMetric } = useLatestMetric(MID.COPPER_PRICE_USD);
    const { data: nickelMetric } = useLatestMetric(MID.NICKEL_PRICE_USD);
    const { data: fuelSecurity } = useFuelSecurityIndia();

    const feedHealth = useMemo(() => [
        { label: 'Oil', status: regime.isAnyStale ? 'lagged' as const : 'fresh' as const, lastUpdated: regime.lastUpdated ?? undefined },
        { label: 'Brent', status: metricFreshnessStatus(brentMetric), lastUpdated: brentMetric?.lastUpdated },
        { label: 'SPR', status: metricFreshnessStatus(sprMetric), lastUpdated: sprMetric?.lastUpdated },
        { label: 'Copper', status: metricFreshnessStatus(copperMetric), lastUpdated: copperMetric?.lastUpdated },
        { label: 'Nickel', status: metricFreshnessStatus(nickelMetric), lastUpdated: nickelMetric?.lastUpdated },
    ], [brentMetric, copperMetric, nickelMetric, regime.isAnyStale, regime.lastUpdated, sprMetric]);

    const stressTone = regime.wtiRegime === 'EXTREME' || regime.wtiRegime === 'STRESSED'
        ? 'bad'
        : regime.wtiRegime === 'TIGHTENING'
            ? 'warn'
            : 'good';

    const sprTone = sprMetric?.status === 'danger' ? 'bad' : sprMetric?.status === 'warning' ? 'warn' : 'neutral';
    const indiaTone = fuelSecurity?.reserves_days_coverage != null && fuelSecurity.reserves_days_coverage < 10 ? 'warn' : 'neutral';

    return (
        <>
            <SEOManager
                title="Energy Security Lab — WTI, SPR & Refining"
                description="Live WTI calendar spread, US SPR depletion tracker, global refining imbalance monitor, and India fuel security clock. Institutional-grade energy flow"
                keywords={[
                    'WTI contango backwardation',
                    'US strategic petroleum reserve SPR depletion',
                    'global refining capacity utilization',
                    'India oil import dependency',
                    'sovereign energy security score',
                    'Asia commodity flow dynamics',
                    'Brent crude India current account deficit',
                    'OPEC production cut impact',
                    'chokepoint risk Hormuz Malacca',
                    'energy market regime indicator',
                    'refinery utilization rate EIA',
                    'EU natural gas storage level',
                    'India fuel security coverage days',
                    'shadow fleet crude oil flows',
                    'refining margin arbitrage',
                ]}
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        'name': 'Energy & Commodities Lab',
                        'url': 'https://graphiquestor.com/labs/energy-commodities',
                        'isPartOf': { '@id': 'https://graphiquestor.com/#website' },
                        'breadcrumb': {
                            '@type': 'BreadcrumbList',
                            'itemListElement': [
                                { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://graphiquestor.com/' },
                                { '@type': 'ListItem', 'position': 2, 'name': 'Observatory', 'item': 'https://graphiquestor.com/macro-observatory' },
                                { '@type': 'ListItem', 'position': 3, 'name': 'Energy & Commodities Lab' },
                            ],
                        },
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Dataset',
                        'name': 'Global Energy Security Data',
                        'description': 'Institutional energy security telemetry including WTI calendar spread regime classification, US SPR capacity utilization (EIA/FRED), global refinery utilization rates, Asia crude import origin flows (UN Comtrade), India fuel security coverage estimates (PPAC/EIA), and sovereign energy vulnerability scoring. Updated weekly via automated ingestion pipelines.',
                        'keywords': ['WTI calendar spread', 'SPR depletion', 'refining capacity', 'India energy security', 'Asia commodity flows', 'chokepoint risk', 'energy market regime'],
                        'url': 'https://graphiquestor.com/labs/energy-commodities',
                        'isAccessibleForFree': true,
                        'license': 'https://creativecommons.org/licenses/by/4.0/',
                        'creator': PublisherOrganizationSchema,
                        'author': PublisherOrganizationSchema
                    }
                ]}
            />
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
                {/* Breadcrumbs */}
                <div className="mb-6">
                    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        <a href="/" className="hover:text-white transition-colors">Home</a>
                        <ChevronRight size={10} />
                        <a href="/macro-observatory/" className="hover:text-white transition-colors">Observatory</a>
                        <ChevronRight size={10} />
                        <span className="text-blue-500">Energy & Commodities</span>
                    </nav>
                </div>

                {/* Lab Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-uppercase mb-5">
                        <Fuel size={12} /> Institutional Resource Security
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white">
                            Energy & <span className="text-blue-500">Commodities</span>
                        </h1>
                        <FreshnessChip
                            status={regime.isAnyStale ? 'lagged' : 'fresh'}
                            lastUpdated={regime.lastUpdated ?? undefined}
                            label={regime.isAnyStale ? 'MIXED FEEDS' : 'FRESH'}
                        />
                    </div>
                    <p className="mt-3 text-muted-foreground/60 max-w-4xl text-sm md:text-base font-medium leading-relaxed uppercase tracking-wide">
                        Physical energy stress, sovereign buffers, and inflation transmission.
                    </p>

                    <div className="mt-6 space-y-4 rounded-2xl border border-white/8 bg-black/35 p-4 md:p-5">
                        <FeedHealthStrip feeds={feedHealth} />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                            <SignalTile
                                label="Regime"
                                value={regime.wtiRegime}
                                context="Composite oil structure"
                                tone={stressTone}
                            />
                            <SignalTile
                                label="WTI Spread"
                                value={<>{regime.wtiSpread >= 0 ? '+' : ''}{regime.wtiSpread.toFixed(2)} <span className="text-xs text-white/40">USD</span></>}
                                context="CL1 minus CL2"
                                tone={stressTone}
                            />
                            <SignalTile
                                label="Brent"
                                value={formatCurrency(regime.brentPrice)}
                                context={`${regime.brentChangePct >= 0 ? '+' : ''}${regime.brentChangePct.toFixed(2)}% last print`}
                                tone="neutral"
                            />
                            <SignalTile
                                label="Refining"
                                value={formatPercent(regime.refineryUtil)}
                                context={regime.refineryUtil > 90 ? 'Capacity ceiling risk' : 'Operating range'}
                                tone={regime.refineryUtil > 90 ? 'warn' : 'neutral'}
                            />
                            <SignalTile
                                label="US SPR"
                                value={sprMetric ? `${sprMetric.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                                context={sprMetric ? 'Million barrels' : 'Feed unavailable'}
                                tone={sprTone}
                            />
                            <SignalTile
                                label="India Cover"
                                value={fuelSecurity?.reserves_days_coverage != null ? `${fuelSecurity.reserves_days_coverage.toFixed(1)}d` : '—'}
                                context="Fuel security clock"
                                tone={indiaTone}
                            />
                        </div>
                        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-400">
                                <Gauge size={14} /> Current Read
                            </div>
                            <p className="text-sm font-semibold uppercase leading-relaxed tracking-wide text-white/70">
                                {regime.overallNarrative} SPR freshness and India reserve coverage remain the first credibility checks before using the downstream sovereign-risk panels.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 0. ENERGY MARKET REGIME — Executive Summary */}
                <div id="energy-regime" className="mb-8">
                    <SectionErrorBoundary name="Energy Market Regime">
                        <CurrentEnergyRegimeCard />
                    </SectionErrorBoundary>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-5">
                    {TAB_CONFIG.map(tab => (
                        <TabButton
                            key={tab.id}
                            tab={tab}
                            active={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                        />
                    ))}
                </div>

                <div className="rounded-2xl border border-white/8 bg-black/25 p-3 md:p-5">
                    {activeTab === 'oil' && (
                        <section id="oil-market" className="space-y-6">
                            <div className="flex items-start gap-3">
                                <BarChart2 className="mt-1 text-amber-500" size={22} />
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-heading text-white">Oil Market Structure</h2>
                                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground/50">
                                        WTI curve stress and spot commodity anchors.
                                    </p>
                                </div>
                            </div>
                            <SectionErrorBoundary name="WTI Calendar Spread">
                                <LazyRender minHeight="300px" fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                    <Suspense fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                        <WTICalendarSpread />
                                    </Suspense>
                                </LazyRender>
                            </SectionErrorBoundary>
                            <SectionErrorBoundary name="Commodity Prices">
                                <LazyRender minHeight="192px" fallback={<SectionLoadingFallback minHeight={192} label="Loading module" />}>
                                    <Suspense fallback={<SectionLoadingFallback minHeight={192} label="Loading module" />}>
                                        <PriceTerminalCard />
                                    </Suspense>
                                </LazyRender>
                            </SectionErrorBoundary>
                        </section>
                    )}

                    {activeTab === 'refining' && (
                        <section id="refining-imbalance" className="space-y-6">
                            <div className="flex items-start gap-3">
                                <Factory className="mt-1 text-blue-500" size={22} />
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-heading text-white">Global Refining Imbalance</h2>
                                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground/50">
                                        Capacity elasticity, utilization ceiling, and regional bottlenecks.
                                    </p>
                                </div>
                            </div>
                            <SectionErrorBoundary name="Global Refining Monitor">
                                <LazyRender minHeight="300px" fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                    <Suspense fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                        <GlobalRefiningMonitorSection />
                                    </Suspense>
                                </LazyRender>
                            </SectionErrorBoundary>
                        </section>
                    )}

                    {activeTab === 'buffers' && (
                        <section id="sovereign-security" className="space-y-6">
                            <div className="flex items-start gap-3">
                                <Globe className="mt-1 text-blue-500" size={22} />
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-heading text-white">Sovereign Energy Buffers</h2>
                                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground/50">
                                        Reserve depletion, national stockpiles, and power-mix resilience.
                                    </p>
                                </div>
                            </div>
                            <SectionErrorBoundary name="Sovereign Energy Security">
                                <LazyRender minHeight="300px" fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                    <Suspense fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                        <SovereignEnergySecuritySection />
                                    </Suspense>
                                </LazyRender>
                            </SectionErrorBoundary>
                        </section>
                    )}

                    {activeTab === 'india' && (
                        <section id="india-transmission" className="space-y-6">
                            <div className="flex items-start gap-3">
                                <Clock className="mt-1 text-amber-500" size={22} />
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-heading text-white">India Transmission</h2>
                                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground/50">
                                        Import cost pressure, corridor concentration, and fuel-cover sensitivity.
                                    </p>
                                </div>
                            </div>
                            <SectionErrorBoundary name="Fuel Security Clock India">
                                <LazyRender minHeight="300px" fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                    <Suspense fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                        <FuelSecurityClockIndia />
                                    </Suspense>
                                </LazyRender>
                            </SectionErrorBoundary>
                            <SectionErrorBoundary name="Asia Commodity Flows">
                                <LazyRender minHeight="300px" fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                    <Suspense fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                        <AsiaCommodityFlowsSection />
                                    </Suspense>
                                </LazyRender>
                            </SectionErrorBoundary>
                        </section>
                    )}

                    {activeTab === 'metals' && (
                        <section id="flows-terminal" className="space-y-6">
                            <div className="flex items-start gap-3">
                                <Droplets className="mt-1 text-emerald-500" size={22} />
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-heading text-white">Metals & Industrial Inputs</h2>
                                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground/50">
                                        Gold, silver, rare earth, and physical commodity corridor pressure.
                                    </p>
                                </div>
                            </div>
                            <SectionErrorBoundary name="Commodity Terminal">
                                <LazyRender minHeight="300px" fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                    <Suspense fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                        <CommodityTerminalRow />
                                    </Suspense>
                                </LazyRender>
                            </SectionErrorBoundary>
                        </section>
                    )}
                </div>

                <article className="mt-10 rounded-2xl border border-white/5 bg-white/[0.015] p-6" aria-label="Structural Analysis of Global Energy Security">
                    <h2 className="text-sm font-black text-white uppercase tracking-uppercase mb-3">Method Lens</h2>
                    <p className="max-w-5xl text-xs text-muted-foreground/60 leading-relaxed font-medium uppercase tracking-wide">
                        Energy stress transmits through prices, refining capacity, reserves, FX, and industrial inputs. This lab now prioritizes the stress board first, then lets desks inspect the relevant transmission channel.
                    </p>
                </article>

                <div className="mt-12 pt-8 border-t border-white/5 text-center">
                    <Button
                        variant="ghost"
                        className="text-muted-foreground/40 font-black uppercase tracking-uppercase hover:text-white transition-colors"
                        asChild
                    >
                        <a href="/macro-observatory/" className="flex items-center gap-2">
                            <ArrowLeft size={18} /> Back to Observatory
                        </a>
                    </Button>
                </div>
                <RelatedContent />
                <RelatedMetrics />
            </div>
        </>
    );
};

export default EnergyCommoditiesLab;

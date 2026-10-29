// src/pages/labs/EnergyCommoditiesLab.tsx
import React, { Suspense, lazy, useMemo, useState } from 'react';
import { PublisherOrganizationSchema } from '@/config/brandConfig';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import {
    ArrowLeft,
    Fuel,
    Clock,
    BarChart2,
    Gauge,
    Layers,
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
import { useIndiaOilCost } from '@/features/energy/hooks/useIndiaOilCost';
import { useWeeklyBalance } from '@/features/energy/hooks/useWeeklyBalance';
import { latestVsBand } from '@/features/energy/lib/weeklyBalance';
import { cn } from '@/lib/utils';
import { TrailLink } from '@/components/TrailLink';
import type { FreshnessStatus } from '@/components/FreshnessChip';
import { getStaleness } from '@/hooks/useStaleness';
import type { MetricData } from '@/hooks/useLatestMetric';
import { LabPageHeader } from '@/components/LabPageHeader';

const WeeklyBalanceDesk = lazy(() => import('@/features/energy/components/WeeklyBalanceDesk').then(m => ({ default: m.WeeklyBalanceDesk })));
const IndiaOilCostPanel = lazy(() => import('@/features/energy/components/IndiaOilCostPanel').then(m => ({ default: m.IndiaOilCostPanel })));
const WTICalendarSpread = lazy(() => import('@/features/energy/components/WTICalendarSpread').then(m => ({ default: m.WTICalendarSpread })));
const PriceTerminalCard = lazy(() => import('@/features/commodities/components/PriceTerminalCard').then(m => ({ default: m.PriceTerminalCard })));

type EnergyTab = 'balance' | 'oil' | 'india';

const TAB_CONFIG: Array<{ id: EnergyTab; label: string; icon: LucideIcon }> = [
    { id: 'balance', label: 'Weekly Balance', icon: Layers },
    { id: 'oil', label: 'Oil Market', icon: BarChart2 },
    { id: 'india', label: 'India', icon: Clock },
];

const faqItems = [
    {
        question: "What is the WTI Calendar Spread and what does it indicate about physical oil markets?",
        answer: "The WTI Calendar Spread (prompt month vs. second month futures) measures the slope of the crude oil term structure. Backwardation (positive spread) signals immediate physical inventory depletion and supply tightness, while contango (negative spread) signals surplus supply and commercial storage buildup."
    },
    {
        question: "How is the 5-year range for US crude stocks calculated?",
        answer: "For each weekly EIA print, the range is the lowest and highest value, and the average, of the print for the same week in each of the five prior calendar years; the current year is excluded and at least three of those years must have a print. Weeks are matched within three days to allow for holiday-shifted reporting."
    },
    {
        question: "How is India's oil import cost per barrel calculated?",
        answer: "The rupee cost of a barrel is the Brent front-month futures price (ICE BZ=F) multiplied by the USD/INR rate, both from Yahoo Finance and each shown with its own observation date. It is a proxy for the Indian crude basket that PPAC publishes, and it is replaced by the basket price once that source is integrated."
    },
    {
        question: "Why do refining crack spreads matter for macroeconomic surveillance?",
        answer: "Refinery crack spreads measure the processing margin between crude input costs and refined petroleum product prices (gasoline and middle distillates). Widening crack spreads reflect structural refining bottlenecks, driving pump prices higher and feeding into core headline inflation even if headline crude prices remain rangebound."
    }
];

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
        },
    })),
};

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
        good: ' text-emerald-400 border-emerald-500/25 bg-emerald-500/[0.05]',
        warn: ' text-amber-400 border-amber-500/25 bg-amber-500/[0.05]',
        bad: ' text-rose-400 border-rose-500/25 bg-rose-500/[0.05]',
        neutral: ' text-blue-400 border-blue-500/25 bg-blue-500/[0.05]',
    }[tone];

    return (
        <div className={cn('min-h-[124px] rounded-xl border p-4 shadow-sm', toneClass)}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-3 text-2xl font-bold tabular-nums tracking-heading text-foreground">{value}</div>
            <div className="mt-2 text-[11px] font-semibold uppercase leading-relaxed text-muted-foreground">{context}</div>
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
                <div key={feed.label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{feed.label}</span>
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
                'flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer',
                active
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold'
                    : 'border-border bg-card/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
            aria-pressed={active}
        >
            <Icon size={14} />
            {tab.label}
        </button>
    );
}

export const EnergyCommoditiesLab: React.FC = () => {
    const [activeTab, setActiveTab] = useState<EnergyTab>('balance');
    const regime = useEnergyRegime();
    const { data: brentSpotMetric } = useLatestMetric(MID.BRENT_SPOT_USD);
    const { data: sprMetric } = useLatestMetric(MID.OIL_SPR_LEVEL_US);
    const { data: indiaCost } = useIndiaOilCost();
    const { data: weekly } = useWeeklyBalance();
    const crudeStocks = useMemo(() => (weekly ? latestVsBand(weekly.crude) : null), [weekly]);

    const feedHealth = useMemo(() => [
        { label: 'EIA Weekly', status: crudeStocks ? getStaleness(crudeStocks.date, 'weekly').state : 'no_data' as const, lastUpdated: crudeStocks?.date },
        { label: 'WTI Spread', status: regime.wtiSpread === null ? 'no_data' as const : regime.feeds.spread, lastUpdated: regime.lastUpdated ?? undefined },
        { label: 'Brent Front', status: regime.brentPrice === null ? 'no_data' as const : regime.feeds.brent, lastUpdated: regime.lastUpdated ?? undefined },
        { label: 'Brent Spot', status: metricFreshnessStatus(brentSpotMetric), lastUpdated: brentSpotMetric?.lastUpdated },
        { label: 'India ₹/bbl', status: indiaCost ? getStaleness(indiaCost.asOfDate, 'daily').state : 'no_data' as const, lastUpdated: indiaCost?.asOfDate },
    ], [brentSpotMetric, crudeStocks, indiaCost, regime.brentPrice, regime.feeds, regime.lastUpdated, regime.wtiSpread]);

    // The header chip speaks for the five feeds shown in the strip above, not for inputs on other panels.
    const headerStatus: FreshnessStatus = feedHealth.some(f => f.status === 'no_data')
        ? 'no_data'
        : feedHealth.every(f => f.status === 'fresh') ? 'fresh' : 'lagged';

    const stressTone = regime.wtiRegime === null
        ? 'neutral'
        : regime.wtiRegime === 'EXTREME' || regime.wtiRegime === 'STRESSED'
            ? 'bad'
            : regime.wtiRegime === 'TIGHTENING'
                ? 'warn'
                : 'good';

    const sprTone = sprMetric?.status === 'danger' ? 'bad' : sprMetric?.status === 'warning' ? 'warn' : 'neutral';
    const stocksTone = crudeStocks?.deviationPct == null ? 'neutral' : crudeStocks.deviationPct < -3 ? 'warn' : 'neutral';

    return (
        <>
            <SEOManager
                title="Energy Lab — US Weekly Balance, WTI Curve & India Oil Cost"
                description="EIA weekly crude and product stocks against the 5-year range, WTI calendar spread, Dated Brent, US SPR, and India rupee cost of crude, each with source and observation date."
                keywords={[
                    'EIA crude inventories vs 5 year average',
                    'WTI contango backwardation',
                    'US strategic petroleum reserve SPR depletion',
                    'India oil import dependency',
                    'Brent crude India current account deficit',
                    'OPEC production cut impact',
                    'chokepoint risk Hormuz Malacca',
                    'energy market regime indicator',
                    'refinery utilization rate EIA',
                    'EU natural gas storage level',
                    'India crude import cost rupee per barrel',
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
                        'description': 'EIA weekly petroleum status report stocks against the 5-year range, WTI calendar spread regime classification (CL1 minus CL2), Brent front-month futures and Dated Brent spot, US Strategic Petroleum Reserve level and US refinery utilization (EIA), and the rupee cost of a barrel of Brent. Each series is stored with its source and observation date and updated by automated ingestion pipelines.',
                        'keywords': ['WTI calendar spread', 'Brent front-month', 'Dated Brent', 'SPR level', 'refinery utilization', 'India crude import cost', 'energy market regime'],
                        'url': 'https://graphiquestor.com/labs/energy-commodities',
                        'isAccessibleForFree': true,
                        'license': 'https://creativecommons.org/licenses/by/4.0/',
                        'creator': PublisherOrganizationSchema,
                        'author': PublisherOrganizationSchema
                    },
                    faqJsonLd
                ]}
            />
            <div className="page-shell">
                <LabPageHeader
                    trail={[{ label: 'Home', to: '/' }, { label: 'Observatory', to: '/macro-observatory/' }]}
                    current="Energy & Commodities"
                    badge="Institutional Resource Security"
                    badgeIcon={<Fuel size={12} />}
                    title={<>Energy & <span className=" text-blue-400">Commodities</span></>}
                    status={<FreshnessChip
                            status={headerStatus}
                            lastUpdated={regime.lastUpdated ?? undefined}
                            label={headerStatus === 'no_data' ? 'FEED GAP' : headerStatus === 'fresh' ? 'FRESH' : 'MIXED FEEDS'}
                        />}
                    thesis="US weekly stocks against their 5-year range, oil curve structure, and the rupee cost of imported crude."
                >
                    <div className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4 md:p-6 shadow-sm">
                        <FeedHealthStrip feeds={feedHealth} />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                            <SignalTile
                                label="Crude Stocks"
                                value={crudeStocks ? <>{crudeStocks.value.toFixed(1)} <span className="text-xs text-muted-foreground">Mb</span></> : '—'}
                                context={crudeStocks
                                    ? crudeStocks.deviationPct === null
                                        ? 'Ex-SPR · 5-yr range needs more history'
                                        : `${crudeStocks.deviationPct >= 0 ? '+' : ''}${crudeStocks.deviationPct.toFixed(1)}% vs 5-yr avg`
                                    : 'Feed unavailable'}
                                tone={stocksTone}
                            />
                            <SignalTile
                                label="US SPR"
                                value={sprMetric ? `${sprMetric.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                                context={sprMetric ? 'Million barrels · weekly' : 'Feed unavailable'}
                                tone={sprTone}
                            />
                            <SignalTile
                                label="Refinery Util"
                                value={regime.refineryUtil === null ? '—' : `${regime.refineryUtil.toFixed(1)}%`}
                                context={regime.refineryUtil === null ? 'Feed unavailable' : 'US operable capacity · weekly'}
                                tone={regime.refineryUtil !== null && regime.refineryUtil > 93 ? 'warn' : 'neutral'}
                            />
                            <SignalTile
                                label="Brent Spot (Dated)"
                                value={formatCurrency(brentSpotMetric?.value)}
                                context={brentSpotMetric ? 'EIA via FRED · 1–2 day lag' : 'Feed unavailable'}
                                tone="neutral"
                            />
                            <SignalTile
                                label="WTI Spread"
                                value={regime.wtiSpread === null
                                    ? '—'
                                    : <>{regime.wtiSpread >= 0 ? '+' : ''}{regime.wtiSpread.toFixed(2)} <span className="text-xs text-muted-foreground">USD</span></>}
                                context={regime.wtiRegime ? `CL1 minus CL2 · ${regime.wtiRegime}` : 'CL1 minus CL2'}
                                tone={stressTone}
                            />
                            <SignalTile
                                label="India ₹ / bbl"
                                value={indiaCost ? `₹${indiaCost.inrPerBarrel.toLocaleString('en-IN')}` : '—'}
                                context={indiaCost ? 'Brent × USD/INR proxy' : 'Feed unavailable'}
                                tone="neutral"
                            />
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                                <Gauge size={14} /> Current Read
                            </div>
                            <p className="text-sm font-semibold uppercase leading-relaxed tracking-wider text-foreground">
                                {regime.overallNarrative} Every figure on this page carries its source and observation date.
                            </p>
                        </div>
                    </div>
                </LabPageHeader>

                {/* 0. ENERGY MARKET REGIME — Executive Summary */}
                <div id="energy-regime" className="mb-8">
                    <SectionErrorBoundary name="Energy Market Regime">
                        <CurrentEnergyRegimeCard />
                    </SectionErrorBoundary>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-2 md:grid-cols-3">
                    {TAB_CONFIG.map(tab => (
                        <TabButton
                            key={tab.id}
                            tab={tab}
                            active={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                        />
                    ))}
                </div>

                <div className="rounded-xl border border-border bg-card p-4 md:p-6 shadow-sm">
                    {activeTab === 'balance' && (
                        <section id="weekly-balance" className="space-y-6">
                            <div className="flex items-start gap-3">
                                <Layers className="mt-1 text-amber-500" size={22} />
                                <div>
                                    <h2 className="text-xl font-bold uppercase tracking-heading text-foreground">US Weekly Balance</h2>
                                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Crude and product stocks against the 5-year range, demand, supply and refinery runs.
                                    </p>
                                </div>
                            </div>
                            <SectionErrorBoundary name="US Weekly Balance">
                                <LazyRender minHeight="400px" fallback={<SectionLoadingFallback minHeight={400} label="Loading module" />}>
                                    <Suspense fallback={<SectionLoadingFallback minHeight={400} label="Loading module" />}>
                                        <WeeklyBalanceDesk />
                                    </Suspense>
                                </LazyRender>
                            </SectionErrorBoundary>
                        </section>
                    )}

                    {activeTab === 'oil' && (
                        <section id="oil-market" className="space-y-6">
                            <div className="flex items-start gap-3">
                                <BarChart2 className="mt-1 text-amber-500" size={22} />
                                <div>
                                    <h2 className="text-xl font-bold uppercase tracking-heading text-foreground">Oil Market Structure</h2>
                                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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

                    {activeTab === 'india' && (
                        <section id="india-transmission" className="space-y-6">
                            <div className="flex items-start gap-3">
                                <Clock className="mt-1 text-amber-500" size={22} />
                                <div>
                                    <h2 className="text-xl font-bold uppercase tracking-heading text-foreground">India Transmission</h2>
                                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Rupee cost of imported crude, from live prints only.
                                    </p>
                                </div>
                            </div>
                            <SectionErrorBoundary name="India Oil Import Cost">
                                <LazyRender minHeight="200px" fallback={<SectionLoadingFallback minHeight={200} label="Loading module" />}>
                                    <Suspense fallback={<SectionLoadingFallback minHeight={200} label="Loading module" />}>
                                        <IndiaOilCostPanel />
                                    </Suspense>
                                </LazyRender>
                            </SectionErrorBoundary>
                        </section>
                    )}
                </div>

                <article className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm" aria-label="Structural Analysis of Global Energy Security">
                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Method Lens</h2>
                    <p className="max-w-5xl text-xs text-muted-foreground leading-relaxed font-medium uppercase tracking-wider">
                        Only series with a live source are shown. A panel without data says so and names its pending source; no value is estimated or carried forward.
                    </p>

                    {/* Visible FAQ block */}
                    <div className="mt-8 pt-6 border-t border-border space-y-4">
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Frequently Asked Questions</h3>
                        {faqItems.map(({ question, answer }) => (
                            <div key={question} className="space-y-1">
                                <p className="text-xs font-bold text-blue-400">{question}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{answer}</p>
                            </div>
                        ))}
                    </div>
                </article>

                <div className="mt-12 pt-8 border-t border-border text-center">
                    <Button
                        variant="ghost"
                        className="text-muted-foreground font-semibold uppercase tracking-wider hover:text-foreground transition-colors"
                        asChild
                    >
                        <TrailLink to="/macro-observatory/" className="flex items-center gap-2">
                            <ArrowLeft size={18} /> Back to Observatory
                        </TrailLink>
                    </Button>
                </div>
                <RelatedContent />
                <RelatedMetrics />
            </div>
        </>
    );
};

export default EnergyCommoditiesLab;

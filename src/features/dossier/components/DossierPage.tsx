import React, { useMemo, useRef } from 'react';
import { ArrowRight, BookOpen, ChevronRight, Database, Download } from 'lucide-react';
import { TrailLink as Link } from '@/components/TrailLink';
import { SEOManager } from '@/components/SEOManager';
import { ShareButton } from '@/components/ShareButton';
import { ExportCSVButton } from '@/components/ExportCSVButton';
import { FreshnessChip } from '@/components/FreshnessChip';
import { SubscribeCard } from '@/components/SubscribeCard';
import { AuthorityCitationBlock } from '@/components/authority/AuthorityCitationBlock';
import { SnapshotTimeline } from '@/components/authority/SnapshotTimeline';
import { InstitutionalAccessStrip } from '@/components/growth/InstitutionalAccessStrip';
import { ConceptHierarchyBanner } from '@/components/seo/ConceptHierarchyBanner';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { useAuthorityHistory } from '@/hooks/useAuthoritySnapshot';
import { getConceptByMetricId } from '@/lib/conceptHub';
import { trackAuthorityDownload } from '@/lib/authority/authorityEvents';
import { METRICS_CATALOG, type MetricEntry } from '@/features/metrics/metricsCatalog';
import { DOSSIER_BY_ID, type DossierSpec } from '../dossierRegistry';
import { MACRO_EPISODES } from '../macroEpisodes';
import { episodeOutcome, findGaps, summarize, type DossierSummary } from '../dossierStats';
import {
    SHORT_HISTORY_YEARS,
    buildNowReading,
    formatChange,
    formatDate,
    formatValue,
    isMonthlyOrSlower,
    ordinal,
} from '../dossierNarrative';
import { useDossierSeries } from '../useDossierSeries';
import { DossierChart, type ChartEpisode } from './DossierChart';

const BASE = 'https://graphiquestor.com';

interface DossierPageProps {
    spec: DossierSpec;
    entry: MetricEntry;
}

const SectionHeading: React.FC<{ id?: string; children: React.ReactNode }> = ({ id, children }) => (
    <h2 id={id} className="mb-3 text-base font-bold text-foreground">
        {children}
    </h2>
);

const StatTile: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
    <div className="rounded border border-border bg-card p-4">
        <div className="text-xs font-semibold text-muted-foreground">{label}</div>
        <div className="mt-1 whitespace-nowrap font-mono text-xl font-semibold tabular-nums text-foreground sm:text-2xl">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
);

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

function buildJsonLd(spec: DossierSpec, entry: MetricEntry, summary: DossierSummary | undefined, faq: { q: string; a: string }[]) {
    const url = `${BASE}/metrics/${spec.id}/`;
    const name = spec.name ?? entry.name;
    const org = { '@type': 'Organization', name: 'GraphiQuestor', url: BASE };
    return [
        {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: spec.h1,
            url,
            description: spec.seoDescription,
            isPartOf: { '@id': `${BASE}/#website` },
            publisher: org,
            about: { '@type': 'Thing', name },
            ...(summary ? { dateModified: summary.latest.date } : {}),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Metrics', item: `${BASE}/metrics/` },
                { '@type': 'ListItem', position: 2, name: spec.pillar, item: `${BASE}/methodology/` },
                { '@type': 'ListItem', position: 3, name, item: url },
            ],
        },
        {
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            name: `${name} — time series`,
            description: clean(`${spec.seoDescription} Computed from: ${entry.sources.join(', ')}.`),
            url,
            isAccessibleForFree: true,
            license: `${BASE}/terms/`,
            creator: org,
            variableMeasured: name,
            ...(summary ? { temporalCoverage: `${summary.first.date}/${summary.latest.date}` } : {}),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        },
    ];
}

export const DossierPage: React.FC<DossierPageProps> = ({ spec, entry }) => {
    const { data, isSuccess, isError } = useDossierSeries(spec.id, spec.source);
    const { data: liveMetric } = useLatestMetric(spec.liveMetricId ?? '');
    const { data: history } = useAuthorityHistory(spec.id);
    const shareRef = useRef<HTMLDivElement>(null);

    const name = spec.name ?? entry.name;
    const points = useMemo(() => data?.points ?? [], [data]);
    const summary = useMemo(() => summarize(points), [points]);
    const monthly = useMemo(() => isMonthlyOrSlower(points), [points]);
    const gaps = useMemo(() => findGaps(points), [points]);
    const short = summary ? summary.yearsCovered < SHORT_HISTORY_YEARS : false;

    const fmt = (v: number) => formatValue(v, spec.unit, spec.decimals);
    const fmtDate = (d: string) => formatDate(d, monthly);

    const episodes = useMemo(() => {
        if (!summary) return [];
        return spec.episodes
            .map((key) => ({ key, ...MACRO_EPISODES[key] }))
            .filter((e) => e.date >= summary.first.date && e.date <= summary.latest.date)
            .sort((a, b) => (a.date < b.date ? -1 : 1))
            .map((e) => ({ ...e, outcome: episodeOutcome(points, e.date) }))
            // Episodes inside a data gap have no reading; the gap note covers them.
            .filter((e) => e.outcome.at)
            .map((e, i) => ({ ...e, n: i + 1 }));
    }, [spec.episodes, summary, points]);
    const chartEpisodes: ChartEpisode[] = episodes.map(({ n, date, label }) => ({ n, date, label }));

    const reading = summary
        ? buildNowReading({ name, unit: spec.unit, decimals: spec.decimals, unitNote: spec.unitNote, summary, monthly })
        : [];

    const freshness = liveMetric ? getStaleness(liveMetric.lastUpdated, liveMetric.frequency) : null;
    const concept = getConceptByMetricId(entry.id);
    const sourceList = entry.sources.join(' · ');
    const apiMetricId = spec.source.kind === 'observations' ? spec.source.metricId : undefined;

    const faq = [
        { q: `What is the ${name}?`, a: clean(entry.intuition) },
        { q: `How is the ${name} calculated?`, a: clean(spec.chartedSeries ?? `${entry.formula}. Components: ${entry.components.join('; ')}.`) },
        ...(summary
            ? [{
                q: `What is the ${name} today?`,
                a: clean(`${reading[0]} ${reading[1] ?? ''}`),
            }]
            : []),
        { q: `Where does the ${name} data come from?`, a: clean(`GraphiQuestor computes the series from ${entry.sources.join(', ')} and refreshes it automatically as new observations are published.`) },
    ];

    const settled = isSuccess || isError;

    return (
        <div
            className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6"
            data-prerender-await={spec.id}
            data-prerender-ready={settled ? 'true' : undefined}
        >
            <SEOManager
                title={spec.seoTitle}
                description={spec.seoDescription}
                keywords={[name, spec.pillar, `${name} chart`, `${name} history`, ...entry.sources]}
                canonical={`${BASE}/metrics/${spec.id}/`}
                jsonLd={buildJsonLd(spec, entry, summary, faq)}
            />

            <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                    <Link to="/metrics/" className="hover:text-foreground">Metrics</Link>
                    <ChevronRight size={12} aria-hidden="true" />
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <Link to="/methodology/" className="hover:text-foreground">{spec.pillar}</Link>
                    <ChevronRight size={12} aria-hidden="true" />
                </span>
                <span className="text-foreground">{name}</span>
            </nav>

            {concept && <ConceptHierarchyBanner role="primary" concept={concept} />}

            <div ref={shareRef} className="space-y-10">
                <header className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <h1 className="text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">{spec.h1}</h1>
                        <ShareButton targetRef={shareRef} title={name} dataSource={sourceList} href={`/metrics/${spec.id}/`} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                        <span>Source: {sourceList}</span>
                        {summary && <span className="font-mono">Last observation {fmtDate(summary.latest.date)}</span>}
                        {freshness && liveMetric && (
                            <FreshnessChip
                                status={freshness.state}
                                lastUpdated={liveMetric.lastUpdated}
                                label={freshness.label}
                                isProvisional={liveMetric.isProvisional}
                                sourceRef={liveMetric.sourceRef}
                                provenance={liveMetric.provenance}
                            />
                        )}
                    </div>
                </header>

                {/* Answer box */}
                <section aria-label="Current reading" className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {summary ? (
                        <>
                            <StatTile label="Latest" value={fmt(summary.latest.value)} sub={spec.unitNote ?? fmtDate(summary.latest.date)} />
                            <StatTile
                                label={`Percentile since ${summary.first.date.slice(0, 4)}`}
                                value={ordinal(summary.percentile)}
                                sub={short ? 'Short stored history' : `${summary.count.toLocaleString('en-US')} observations`}
                            />
                            <StatTile label="1-year change" value={formatChange(summary.change1y, spec.unit, spec.decimals)} />
                            <StatTile
                                label={summary.change5y ? '5-year change' : 'Range low / high'}
                                value={summary.change5y ? formatChange(summary.change5y, spec.unit, spec.decimals) : `${fmt(summary.min.value)} / ${fmt(summary.max.value)}`}
                            />
                        </>
                    ) : (
                        <div className="col-span-2 rounded border border-border bg-card p-4 text-sm text-muted-foreground md:col-span-4">
                            {isError ? 'Series unavailable — the data service did not respond. No values are shown rather than stale ones.' : 'Loading the full series…'}
                        </div>
                    )}
                </section>

                {/* Chart */}
                <section aria-labelledby="chart-heading" className="rounded border border-border bg-card p-4 sm:p-5">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <h2 id="chart-heading" className="text-base font-bold text-foreground">{name} chart</h2>
                        {points.length > 0 && (
                            <div onClick={() => trackAuthorityDownload(spec.id, 'csv')}>
                                <ExportCSVButton data={points} filename={`graphiquestor-${spec.id}`} />
                            </div>
                        )}
                    </div>
                    {points.length > 1 ? (
                        <DossierChart
                            points={points}
                            unit={spec.unit}
                            decimals={spec.decimals}
                            logScaleDefault={spec.logScale}
                            episodes={chartEpisodes}
                            monthly={monthly}
                        />
                    ) : (
                        <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
                            {isError ? 'Chart unavailable.' : 'Loading chart…'}
                        </div>
                    )}
                    {gaps.length > 0 && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            No observations stored for{' '}
                            {gaps.map((g, i) => (
                                <React.Fragment key={g.from}>
                                    {i > 0 && (i === gaps.length - 1 ? ' and ' : ', ')}
                                    {fmtDate(g.from)}–{fmtDate(g.to)}
                                </React.Fragment>
                            ))}
                            ; the line is broken there rather than interpolated.
                        </p>
                    )}
                    {data && data.excluded > 0 && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            {data.excluded.toLocaleString('en-US')} input observation{data.excluded === 1 ? '' : 's'} excluded because {data.excluded === 1 ? 'it is' : 'they are'} quoted in a different unit from the rest of the series (see How it is calculated).
                        </p>
                    )}
                </section>

                {/* Live read */}
                {reading.length > 0 && (
                    <section aria-labelledby="now-heading">
                        <SectionHeading id="now-heading">What the chart says now</SectionHeading>
                        <div className="space-y-3 text-base leading-relaxed text-foreground">
                            {reading.map((s, i) => <p key={i}>{s}</p>)}
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Generated from the series on every update. Describes the data; it is not a forecast.
                        </p>
                    </section>
                )}

                {/* Episodes */}
                {episodes.length > 0 && (
                    <section aria-labelledby="episodes-heading">
                        <SectionHeading id="episodes-heading">Historical episodes</SectionHeading>
                        <div className="overflow-x-auto rounded border border-border">
                            <table className="w-full min-w-[560px] text-left text-sm">
                                <thead className="bg-muted text-xs font-semibold text-muted-foreground">
                                    <tr>
                                        <th scope="col" className="px-3 py-2">#</th>
                                        <th scope="col" className="px-3 py-2">Date</th>
                                        <th scope="col" className="px-3 py-2">Episode</th>
                                        <th scope="col" className="px-3 py-2 text-right">Reading</th>
                                        <th scope="col" className="px-3 py-2 text-right">Next 12 months</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {episodes.map((e) => (
                                        <tr key={e.key} className="border-t border-border align-top">
                                            <td className="px-3 py-3 font-mono text-muted-foreground">{e.n}</td>
                                            <td className="whitespace-nowrap px-3 py-3 font-mono">{formatDate(e.date, false)}</td>
                                            <td className="px-3 py-3">
                                                <div className="font-semibold text-foreground">{e.label}</div>
                                                <div className="mt-0.5 text-muted-foreground">{e.note}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 text-right font-mono tabular-nums">
                                                {e.outcome.at ? fmt(e.outcome.at.value) : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 text-right font-mono tabular-nums">
                                                {e.outcome.change12m
                                                    ? formatChange(e.outcome.change12m, spec.unit, spec.decimals)
                                                    : e.outcome.pending ? 'Pending' : 'No data'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Reading is the last observation on or before the episode date. Numbers match the markers on the chart.
                        </p>
                    </section>
                )}
                {summary && short && (
                    <p className="rounded border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                        Stored history for this series begins {fmtDate(summary.first.date)}. Long-run percentiles and episode comparisons appear here once deeper history is ingested.
                    </p>
                )}

                {/* Method */}
                <section aria-labelledby="method-heading" className="space-y-6">
                    <div>
                        <SectionHeading id="method-heading">How it is calculated</SectionHeading>
                        {spec.chartedSeries && (
                            <p className="mb-3 text-base leading-relaxed text-foreground">
                                <span className="font-semibold">Charted series:</span> {spec.chartedSeries}
                            </p>
                        )}
                        <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-border bg-muted p-4 font-mono text-sm text-foreground">{entry.formula}</pre>
                        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                            {entry.components.map((c, i) => <li key={i}>• {c}</li>)}
                        </ul>
                    </div>
                    <div>
                        <SectionHeading>Why it matters</SectionHeading>
                        <p className="text-base leading-relaxed text-foreground">{clean(entry.intuition)}</p>
                    </div>
                    <div>
                        <SectionHeading>How institutions use it</SectionHeading>
                        <p className="text-base leading-relaxed text-foreground">{clean(entry.institutionalUse)}</p>
                    </div>
                    {entry.interpretation.length > 0 && (
                        <div>
                            <SectionHeading>How to read it</SectionHeading>
                            <div className="overflow-hidden rounded border border-border">
                                {entry.interpretation.map((band, i) => (
                                    <div key={i} className={`flex items-center justify-between gap-4 px-4 py-3 text-sm ${i > 0 ? 'border-t border-border' : ''}`}>
                                        <span className="font-semibold text-foreground">{band.label}</span>
                                        <span className="font-mono text-muted-foreground">{band.condition}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Compare */}
                <section aria-labelledby="compare-heading">
                    <SectionHeading id="compare-heading">Compare with</SectionHeading>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {spec.compare
                            .map((id) => ({ id, d: DOSSIER_BY_ID.get(id), e: METRICS_CATALOG.find((m) => m.id === id) }))
                            .filter((x) => x.d && x.e)
                            .map(({ id, d, e }) => (
                                <Link key={id} to={`/metrics/${id}/`} className="group rounded border border-border bg-card p-4 transition-colors hover:border-foreground/40">
                                    <div className="text-xs font-semibold text-muted-foreground">{d!.pillar}</div>
                                    <div className="mt-1 flex items-center justify-between gap-2 font-semibold text-foreground">
                                        {d!.name ?? e!.name}
                                        <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
                                    </div>
                                </Link>
                            ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
                        {spec.glossary && (
                            <Link to={spec.glossary.to} className="inline-flex items-center gap-1.5 text-blue-700 hover:underline dark:text-blue-300">
                                <BookOpen size={14} aria-hidden="true" /> Glossary: {spec.glossary.label}
                            </Link>
                        )}
                        {entry.relatedPage && (
                            <Link to={entry.relatedPage} className="inline-flex items-center gap-1.5 text-blue-700 hover:underline dark:text-blue-300">
                                <BookOpen size={14} aria-hidden="true" /> {entry.relatedPageLabel ?? 'Methodology deep dive'}
                            </Link>
                        )}
                    </div>
                </section>

                {/* Data */}
                <section aria-labelledby="data-heading">
                    <SectionHeading id="data-heading">Get the data</SectionHeading>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        {apiMetricId && (
                            <div>
                                <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                                    <Download size={14} aria-hidden="true" /> CSV endpoint
                                </div>
                                <code className="block overflow-x-auto rounded border border-border bg-muted px-3 py-2 font-mono text-xs text-foreground">
                                    {`curl "${BASE}/api/v1/metrics/${apiMetricId}/export?format=csv"`}
                                </code>
                            </div>
                        )}
                        <div className="flex items-start gap-1.5">
                            <Database size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                            <span>
                                Upstream:{' '}
                                {spec.upstream.map((u, i) => (
                                    <React.Fragment key={u.url + i}>
                                        {i > 0 && ' · '}
                                        <a href={u.url} rel="noopener" target={u.url.startsWith(BASE) ? undefined : '_blank'} className="font-semibold text-blue-700 hover:underline dark:text-blue-300">
                                            {u.label}
                                        </a>
                                    </React.Fragment>
                                ))}
                                . Observational composite, not a forecast. See <Link to="/for-researchers/" className="font-semibold text-blue-700 hover:underline dark:text-blue-300">citation guidelines</Link>.
                            </span>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section aria-labelledby="faq-heading">
                    <SectionHeading id="faq-heading">Frequently asked questions</SectionHeading>
                    <div className="divide-y divide-border rounded border border-border">
                        {faq.map(({ q, a }) => (
                            <div key={q} className="px-4 py-3">
                                <h3 className="font-semibold text-foreground">{q}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {history && history.length > 0 && <SnapshotTimeline snapshots={history} />}

                <AuthorityCitationBlock metricName={name} metricId={spec.id} observedAt={summary?.latest.date ?? liveMetric?.lastUpdated} />
            </div>

            <div className="mt-10">
                <InstitutionalAccessStrip variant="compact" />
            </div>
            <div className="mt-10">
                <SubscribeCard source="metric-page" />
            </div>
        </div>
    );
};

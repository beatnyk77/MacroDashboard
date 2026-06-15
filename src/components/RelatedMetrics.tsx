import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { TrailLink } from '@/components/TrailLink';
import { contentRelations, RelatedLink } from '@/config/contentRelations';
import { glossaryData } from '@/features/glossary/glossaryData';
import { GLOSSARY_LIVE_CONFIG } from '@/features/glossary/glossaryLiveMap';
import { getMetricLabel } from '@/lib/metricLabels';
import { withoutTrailingSlash, withTrailingSlash } from '@/lib/urlPath';
import { Activity, BookOpen, FlaskConical, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

type LinkKind = RelatedLink['kind'] | 'metric' | 'terminal';

interface MetricLink {
    to: string;
    label: string;
    kind: LinkKind;
}

interface RelatedMetricsProps {
    /** Override auto-detected path (e.g. `/methods/net-liquidity-z-score`) */
    path?: string;
    /** Glossary slug when rendering on a term page */
    glossarySlug?: string;
    className?: string;
    minLinks?: number;
}

function matchRoute(pathname: string): RelatedLink[] | null {
    const key = withoutTrailingSlash(pathname);
    if (contentRelations[key]) return contentRelations[key];
    for (const pattern of Object.keys(contentRelations)) {
        if (!pattern.includes(':')) continue;
        const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
        if (regex.test(key)) return contentRelations[pattern];
    }
    return null;
}

function findGlossarySlugByLabel(label: string): string | undefined {
    const lower = label.toLowerCase();
    const exact = glossaryData.find(
        (t) => t.term.toLowerCase() === lower || t.slug === lower.replace(/\s+/g, '-')
    );
    if (exact) return exact.slug;
    const partial = glossaryData.find((t) =>
        t.relatedMetrics?.some((m) => m.toLowerCase() === lower) ||
        t.term.toLowerCase().includes(lower) ||
        lower.includes(t.term.toLowerCase())
    );
    return partial?.slug;
}

function buildGlossaryLinks(slug: string): MetricLink[] {
    const term = glossaryData.find((t) => t.slug === slug);
    if (!term) return [];

    const links: MetricLink[] = [];

    if (term.methodsPage) {
        links.push({
            to: term.methodsPage,
            label: `${term.term} Methodology`,
            kind: 'brief',
        });
    }

    const live = GLOSSARY_LIVE_CONFIG[slug];
    if (live?.linkTo) {
        links.push({
            to: live.linkTo,
            label: `Live ${term.term} Terminal`,
            kind: 'terminal',
        });
    }

    glossaryData
        .filter((t) => t.category === term.category && t.slug !== slug)
        .slice(0, 2)
        .forEach((t) => {
            links.push({
                to: `/glossary/${t.slug}`,
                label: t.term,
                kind: 'glossary',
            });
        });

    (term.relatedMetrics ?? []).forEach((metricName) => {
        const metricSlug = findGlossarySlugByLabel(metricName);
        if (metricSlug && metricSlug !== slug) {
            const gTerm = glossaryData.find((t) => t.slug === metricSlug);
            links.push({
                to: `/glossary/${metricSlug}`,
                label: gTerm?.term ?? getMetricLabel(metricName),
                kind: 'metric',
            });
        } else {
            links.push({
                to: `/glossary`,
                label: getMetricLabel(metricName),
                kind: 'metric',
            });
        }
    });

    return links;
}

const kindStyles: Record<LinkKind, { badge: string; color: string; icon: React.ReactNode }> = {
    data: { badge: 'DATA', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5', icon: <Radio size={12} /> },
    glossary: { badge: 'GLOSSARY', color: 'text-amber-400 border-amber-400/30 bg-amber-400/5', icon: <BookOpen size={12} /> },
    brief: { badge: 'METHOD', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5', icon: <FlaskConical size={12} /> },
    lab: { badge: 'LAB', color: 'text-purple-400 border-purple-400/30 bg-purple-400/5', icon: <Activity size={12} /> },
    metric: { badge: 'METRIC', color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5', icon: <Activity size={12} /> },
    terminal: { badge: 'LIVE', color: 'text-rose-400 border-rose-400/30 bg-rose-400/5', icon: <Radio size={12} /> },
};

export const RelatedMetrics: React.FC<RelatedMetricsProps> = ({
    path: pathProp,
    glossarySlug,
    className,
    minLinks = 3,
}) => {
    const { pathname } = useLocation();
    const routeKey = withoutTrailingSlash(pathProp ?? pathname);

    const links = useMemo(() => {
        const seen = new Set<string>();
        const out: MetricLink[] = [];

        const push = (link: MetricLink) => {
            const key = withoutTrailingSlash(link.to);
            if (seen.has(key) || key === routeKey) return;
            seen.add(key);
            out.push({ ...link, to: withTrailingSlash(link.to) });
        };

        if (glossarySlug) {
            buildGlossaryLinks(glossarySlug).forEach(push);
        }

        const relations = matchRoute(routeKey);
        relations?.forEach((r) => push({ to: r.to, label: r.label, kind: r.kind }));

        if (routeKey.startsWith('/methods/')) {
            const slug = routeKey.replace('/methods/', '');
            const glossaryTerm = glossaryData.find(
                (t) => t.methodsPage && withoutTrailingSlash(t.methodsPage) === routeKey
            );
            if (glossaryTerm) {
                push({ to: `/glossary/${glossaryTerm.slug}`, label: glossaryTerm.term, kind: 'glossary' });
            }
            const liveEntry = Object.entries(GLOSSARY_LIVE_CONFIG).find(([, cfg]) =>
                withoutTrailingSlash(cfg.linkTo) === routeKey ||
                cfg.linkTo.includes(slug)
            );
            if (liveEntry) {
                const [gSlug] = liveEntry;
                const gTerm = glossaryData.find((t) => t.slug === gSlug);
                if (gTerm) push({ to: `/glossary/${gSlug}`, label: gTerm.term, kind: 'glossary' });
            }
        }

        if (routeKey.startsWith('/labs/')) {
            push({ to: '/macro-observatory', label: 'Macro Observatory', kind: 'data' });
            push({ to: '/glossary', label: 'Macro Glossary', kind: 'glossary' });
        }

        if (routeKey === '/glossary') {
            push({ to: '/methods/net-liquidity-z-score', label: 'Net Liquidity Methodology', kind: 'brief' });
            push({ to: '/labs/us-macro-fiscal', label: 'US Macro Fiscal Lab', kind: 'lab' });
            push({ to: '/macro-observatory', label: 'Macro Observatory', kind: 'data' });
        }

        return out;
    }, [routeKey, glossarySlug]);

    if (links.length < minLinks) return null;

    return (
        <section className={cn('mt-10 pt-6 border-t border-white/[0.05]', className)}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">
                Related Metrics &amp; Intelligence
            </h3>
            <div className="flex flex-wrap gap-2">
                {links.slice(0, 8).map((link) => {
                    const cfg = kindStyles[link.kind];
                    return (
                        <TrailLink
                            key={link.to}
                            to={link.to}
                            className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors no-underline"
                        >
                            <span className={cn('text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border flex items-center gap-1', cfg.color)}>
                                {cfg.icon}
                                {cfg.badge}
                            </span>
                            <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">
                                {link.label}
                            </span>
                        </TrailLink>
                    );
                })}
            </div>
        </section>
    );
};
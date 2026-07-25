import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, BookOpen, FlaskConical, ChevronRight } from 'lucide-react';
import type { ConceptNode, ConceptRole } from '@/lib/conceptHub';
import { cn } from '@/lib/utils';
import { withTrailingSlash } from '@/lib/urlPath';

const ROLE_COPY: Record<
    ConceptRole,
    { badge: string; badgeClass: string; blurb: string }
> = {
    primary: {
        badge: 'Primary live page',
        badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        blurb: 'Canonical page for live data, definition, and formula. Prefer this URL when citing or linking.',
    },
    definition: {
        badge: 'Definition spoke',
        badgeClass: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
        blurb: 'Short definition. Live terminal data and full methodology live on the primary metric page.',
    },
    methodology: {
        badge: 'Methodology spoke',
        badgeClass: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
        blurb: 'How we calculate this series. For the live reading and SERP-primary URL, use the metric page.',
    },
};

interface Props {
    role: ConceptRole;
    concept: ConceptNode;
    className?: string;
}

/**
 * Soft hub-and-spoke navigation — does not hard-canonical spokes to primary.
 * Signals hierarchy to users and internal link graph for SEO.
 */
export const ConceptHierarchyBanner: React.FC<Props> = ({ role, concept, className }) => {
    const copy = ROLE_COPY[role];
    const links: { path: string; label: string; icon: React.ReactNode; active: boolean }[] = [
        {
            path: concept.primaryPath,
            label: 'Live metric',
            icon: <Activity size={12} />,
            active: role === 'primary',
        },
    ];
    if (concept.definitionPath) {
        links.push({
            path: concept.definitionPath,
            label: 'Definition',
            icon: <BookOpen size={12} />,
            active: role === 'definition',
        });
    }
    if (concept.methodologyPath) {
        links.push({
            path: concept.methodologyPath,
            label: 'Methodology',
            icon: <FlaskConical size={12} />,
            active: role === 'methodology',
        });
    }

    return (
        <aside
            className={cn(
                'mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5',
                className
            )}
            aria-label="Concept page hierarchy"
        >
            <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                    className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.15em]',
                        copy.badgeClass
                    )}
                >
                    {copy.badge}
                </span>
                <span className="text-[11px] font-bold text-white/40">{concept.name}</span>
            </div>
            <p className="mb-3 text-[12px] leading-relaxed text-white/50">{copy.blurb}</p>
            <nav className="flex flex-wrap items-center gap-2" aria-label="Related concept pages">
                {links.map((l, i) => (
                    <React.Fragment key={l.path}>
                        {i > 0 && <ChevronRight size={12} className="text-white/20" aria-hidden />}
                        {l.active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-bold text-white/80">
                                {l.icon}
                                {l.label}
                            </span>
                        ) : (
                            <Link
                                to={withTrailingSlash(l.path)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-transparent px-2.5 py-1.5 text-[11px] font-bold text-blue-400/90 transition-colors hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300"
                            >
                                {l.icon}
                                {l.label}
                            </Link>
                        )}
                    </React.Fragment>
                ))}
            </nav>
        </aside>
    );
};

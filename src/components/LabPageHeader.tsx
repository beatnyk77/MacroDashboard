import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TrailLink } from '@/components/TrailLink';

export interface LabPageHeaderProps {
    /** Ancestor crumbs, in order, e.g. Home → Observatory. */
    trail: { label: string; to: string }[];
    /** Label of the current page (final, non-linked crumb). */
    current: string;
    /** Category badge text. */
    badge: string;
    badgeIcon?: React.ReactNode;
    /** H1 content. Accent words should use `text-blue-400`. */
    title: React.ReactNode;
    /** FreshnessChip / DataProvenanceBadge, rendered beside the title. */
    status?: React.ReactNode;
    /** Institutional thesis paragraph. */
    thesis: React.ReactNode;
    /** Extra header content below the thesis (concept pills, status rows). */
    children?: React.ReactNode;
}

/**
 * Terminal-contract lab page header: breadcrumb strip → category badge →
 * title row (H1 + freshness/provenance) → thesis paragraph.
 */
export const LabPageHeader: React.FC<LabPageHeaderProps> = ({
    trail,
    current,
    badge,
    badgeIcon,
    title,
    status,
    thesis,
    children,
}) => (
    <>
        <nav
            aria-label="Breadcrumb"
            className="mb-8 flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-terminal-dim"
        >
            {trail.map((crumb) => (
                <React.Fragment key={crumb.to}>
                    <TrailLink to={crumb.to} className="transition-colors hover:text-slate-200">
                        {crumb.label}
                    </TrailLink>
                    <ChevronRight size={10} aria-hidden="true" />
                </React.Fragment>
            ))}
            <span aria-current="page" className="text-blue-400">{current}</span>
        </nav>

        <header className="mb-12">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-400">
                {badgeIcon}
                {badge}
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-heading text-white md:text-4xl">{title}</h1>
                {status}
            </div>
            <p className="max-w-3xl text-sm font-normal leading-relaxed text-slate-400 md:text-base">{thesis}</p>
            {children}
        </header>
    </>
);

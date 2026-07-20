import React from 'react';
import { useLocation } from 'react-router-dom';
import { useEngagementTracking } from '@/hooks/useEngagementTracking';
import { EngagementNewsletterPrompt } from '@/components/engagement/EngagementNewsletterPrompt';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { ValueProgressionPath } from '@/components/engagement/ValueProgressionPath';
import { MethodCitationPanel } from '@/components/research/MethodCitationPanel';
import { useLocalePerfHints } from '@/hooks/useLocalePerfHints';
import { withoutTrailingSlash } from '@/lib/urlPath';

/** Exact routes with full engagement UI baked in — skip auto-footer */
const SELF_CONTAINED_EXACT = ['/', '/glossary'];

/** Prefix routes that render RelatedMetrics inside page content */
const SELF_CONTAINED_PREFIXES = ['/methods/', '/labs/', '/glossary/'];

const DATA_ROUTE_PREFIXES = [
    '/',
    '/macro-observatory',
    '/glossary',
    '/methods',
    '/labs',
    '/intel',

    '/countries',
    '/regime-digest',
];

function isDataRoute(path: string): boolean {
    return DATA_ROUTE_PREFIXES.some(
        (p) => path === p || path.startsWith(`${p}/`)
    );
}

function shouldAutoFooter(path: string): boolean {
    if (SELF_CONTAINED_EXACT.includes(path)) return false;
    if (SELF_CONTAINED_PREFIXES.some((p) => path.startsWith(p))) return false;
    return isDataRoute(path);
}

interface EngagementLayerProps {
    embedded?: boolean;
}

export const EngagementLayer: React.FC<EngagementLayerProps> = ({ embedded }) => {
    const { pathname } = useLocation();
    const path = withoutTrailingSlash(pathname);

    useEngagementTracking(!embedded);
    useLocalePerfHints(!embedded);

    if (embedded) return null;

    const showProgression = isDataRoute(path) && !SELF_CONTAINED_EXACT.includes(path);
    const showRelatedMetrics = shouldAutoFooter(path);
    const showMethodCitation = path.startsWith('/methods/');

    if (!showProgression && !showRelatedMetrics && !showMethodCitation) {
        return <EngagementNewsletterPrompt />;
    }

    return (
        <>
            {(showProgression || showRelatedMetrics || showMethodCitation) && (
                <div className="mx-auto mt-8 max-w-5xl space-y-6 px-0">
                    {showProgression && <ValueProgressionPath />}
                    {showRelatedMetrics && <RelatedMetrics minLinks={2} />}
                    {showMethodCitation && <MethodCitationPanel />}
                </div>
            )}
            <EngagementNewsletterPrompt />
        </>
    );
};
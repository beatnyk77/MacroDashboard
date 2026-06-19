import React, { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { recordPageView } from '@/lib/siteAnalytics';
import { withoutTrailingSlash } from '@/lib/urlPath';

/** Lightweight page-view beacon — skipped on admin routes and embed mode. */
export const AnalyticsBeacon: React.FC = () => {
    const { pathname } = useLocation();
    const [searchParams] = useSearchParams();
    const embedded = searchParams.get('embed') === 'true';

    useEffect(() => {
        if (embedded) return;
        recordPageView(withoutTrailingSlash(pathname));
    }, [pathname, embedded]);

    return null;
};
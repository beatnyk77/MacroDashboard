import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { BrandConfig } from '@/config/brandConfig';

/**
 * DefaultSEO — mounted once at the router/layout level.
 *
 * Provides a self-referencing canonical for every route so pages that do not
 * mount <SEOManager> still emit a correct canonical tag.  Pages that DO mount
 * <SEOManager> get its canonical instead: react-helmet-async resolves
 * duplicate tags by last-mounted-wins, so the deeper (page-level) Helmet
 * always overrides this default.
 *
 * Trailing-slash normalisation mirrors the Netlify 301 redirect rule:
 *   /about/ → https://graphiquestor.com/about
 *   /       → https://graphiquestor.com/   (root preserved)
 */
export const DefaultSEO: React.FC = () => {
    const location = useLocation();

    const canonicalPath =
        location.pathname === '/'
            ? '/'
            : location.pathname.replace(/\/$/, '');

    const canonical = `${BrandConfig.baseUrl}${canonicalPath}`;

    return (
        <Helmet>
            <link rel="canonical" href={canonical} />
            <meta name="robots" content="index, follow" />
        </Helmet>
    );
};

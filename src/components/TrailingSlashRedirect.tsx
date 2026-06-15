import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { withTrailingSlash } from '@/lib/urlPath';

/**
 * Client-side trailing-slash enforcement (pairs with Netlify 301 rules).
 * Root `/` is unchanged; all other paths gain a terminal slash.
 */
export const TrailingSlashRedirect: React.FC = () => {
    const { pathname, search, hash } = useLocation();

    if (pathname !== '/' && !pathname.endsWith('/')) {
        return <Navigate to={`${withTrailingSlash(pathname)}${search}${hash}`} replace />;
    }

    return null;
};
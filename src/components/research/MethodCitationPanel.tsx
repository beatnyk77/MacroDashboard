import React from 'react';
import { useLocation } from 'react-router-dom';
import { getMethodCitation } from '@/config/methodCitations';
import { CiteThisPage } from '@/components/research/CiteThisPage';
import { withoutTrailingSlash } from '@/lib/urlPath';

export const MethodCitationPanel: React.FC = () => {
    const { pathname } = useLocation();
    const path = withoutTrailingSlash(pathname);
    const input = getMethodCitation(path);

    if (!input) return null;

    return <CiteThisPage input={input} className="mt-8" />;
};
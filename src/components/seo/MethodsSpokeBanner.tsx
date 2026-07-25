import React from 'react';
import { useLocation } from 'react-router-dom';
import { getConceptByMethodsPath } from '@/lib/conceptHub';
import { ConceptHierarchyBanner } from '@/components/seo/ConceptHierarchyBanner';

/** Drop into any /methods/* page to show soft hub-spoke nav. */
export const MethodsSpokeBanner: React.FC<{ className?: string }> = ({ className }) => {
    const { pathname } = useLocation();
    const concept = getConceptByMethodsPath(pathname);
    if (!concept) return null;
    return <ConceptHierarchyBanner role="methodology" concept={concept} className={className} />;
};

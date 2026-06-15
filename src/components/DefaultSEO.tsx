import React from 'react';
import { SEOManager } from '@/components/SEOManager';

/**
 * @deprecated Use layout-level `<SEOManager />` (no props) instead.
 * Kept for tests and backward compatibility.
 */
export const DefaultSEO: React.FC = () => <SEOManager mode="layout" />;
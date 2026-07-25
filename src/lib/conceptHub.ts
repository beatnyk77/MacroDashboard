/**
 * Soft hub-and-spoke map for proprietary concepts.
 * Primary ranker: /metrics/{id}
 * Spokes: /glossary/{slug} (definition), /methods/... (methodology)
 */
import { METRICS_CATALOG } from '@/features/metrics/metricsCatalog';

export type ConceptRole = 'primary' | 'definition' | 'methodology';

export interface ConceptNode {
    /** Display name */
    name: string;
    /** Primary money URL (live + definition snippet) */
    primaryPath: string;
    /** Glossary definition spoke */
    definitionPath?: string;
    /** Methods deep-dive spoke */
    methodologyPath?: string;
}

/** Glossary slug → metrics catalog id (where slugs differ). */
const GLOSSARY_TO_METRIC: Record<string, string> = {
    'net-liquidity-z-score': 'net-liquidity-zscore',
    'net-liquidity': 'net-liquidity',
    'fiscal-dominance-meter': 'fiscal-dominance-meter',
    'fiscal-dominance': 'fiscal-dominance-meter',
    'm2-gold-ratio': 'm2-gold-ratio',
    'debt-gold-z-score': 'debt-gold-zscore',
    'loan-to-job-efficiency': 'loan-to-job-efficiency',
    'energy-dependency-ratio': 'energy-dependency-ratio',
    'fed-monetization-ratio': 'fed-monetization-ratio',
    'india-credit-cycle-clock': 'india-credit-cycle',
    'china-debt-iceberg': 'china-iceberg-ratio',
};

/** Methods path (no trailing slash) → metrics catalog id */
const METHODS_TO_METRIC: Record<string, string> = {
    '/methods/net-liquidity-z-score': 'net-liquidity-zscore',
    '/methods/fiscal-dominance-meter': 'fiscal-dominance-meter',
    '/methods/m2-gold-ratio': 'm2-gold-ratio',
    '/methods/debt-gold-z-score': 'debt-gold-zscore',
    '/methods/loan-to-job-efficiency': 'loan-to-job-efficiency',
    '/methods/energy-dependency-ratio': 'energy-dependency-ratio',
    '/methods/fed-monetization-monitor': 'fed-monetization-ratio',
    '/methods/india-credit-cycle-clock': 'india-credit-cycle',
    '/methods/china-debt-iceberg': 'china-iceberg-ratio',
};

/** Optional glossary slug overrides when catalog id ≠ slug */
const METRIC_TO_GLOSSARY: Record<string, string> = {
    'net-liquidity-zscore': 'net-liquidity-z-score',
    'net-liquidity': 'net-liquidity-z-score',
    'debt-gold-zscore': 'debt-gold-z-score',
    'fiscal-dominance-meter': 'fiscal-dominance-meter',
    'm2-gold-ratio': 'm2-gold-ratio',
    'loan-to-job-efficiency': 'loan-to-job-efficiency',
    'energy-dependency-ratio': 'energy-dependency-ratio',
    'fed-monetization-ratio': 'fed-monetization-ratio',
    'india-credit-cycle': 'india-credit-cycle-clock',
    'china-iceberg-ratio': 'china-debt-iceberg',
};

function normalizePath(path: string): string {
    if (!path) return '/';
    const bare = path.split(/[?#]/)[0];
    if (bare.length > 1 && bare.endsWith('/')) return bare.slice(0, -1);
    return bare || '/';
}

function buildNode(metricId: string): ConceptNode | undefined {
    const entry = METRICS_CATALOG.find((m) => m.id === metricId);
    if (!entry) return undefined;
    const methodologyPath =
        entry.relatedPage?.startsWith('/methods/') ? entry.relatedPage : METHODS_TO_METRIC_REVERSE[metricId];
    const glossarySlug = METRIC_TO_GLOSSARY[metricId];
    return {
        name: entry.name,
        primaryPath: `/metrics/${entry.id}`,
        definitionPath: glossarySlug ? `/glossary/${glossarySlug}` : undefined,
        methodologyPath: methodologyPath || undefined,
    };
}

const METHODS_TO_METRIC_REVERSE: Record<string, string> = Object.fromEntries(
    Object.entries(METHODS_TO_METRIC).map(([path, id]) => [id, path])
);

export function getConceptByMetricId(metricId: string): ConceptNode | undefined {
    return buildNode(metricId);
}

export function getConceptByGlossarySlug(slug: string): ConceptNode | undefined {
    const metricId = GLOSSARY_TO_METRIC[slug];
    if (metricId) return buildNode(metricId);
    // try direct catalog id match
    if (METRICS_CATALOG.some((m) => m.id === slug)) return buildNode(slug);
    return undefined;
}

export function getConceptByMethodsPath(pathname: string): ConceptNode | undefined {
    const path = normalizePath(pathname);
    const metricId = METHODS_TO_METRIC[path];
    if (metricId) return buildNode(metricId);
    // catalog relatedPage exact match
    const entry = METRICS_CATALOG.find((m) => m.relatedPage && normalizePath(m.relatedPage) === path);
    if (entry) return buildNode(entry.id);
    return undefined;
}

export function getConceptByPath(pathname: string): { role: ConceptRole; concept: ConceptNode } | undefined {
    const path = normalizePath(pathname);
    if (path.startsWith('/metrics/')) {
        const id = path.slice('/metrics/'.length);
        const concept = getConceptByMetricId(id);
        if (concept) return { role: 'primary', concept };
    }
    if (path.startsWith('/glossary/')) {
        const slug = path.slice('/glossary/'.length);
        const concept = getConceptByGlossarySlug(slug);
        if (concept) return { role: 'definition', concept };
    }
    if (path.startsWith('/methods/')) {
        const concept = getConceptByMethodsPath(path);
        if (concept) return { role: 'methodology', concept };
    }
    return undefined;
}

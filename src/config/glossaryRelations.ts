import { glossaryData } from '@/features/glossary/glossaryData';
import type { RelatedLink } from '@/config/contentRelations';

const HOMEPAGE: RelatedLink = { to: '/', label: 'Live Terminal', kind: 'data' };

/** Category-level defaults when no term-specific override exists. */
const CATEGORY_DEFAULTS: Record<string, RelatedLink[]> = {
    Liquidity: [
        { to: '/labs/shadow-system', label: 'Shadow System Lab', kind: 'lab' },
        { to: '/methods/net-liquidity-z-score', label: 'Net Liquidity Methodology', kind: 'brief' },
        { to: '/glossary/reverse-repo-facility-rrp', label: 'Reverse Repo Facility', kind: 'glossary' },
    ],
    'Monetary Policy': [
        { to: '/labs/us-macro-fiscal', label: 'US Macro & Fiscal Lab', kind: 'lab' },
        { to: '/methods/fiscal-dominance-meter', label: 'Fiscal Dominance Meter', kind: 'brief' },
        { to: '/glossary/breakeven-inflation-rate', label: 'Breakeven Inflation', kind: 'glossary' },
    ],
    'Sovereign Debt': [
        { to: '/labs/sovereign-stress', label: 'Sovereign Stress Lab', kind: 'lab' },
        { to: '/labs/us-macro-fiscal', label: 'US Fiscal Lab', kind: 'lab' },
        { to: '/methods/fiscal-dominance-meter', label: 'Fiscal Dominance Methodology', kind: 'brief' },
    ],
    Geopolitics: [
        { to: '/labs/de-dollarization-gold', label: 'De-Dollarization & Gold', kind: 'lab' },
        { to: '/intel/china', label: 'China Macro Pulse', kind: 'data' },
        { to: '/intel/india', label: 'India Macro Pulse', kind: 'data' },
    ],
    'Hard Assets': [
        { to: '/labs/de-dollarization-gold', label: 'Gold & Reserve Lab', kind: 'lab' },
        { to: '/methods/m2-gold-ratio', label: 'M2/Gold Ratio Methodology', kind: 'brief' },
        { to: '/labs/central-bank-gold-purchases', label: 'Central Bank Gold', kind: 'lab' },
    ],
    'Macro Indicators': [
        { to: '/intel/india', label: 'India Macro Intel', kind: 'data' },
        { to: '/labs/energy-commodities', label: 'Energy Commodities Lab', kind: 'lab' },
        { to: '/glossary/macro-regime-classification', label: 'Regime Classification', kind: 'glossary' },
    ],
};

/** High-impression term overrides with richer cross-links. */
const TERM_OVERRIDES: Record<string, RelatedLink[]> = {
    'breakeven-inflation-rate': [
        { to: '/methods/fed-monetization-monitor', label: 'Fed Monetization Monitor', kind: 'brief' },
        { to: '/glossary/real-interest-rates', label: 'Real Interest Rates', kind: 'glossary' },
        { to: '/glossary/fiscal-dominance', label: 'Fiscal Dominance', kind: 'glossary' },
        { to: '/labs/us-macro-fiscal', label: 'US Macro Lab', kind: 'lab' },
    ],
    'foreign-exchange-reserves': [
        { to: '/intel/india', label: 'India Reserve Trends', kind: 'data' },
        { to: '/labs/de-dollarization-gold', label: 'Reserve Diversification', kind: 'lab' },
        { to: '/glossary/de-dollarization', label: 'De-Dollarization', kind: 'glossary' },
        { to: '/glossary/reserve-currency-composition', label: 'Reserve Composition', kind: 'glossary' },
    ],
    'fiscal-dominance': [
        { to: '/methods/fiscal-dominance-meter', label: 'Fiscal Dominance Meter', kind: 'brief' },
        { to: '/labs/us-macro-fiscal', label: 'US Fiscal Lab', kind: 'lab' },
        { to: '/glossary/interest-expense-to-tax-revenue', label: 'Interest / Tax Revenue', kind: 'glossary' },
        { to: '/labs/sovereign-stress', label: 'Sovereign Stress Lab', kind: 'lab' },
    ],
    tga: [
        { to: '/methods/net-liquidity-z-score', label: 'Net Liquidity Methodology', kind: 'brief' },
        { to: '/labs/shadow-system', label: 'Funding Plumbing Lab', kind: 'lab' },
        { to: '/glossary/net-liquidity-z-score', label: 'Net Liquidity Z-Score', kind: 'glossary' },
        { to: '/glossary/reverse-repo-facility-rrp', label: 'Reverse Repo Facility', kind: 'glossary' },
    ],
    'm2-gold-ratio': [
        { to: '/methods/m2-gold-ratio', label: 'M2/Gold Methodology', kind: 'brief' },
        { to: '/labs/de-dollarization-gold', label: 'Gold & Reserve Lab', kind: 'lab' },
        { to: '/methods/debt-gold-z-score', label: 'Debt/Gold Z-Score', kind: 'brief' },
        { to: '/glossary/de-dollarization', label: 'De-Dollarization', kind: 'glossary' },
    ],
    'net-liquidity-z-score': [
        { to: '/methods/net-liquidity-z-score', label: 'Full Methodology', kind: 'brief' },
        { to: '/labs/shadow-system', label: 'Shadow System Lab', kind: 'lab' },
        { to: '/glossary/tga', label: 'Treasury General Account', kind: 'glossary' },
        { to: '/glossary/reverse-repo-facility-rrp', label: 'Reverse Repo Facility', kind: 'glossary' },
    ],
    'de-dollarization': [
        { to: '/methods/de-dollarization-guide', label: 'De-Dollarization Guide', kind: 'brief' },
        { to: '/labs/de-dollarization-gold', label: 'Gold Reserve Lab', kind: 'lab' },
        { to: '/glossary/petrodollar-system', label: 'Petrodollar System', kind: 'glossary' },
        { to: '/intel/china', label: 'China Macro Pulse', kind: 'data' },
    ],
};

function dedupeLinks(links: RelatedLink[]): RelatedLink[] {
    const seen = new Set<string>();
    return links.filter((link) => {
        if (seen.has(link.to)) return false;
        seen.add(link.to);
        return true;
    });
}

/**
 * Returns 4+ related links for a glossary term slug, always including homepage.
 */
export function getGlossaryRelations(slug: string): RelatedLink[] {
    const term = glossaryData.find((t) => t.slug === slug);
    if (!term) return [HOMEPAGE];

    const links: RelatedLink[] = [HOMEPAGE];

    if (TERM_OVERRIDES[slug]) {
        return dedupeLinks([...links, ...TERM_OVERRIDES[slug]]);
    }

    if (term.methodsPage) {
        links.push({ to: term.methodsPage, label: 'Full Methodology', kind: 'brief' });
    }

    const sameCategory = glossaryData
        .filter((t) => t.category === term.category && t.slug !== slug)
        .slice(0, 2)
        .map((t) => ({
            to: `/glossary/${t.slug}`,
            label: t.term,
            kind: 'glossary' as const,
        }));

    const categoryDefaults = (CATEGORY_DEFAULTS[term.category] ?? []).filter(
        (l) => l.to !== `/glossary/${slug}`
    );

    return dedupeLinks([...links, ...sameCategory, ...categoryDefaults]).slice(0, 6);
}

/** All glossary slugs for validation. */
export const ALL_GLOSSARY_SLUGS = glossaryData.map((t) => t.slug);
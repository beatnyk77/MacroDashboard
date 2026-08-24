export const BrandConfig = {
  name: 'GraphiQuestor',
  shortName: 'GQ',
  namePrefix: 'Graphi',
  nameSuffix: 'Questor',
  tagline: 'Macro Observatory · Not Sovereign AI',
  domain: 'graphiquestor.com',
  baseUrl: 'https://graphiquestor.com',
  signalBadgePrefix: 'GQ',
  twitter: '@GraphiQuestor',
  colors: {
    primary: '#3b82f6',
    accent: '#f59e0b',
  },
  seo: {
    siteName: 'GraphiQuestor',
    titleTemplate: '%s | GraphiQuestor',
    defaultTitle: 'GraphiQuestor — Global Macro Intelligence Terminal | Fiscal Dominance, Sovereign Stress & De-Dollarization',
    defaultDescription: 'Institutional macro intelligence terminal tracking global liquidity, sovereign stress, fiscal dominance, and de-dollarization. Free institutional-grade macro data for India, China, US, Africa and G20.',
    ogImage: 'https://graphiquestor.com/hero-preview.jpg',
    logoImage: 'https://graphiquestor.com/hero-preview.jpg',
  },
  features: {
    showSubscribeCTA: true,
    showAPIAccess: true,
    showInstitutionalInquiry: true,
    showBlog: true,
    showGitHub: true,
  },
  legal: {
    disclaimer: 'GraphiQuestor is a macro intelligence platform provided for informational and educational purposes only. The data, analytics, and interpretations presented do not constitute investment advice.',
    publisherName: 'FounderHQ LLP',
    founderName: 'Kartikay Sharma',
  },
} as const;

export type BrandConfigType = typeof BrandConfig;

/**
 * Canonical author entity: the named, credentialed expert behind the site's editorial
 * and methodology content. Reused across JSON-LD `author` blocks instead of a faceless
 * org name, so search/AI engines can attribute expertise to a real person (EEAT).
 */
export const AuthorPersonSchema = {
  '@type': 'Person',
  name: BrandConfig.legal.founderName,
  jobTitle: 'Chartered Accountant & Macro Analyst',
  url: `${BrandConfig.baseUrl}/about`,
  sameAs: ['https://www.linkedin.com/in/kartikay-sharma-b9190214/'],
} as const;

/**
 * Canonical publisher entity: FounderHQ LLP operates GraphiQuestor as its brand and was
 * founded by Kartikay Sharma. Reused across JSON-LD `publisher`/`worksFor` blocks instead
 * of each page hand-rolling its own "GraphiQuestor" Organization object, so the
 * publisher-of-record stays consistent site-wide.
 */
export const PublisherOrganizationSchema = {
  '@type': 'Organization',
  name: BrandConfig.legal.publisherName,
  url: BrandConfig.baseUrl,
  brand: {
    '@type': 'Brand',
    name: BrandConfig.name,
  },
  logo: {
    '@type': 'ImageObject',
    url: BrandConfig.seo.logoImage,
  },
  founder: AuthorPersonSchema,
} as const;

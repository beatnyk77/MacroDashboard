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
  },
} as const;

export type BrandConfigType = typeof BrandConfig;

export interface ResearchNarrative {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  blog_url: string;
  methodology_url?: string;
  lab_url?: string;
  excerpt: string;
}

export const RESEARCH_NARRATIVES: ResearchNarrative[] = [
  {
    slug: 'm2-gold-ratio-debasement-signal-2026',
    title: 'M2/Gold Ratio: Debasement Signal',
    description: 'Structural regime classifier comparing global M2 to gold market cap.',
    category: 'Monetary Policy',
    tags: ['gold', 'm2', 'liquidity', 'debasement'],
    blog_url: '/blog/m2-gold-ratio-debasement-signal-2026',
    methodology_url: '/methods/m2-gold-ratio',
    lab_url: '/labs/de-dollarization-gold',
    excerpt:
      'The M2/Gold Ratio divides global broad money by above-ground gold market cap. A rising ratio signals fiat creation outpacing hard-money repricing — a multi-year structural debasement classifier, not a timing tool.',
  },
  {
    slug: 'brics-de-dollarization-tracker-2026',
    title: 'BRICS De-Dollarization Tracker',
    description: 'Multipolar reserve shift, mBridge, and gold as neutral reserve asset.',
    category: 'Geopolitics',
    tags: ['dedollarization', 'brics', 'reserves', 'gold'],
    blog_url: '/blog/brics-de-dollarization-tracker-2026',
    methodology_url: '/methods/de-dollarization-guide',
    lab_url: '/labs/de-dollarization-gold',
    excerpt:
      'Reserve composition is shifting from USD dominance toward gold and bilateral settlement rails. GraphiQuestor tracks BRICS gold holdings and USD reserve share with quarterly provenance.',
  },
  {
    slug: 'global-net-liquidity-guide-2026',
    title: 'Global Net Liquidity Guide',
    description: 'Fed balance sheet minus TGA and RRP — the liquidity impulse framework.',
    category: 'Liquidity',
    tags: ['liquidity', 'fed', 'rrp', 'tga', 'net liquidity'],
    blog_url: '/blog/global-net-liquidity-guide-2026',
    methodology_url: '/methods/global-net-liquidity',
    lab_url: '/',
    excerpt:
      'Net liquidity = Fed assets − Treasury General Account − reverse repo. The Z-score regime classifies expanding vs contracting financial conditions that precede risk-asset inflections.',
  },
  {
    slug: 'india-macro-pulse-mospi-dashboard-guide',
    title: 'India Macro Pulse & MoSPI Depth',
    description: 'PLFS, ASI, IIP, and state-level granularity beyond headline GDP.',
    category: 'India',
    tags: ['india', 'mospi', 'asi', 'credit cycle', 'rbi'],
    blog_url: '/blog/india-macro-pulse-mospi-dashboard-guide',
    methodology_url: '/methods/india-credit-cycle-clock',
    lab_url: '/intel/india',
    excerpt:
      'Headline India GDP misses manufacturing utilization, credit-cycle phase, and RBI intervention posture. GraphiQuestor integrates MoSPI/eSankhyiki series with proprietary India Macro Score.',
  },
  {
    slug: 'g20-macro-surveillance-dashboard-analysis',
    title: 'G20 Macro Surveillance',
    description: 'Cross-sovereign stress and hard-asset buffer analysis.',
    category: 'Sovereign Risk',
    tags: ['g20', 'sovereign', 'debt', 'stress'],
    blog_url: '/blog/g20-macro-surveillance-dashboard-analysis',
    lab_url: '/labs/sovereign-stress',
    excerpt:
      'G20 sovereign stress composite aggregates debt/GDP, growth, and reserve coverage into a single surveillance read for allocators comparing fiscal dominance across jurisdictions.',
  },
  {
    slug: 'shanghai-divergence-indicator-explained',
    title: 'Shanghai Divergence Indicator',
    description: 'PBOC monetary ops vs fiscal impulse tension in China.',
    category: 'China',
    tags: ['china', 'pboc', 'shanghai', 'debt'],
    blog_url: '/blog/shanghai-divergence-indicator-explained',
    lab_url: '/intel/china',
    excerpt:
      'When PBOC liquidity injection diverges from fiscal tightening, credit transmission breaks down. The Shanghai Divergence signal surfaces this policy mix tension for China macro desks.',
  },
];

export function findNarratives(topic: string): ResearchNarrative[] {
  const q = topic.toLowerCase();
  return RESEARCH_NARRATIVES.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q) ||
      n.tags.some((t) => q.includes(t) || t.includes(q)) ||
      n.category.toLowerCase().includes(q) ||
      n.slug.includes(q.replace(/\s+/g, '-'))
  );
}
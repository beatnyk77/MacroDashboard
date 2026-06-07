import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const BASE_URL = 'https://graphiquestor.com';

async function generateSitemap() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  // Static routes (always present)
  const staticRoutes = [
    { url: '/',                    priority: '1.0', changefreq: 'daily'   },
    { url: '/macro-brief',         priority: '0.9', changefreq: 'daily'   },
    { url: '/weekly-narrative',    priority: '0.8', changefreq: 'weekly'  },
    { url: '/regime-digest',       priority: '0.8', changefreq: 'monthly' },
    { url: '/intel/india',         priority: '0.9', changefreq: 'daily'   },
    { url: '/intel/china',         priority: '0.8', changefreq: 'daily'   },
    { url: '/trade',               priority: '0.8', changefreq: 'weekly'  },
    { url: '/labs',                priority: '0.7', changefreq: 'weekly'  },
    { url: '/api-docs',            priority: '0.8', changefreq: 'monthly' },
    { url: '/demo',                priority: '0.7', changefreq: 'monthly' },
    { url: '/macro-brief/archive', priority: '0.6', changefreq: 'weekly'  },
    { url: '/glossary',            priority: '0.7', changefreq: 'weekly'  },
    { url: '/countries',           priority: '0.7', changefreq: 'weekly'  },
  ];

  // Dynamic: Morning Brief pages (last 60 days)
  const { data: briefs } = await supabase
    .from('daily_macro_briefs')
    .select('brief_date, generated_at')
    .order('brief_date', { ascending: false })
    .limit(60);

  const briefRoutes = (briefs ?? []).map(b => ({
    url: `/macro-brief/${b.brief_date}`,
    priority: '0.8',
    changefreq: 'never' as const,
    lastmod: b.generated_at,
  }));

  // Dynamic: Weekly narrative pages
  const { data: narratives } = await supabase
    .from('weekly_regime_digests')
    .select('week_start, created_at')
    .order('week_start', { ascending: false })
    .limit(52);

  const narrativeRoutes = (narratives ?? []).map(n => ({
    url: `/weekly-narrative/${n.week_start}`,
    priority: '0.7',
    changefreq: 'never' as const,
    lastmod: n.created_at,
  }));

  // Dynamic: Regime digest monthly pages
  const { data: digests } = await supabase
    .from('weekly_regime_digests')
    .select('week_start')
    .order('week_start', { ascending: false })
    .limit(24);

  // Derive unique year/month combos
  const monthSet = new Set(
    (digests ?? []).map(d => {
      const date = new Date(d.week_start);
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    })
  );
  const digestRoutes = [...monthSet].map(ym => ({
    url: `/regime-digest/${ym}`,
    priority: '0.7',
    changefreq: 'never' as const,
  }));

interface SitemapRoute {
  url: string;
  priority: string;
  changefreq: string;
  lastmod?: string;
}

  // Build XML
  const allRoutes: SitemapRoute[] = [
    ...staticRoutes,
    ...briefRoutes,
    ...narrativeRoutes,
    ...digestRoutes,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
    ${route.lastmod ? `<lastmod>${new Date(route.lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  writeFileSync('public/sitemap.xml', xml);
  console.log(`Sitemap generated: ${allRoutes.length} URLs`);
}

generateSitemap().catch(console.error);

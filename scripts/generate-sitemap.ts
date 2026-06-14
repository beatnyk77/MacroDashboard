import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

const BASE_URL = 'https://graphiquestor.com';

/**
 * Returns the date of the last git commit touching the given source file,
 * formatted as YYYY-MM-DD.  Falls back to today's build date if git is
 * unavailable or the file isn't tracked.
 *
 * Used for static pages whose content changes only when the source file
 * changes — giving Google accurate freshness signals without fabricating dates.
 */
function gitLastmod(sourceFile: string): string {
  try {
    const iso = execSync(`git log -1 --format=%cI -- ${sourceFile}`, { encoding: 'utf8' }).trim();
    if (iso) return iso.split('T')[0];
  } catch {
    // git unavailable (e.g. CI without repo) — fall through to build date
  }
  return new Date().toISOString().split('T')[0];
}

const BUILD_DATE = new Date().toISOString().split('T')[0];

async function generateSitemap() {
  // Static routes — lastmod strategy:
  //   • Live-data pages (changefreq daily/weekly): data genuinely refreshes on
  //     every ingestion run, so build date is the honest answer.
  //   • Editorial/static pages: git log date of the owning component file.
  const staticRoutes = [
    // Live-data pages — lastmod = build date (data refreshes daily via crons)
    { url: '/',                    priority: '1.0', changefreq: 'daily',   lastmod: BUILD_DATE },
    { url: '/macro-brief',         priority: '0.9', changefreq: 'daily',   lastmod: BUILD_DATE },
    { url: '/weekly-narrative',    priority: '0.8', changefreq: 'weekly',  lastmod: BUILD_DATE },
    { url: '/regime-digest',       priority: '0.8', changefreq: 'monthly', lastmod: BUILD_DATE },
    { url: '/intel/india',         priority: '0.9', changefreq: 'daily',   lastmod: BUILD_DATE },
    { url: '/intel/china',         priority: '0.8', changefreq: 'daily',   lastmod: BUILD_DATE },
    { url: '/trade',               priority: '0.8', changefreq: 'weekly',  lastmod: BUILD_DATE },
    { url: '/countries',           priority: '0.7', changefreq: 'weekly',  lastmod: BUILD_DATE },
    // Static/editorial pages — lastmod = git log date of owning component
    { url: '/labs',                priority: '0.7', changefreq: 'weekly',  lastmod: gitLastmod('src/pages/labs/ThematicLabsIndexPage.tsx') },
    { url: '/api-docs',            priority: '0.8', changefreq: 'monthly', lastmod: gitLastmod('src/pages/APIDocsPage.tsx') },
    { url: '/glossary',            priority: '0.7', changefreq: 'weekly',  lastmod: gitLastmod('src/pages/GlossaryIndexPage.tsx') },
    { url: '/macro-brief/archive', priority: '0.6', changefreq: 'weekly',  lastmod: gitLastmod('src/pages/MacroBriefArchivePage.tsx') },
    { url: '/demo',                priority: '0.7', changefreq: 'monthly', lastmod: BUILD_DATE },
  ];

  // Dynamic routes require Supabase — degrade gracefully if env vars unavailable (e.g. CI)
  let briefRoutes: SitemapRoute[] = [];
  let narrativeRoutes: SitemapRoute[] = [];
  let digestRoutes: SitemapRoute[] = [];

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Dynamic: Morning Brief pages (last 60 days)
    const { data: briefs } = await supabase
      .from('daily_macro_briefs')
      .select('brief_date, generated_at')
      .order('brief_date', { ascending: false })
      .limit(60);

    briefRoutes = (briefs ?? []).map(b => ({
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

    narrativeRoutes = (narratives ?? []).map(n => ({
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
    // Derive lastmod from the month itself (first day): the digest was
    // created during that month, so the month-start date is the earliest
    // honest bound and is always distinct per entry.
    digestRoutes = [...monthSet].map(ym => ({
      url: `/regime-digest/${ym}`,
      priority: '0.7',
      changefreq: 'never' as const,
      lastmod: `${ym.replace('/', '-')}-01`,
    }));
  } else {
    console.warn('⚠ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set — generating sitemap with static routes only.');
  }

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

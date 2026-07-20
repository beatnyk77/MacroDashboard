import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { blogArticles } from '../src/features/blog/blogData';
import { glossaryData } from '../src/features/glossary/glossaryData';
import { METRICS_CATALOG } from '../src/features/metrics/metricsCatalog';
import { dedupeSitemapRoutes, sitemapLoc } from '../src/lib/sitemapHelpers';

/**
 * Priority heuristic (sitemap hints, not ranking signals):
 *   1.0 — homepage
 *   0.9 — primary intelligence hubs (macro-brief, intel/india)
 *   0.8 — top-level sections (one path segment: /trade, /blog, /labs)
 *   0.7 — deeper content (dated briefs, blog articles, regime-digest months, HS codes)
 *   0.6 — archives and secondary indexes
 */
function routePriority(url: string): string {
  if (url === '/') return '1.0';
  if (url === '/macro-brief' || url === '/intel/india') return '0.9';
  if (url === '/macro-brief/archive') return '0.6';
  const depth = url.split('/').filter(Boolean).length;
  if (depth >= 2) return '0.7';
  return '0.8';
}

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

interface SitemapRoute {
  url: string;
  priority: string;
  changefreq: string;
  lastmod?: string;
}

async function generateSitemap() {
  // Static routes — lastmod strategy:
  //   • Dynamic content (blog, briefs, narratives, regime-digest): publish date from content source.
  //   • Live-data pages (intel, trade, countries): build date — data refreshes daily via crons.
  //   • Editorial/static pages: git log date of the owning component file.
  //   • Unknown/new pages: today's build date (fallback only).
  const staticRoutes: SitemapRoute[] = [
    // Live-data pages — lastmod = build date (data refreshes daily via crons)
    { url: '/',                    changefreq: 'daily',   lastmod: BUILD_DATE },
    { url: '/macro-brief',         changefreq: 'daily',   lastmod: BUILD_DATE },
    { url: '/weekly-narrative',    changefreq: 'weekly',  lastmod: BUILD_DATE },
    { url: '/regime-digest',       changefreq: 'monthly', lastmod: BUILD_DATE },
    { url: '/intel/india',         changefreq: 'daily',   lastmod: BUILD_DATE },
    { url: '/intel/china',         changefreq: 'daily',   lastmod: BUILD_DATE },
    { url: '/countries',           changefreq: 'weekly',  lastmod: BUILD_DATE },
    // Static/editorial pages — lastmod = git log date of owning component
    { url: '/blog',                changefreq: 'weekly',  lastmod: gitLastmod('src/pages/BlogPage.tsx') },
    { url: '/labs',                changefreq: 'weekly',  lastmod: gitLastmod('src/pages/labs/ThematicLabsIndexPage.tsx') },
    { url: '/api-docs',            changefreq: 'monthly', lastmod: gitLastmod('src/pages/APIDocsPage.tsx') },
    { url: '/mcp',                 changefreq: 'monthly', lastmod: gitLastmod('src/pages/MCPIntelligencePage.tsx') },
    { url: '/glossary',            changefreq: 'weekly',  lastmod: gitLastmod('src/pages/GlossaryIndexPage.tsx') },
    { url: '/methodology',         changefreq: 'weekly',  lastmod: gitLastmod('src/pages/MetricsMethodologyPage.tsx') },
    { url: '/for-researchers',     changefreq: 'weekly',  lastmod: gitLastmod('src/pages/ForResearchersPage.tsx') },
    { url: '/institutional',       changefreq: 'monthly', lastmod: gitLastmod('src/pages/ForInstitutional.tsx') },
    { url: '/api-access',          changefreq: 'monthly', lastmod: gitLastmod('src/pages/APIAccessPage.tsx') },
    { url: '/macro-brief/archive', changefreq: 'weekly',  lastmod: gitLastmod('src/pages/MacroBriefArchivePage.tsx') },
    { url: '/about',               changefreq: 'monthly', lastmod: gitLastmod('src/pages/About.tsx') },
    { url: '/privacy',             changefreq: 'yearly',  lastmod: gitLastmod('src/pages/PrivacyPolicy.tsx') },
    { url: '/terms',               changefreq: 'yearly',  lastmod: gitLastmod('src/pages/TermsOfService.tsx') },
    { url: '/data-sources',        changefreq: 'monthly', lastmod: gitLastmod('src/pages/DataSourcesPage.tsx') },
    { url: '/macro-observatory',   changefreq: 'weekly',  lastmod: gitLastmod('src/pages/MacroObservatory.tsx') },
    { url: '/demo',                changefreq: 'monthly', lastmod: BUILD_DATE },
    // Additional static pages (labs, methods, tools) — lastmod = build date (data refreshes daily via crons)
    { url: '/labs/us-macro-fiscal', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/labs/de-dollarization-gold', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/labs/central-bank-gold-purchases', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/labs/brics-trade-settlement', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/labs/us-treasury-foreign-holdings', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/labs/petrodollar-decay-indicators', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/labs/energy-commodities', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/labs/sovereign-stress', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/labs/shadow-system', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/labs/china-15th-fyp', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/labs/africa-macro', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/methods/net-liquidity-z-score', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/methods/debt-gold-z-score', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/methods/loan-to-job-efficiency', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/methods/energy-dependency-ratio', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/methods/fiscal-dominance-meter', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/methods/m2-gold-ratio', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/methods/de-dollarization-guide', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/methods/fed-monetization-monitor', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/methods/india-credit-cycle-clock', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/methods/china-debt-iceberg', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/tools', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/tools/net-liquidity-gauge', changefreq: 'weekly', lastmod: BUILD_DATE },
    { url: '/tools/daily-regime-signal', changefreq: 'daily', lastmod: BUILD_DATE },
    { url: '/tools/gold-ratios', changefreq: 'daily', lastmod: BUILD_DATE },
  ].map(route => ({ ...route, priority: routePriority(route.url) }));

  // Blog articles — lastmod = article publish date from blogData
  const blogRoutes: SitemapRoute[] = blogArticles.map(article => ({
    url: `/blog/${article.slug}`,
    priority: routePriority(`/blog/${article.slug}`),
    changefreq: 'never',
    lastmod: article.date,
  }));

  const glossaryRoutes: SitemapRoute[] = glossaryData.map(term => ({
    url: `/glossary/${term.slug}`,
    priority: routePriority(`/glossary/${term.slug}`),
    changefreq: 'monthly',
    lastmod: gitLastmod('src/pages/GlossaryTermPage.tsx'),
  }));

  // Programmatic metric pages — content lives in the shared catalog
  const metricRoutes: SitemapRoute[] = METRICS_CATALOG.map(metric => ({
    url: `/metrics/${metric.id}`,
    priority: routePriority(`/metrics/${metric.id}`),
    changefreq: 'weekly',
    lastmod: gitLastmod('src/features/metrics/metricsCatalog.ts'),
  }));

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
      priority: routePriority(`/macro-brief/${b.brief_date}`),
      changefreq: 'never' as const,
      lastmod: b.generated_at ?? b.brief_date,
    }));

    // Dynamic: Weekly narrative pages
    const { data: narratives } = await supabase
      .from('weekly_regime_digests')
      .select('week_start, created_at')
      .order('week_start', { ascending: false })
      .limit(52);

    narrativeRoutes = (narratives ?? []).map(n => ({
      url: `/weekly-narrative/${n.week_start}`,
      priority: routePriority(`/weekly-narrative/${n.week_start}`),
      changefreq: 'never' as const,
      lastmod: n.created_at ?? n.week_start,
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
      priority: routePriority(`/regime-digest/${ym}`),
      changefreq: 'never' as const,
      lastmod: `${ym.replace('/', '-')}-01`,
    }));
  } else {
    console.warn('⚠ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set — generating sitemap with static routes only.');
  }

  const allRoutes: SitemapRoute[] = dedupeSitemapRoutes([
    ...staticRoutes,
    ...blogRoutes,
    ...glossaryRoutes,
    ...metricRoutes,
    ...briefRoutes,
    ...narrativeRoutes,
    ...digestRoutes,
  ]);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${sitemapLoc(route.url)}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
    ${route.lastmod ? `<lastmod>${new Date(route.lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  writeFileSync('public/sitemap.xml', xml);
  console.log(`Sitemap generated: ${allRoutes.length} URLs`);
}

generateSitemap().catch(console.error);

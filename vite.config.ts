/* eslint-disable no-undef */
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// ── RSS Generator Plugin ───────────────────────────────────────────────────
// Reads blog articles at build time and writes a fresh public/rss.xml.
// No extra deps: uses the same blogData.ts module already in the project.
function rssGeneratorPlugin(): Plugin {
    return {
        name: 'rss-generator',
        async buildStart() {
            try {
                // Dynamically import blogData using ts transpiling (vite handles .ts at build time)
                const { blogArticles } = await import('./src/features/blog/blogData');

                const buildDate = new Date().toUTCString();

                const escapeXml = (str: string) =>
                    str
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&apos;');

                const formatPubDate = (dateStr: string) => {
                    const d = new Date(dateStr);
                    return d.toUTCString();
                };

                // Blog article RSS items
                const blogItems = blogArticles
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(article => `
  <item>
    <title>${escapeXml(article.title)}</title>
    <link>https://graphiquestor.com/blog/${article.slug}</link>
    <description>${escapeXml(article.description)}</description>
    <pubDate>${formatPubDate(article.date)}</pubDate>
    <guid isPermaLink="true">https://graphiquestor.com/blog/${article.slug}</guid>
    <category>${escapeXml(article.category)}</category>
    <author>research@graphiquestor.com (${escapeXml(article.author)})</author>
  </item>`).join('');

                // Static hub items (Intel pages are updated daily)
                const hubItems = `
  <item>
    <title>India Macro Intelligence Hub — Live Dashboard</title>
    <link>https://graphiquestor.com/intel/india</link>
    <description>Institutional-grade macro telemetry for India: credit cycle, fiscal stress, sovereign debt maturity wall, RBI liquidity dynamics, and de-dollarisation strategy.</description>
    <pubDate>${buildDate}</pubDate>
    <guid isPermaLink="true">https://graphiquestor.com/intel/india</guid>
    <category>India Macro</category>
  </item>
  <item>
    <title>China Macro Intelligence Hub — Live Dashboard</title>
    <link>https://graphiquestor.com/intel/china</link>
    <description>High-frequency activity monitor tracking China's credit impulse, deflation risk, industrial velocity, PBoC monetary stance, FX reserves, and de-dollarization momentum.</description>
    <pubDate>${buildDate}</pubDate>
    <guid isPermaLink="true">https://graphiquestor.com/intel/china</guid>
    <category>China Macro</category>
  </item>
  <item>
    <title>Macro Concepts Glossary — Institutional Definitions</title>
    <link>https://graphiquestor.com/glossary</link>
    <description>Institutional definitions for macro liquidity, sovereign debt risk, and geo-economic terminology — TGA, RRP, Net Liquidity Z-Score, Term Premium, Stealth QE, and more.</description>
    <pubDate>${buildDate}</pubDate>
    <guid isPermaLink="true">https://graphiquestor.com/glossary</guid>
    <category>Glossary</category>
  </item>`;

                const rssContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>GraphiQuestor – Macro Intelligence Feed</title>
  <link>https://graphiquestor.com</link>
  <description>Latest macro signals, liquidity regimes, sovereign stress markers, and geo-economic intelligence from GraphiQuestor observatory.</description>
  <language>en-us</language>
  <lastBuildDate>${buildDate}</lastBuildDate>
  <atom:link href="https://graphiquestor.com/rss.xml" rel="self" type="application/rss+xml" />
  <image>
    <url>https://graphiquestor.com/og-image.png</url>
    <title>GraphiQuestor</title>
    <link>https://graphiquestor.com</link>
  </image>
${blogItems}
${hubItems}
</channel>
</rss>`;

                const outputPath = path.resolve(__dirname, 'public/rss.xml');
                fs.writeFileSync(outputPath, rssContent, 'utf-8');
                console.log(`✅ RSS feed generated: ${blogArticles.length} articles + 3 hub pages → public/rss.xml`);
            } catch (err) {
                console.warn('⚠️  RSS generation failed (non-fatal):', err);
            }
        },
    };
}

// ── LLM context files ─────────────────────────────────────────────────────
function llmsGeneratorPlugin(): Plugin {
    return {
        name: 'llms-generator',
        async buildStart() {
            try {
                const { execSync } = await import('child_process');
                execSync('npx tsx scripts/generate-llms-txt.ts', {
                    cwd: __dirname,
                    stdio: 'inherit',
                });
            } catch (err) {
                console.warn('⚠️  llms.txt generation failed (non-fatal):', err);
            }
        },
    };
}

// ── Sitemap Brief Plugin ──────────────────────────────────────────────────
// Injects the last 30 days of brief URLs into the sitemap at build time.
function sitemapBriefPlugin(): Plugin {
    return {
        name: 'sitemap-brief-injector',
        closeBundle() {
            try {
                const sitemapPath = path.resolve(__dirname, 'public/sitemap.xml');
                if (!fs.existsSync(sitemapPath)) return;

                let sitemap = fs.readFileSync(sitemapPath, 'utf-8');

                // Generate last 30 days of brief URLs
                const today = new Date();
                const briefUrls: string[] = [];
                for (let i = 0; i < 30; i++) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    const y = d.getUTCFullYear();
                    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(d.getUTCDate()).padStart(2, '0');
                    const dateStr = `${y}-${m}-${day}`;
                    briefUrls.push(`  <url>
    <loc>https://graphiquestor.com/macro-brief/${y}/${m}/${day}/</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.7</priority>
  </url>`);
                }

                // Remove any previously injected brief URLs (idempotent builds)
                sitemap = sitemap.replace(
                    /\s*<!-- AUTO:BRIEF_URLS -->[\s\S]*?<!-- \/AUTO:BRIEF_URLS -->/,
                    ''
                );

                // Inject before closing tag
                const injection = `\n  <!-- AUTO:BRIEF_URLS -->\n${briefUrls.join('\n')}\n  <!-- /AUTO:BRIEF_URLS -->`;
                sitemap = sitemap.replace('</urlset>', `${injection}\n</urlset>`);

                fs.writeFileSync(sitemapPath, sitemap, 'utf-8');
                console.log(`✅ Sitemap brief URLs injected: last 30 days → public/sitemap.xml`);
            } catch (err) {
                console.warn('⚠️  Sitemap brief injection failed (non-fatal):', err);
            }
        },
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), rssGeneratorPlugin(), llmsGeneratorPlugin(), sitemapBriefPlugin()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id: string) => {
                    // React core + router — always eager, smallest possible vendor
                    if (
                        id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/react-router')
                    ) return 'vendor';

                    // MUI + Emotion — needed for layout shell, keep in critical path
                    if (id.includes('@mui/material') || id.includes('@emotion/')) return 'ui';

                    // Recharts — lazy (only chart pages need it)
                    if (id.includes('recharts') || id.includes('node_modules/d3-')) return 'charts';

                    // Nivo — only used on OilFlowsSankey, keep separate from recharts
                    if (id.includes('@nivo/')) return 'nivo';

                    // Maps — only needed on pages with Leaflet/world maps
                    if (
                        id.includes('node_modules/leaflet') ||
                        id.includes('node_modules/react-leaflet') ||
                        id.includes('node_modules/react-simple-maps') ||
                        id.includes('node_modules/topojson')
                    ) return 'maps';

                    // Supabase — lazy until first data fetch
                    if (id.includes('@supabase/')) return 'supabase';

                    // framer-motion — lazy (animated pages pull it in)
                    if (id.includes('framer-motion')) return 'motion';
                },
            },
        },
        cssCodeSplit: true,
        chunkSizeWarningLimit: 1000,
    },
});


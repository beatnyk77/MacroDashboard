import fs from 'fs';
import path from 'path';

/**
 * RSS Feed Generator for GraphiQuestor
 * This script ensures the RSS feed is W3C compliant.
 */

interface RSSItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
}

const FEED_METADATA = {
    title: 'GraphiQuestor – Macro Intelligence Feed',
    link: 'https://graphiquestor.com',
    description: 'Latest macro signals, liquidity regimes, and sovereign stress markers from GraphiQuestor observatory.',
    language: 'en-us',
    feedUrl: 'https://graphiquestor.com/rss.xml'
};

const INITIAL_ITEMS: RSSItem[] = [
    {
        title: 'Macro Heartbeat: Global Liquidity Regime Stable',
        link: 'https://graphiquestor.com/#liquidity-hero',
        description: 'Net Liquidity remains stable as TGA drain offsets RRP expansion. Gold/Debt ratio holding critical support levels.',
        pubDate: 'Wed, 11 Feb 2026 12:00:00 GMT'
    },
    {
        title: 'India Macro Pulse: MoSPI Data Review',
        link: 'https://graphiquestor.com/#india-pulse',
        description: 'Latest India Macro Pulse signals robust domestic credit growth. BOP pressure remains low despite global rate volatility.',
        pubDate: 'Wed, 11 Feb 2026 10:00:00 GMT'
    }
];

function generateRSS(items: RSSItem[]): string {
    const itemXml = items.map(item => `
  <item>
    <title>${item.title}</title>
    <link>${item.link}</link>
    <description>${item.description}</description>
    <pubDate>${item.pubDate}</pubDate>
    <guid isPermaLink="true">${item.link}</guid>
  </item>`).join('');

    return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${FEED_METADATA.title}</title>
  <link>${FEED_METADATA.link}</link>
  <description>${FEED_METADATA.description}</description>
  <language>${FEED_METADATA.language}</language>
  <atom:link href="${FEED_METADATA.feedUrl}" rel="self" type="application/rss+xml" />
${itemXml}
</channel>
</rss>`;
}

const rssContent = generateRSS(INITIAL_ITEMS);
const outputPath = path.resolve(process.cwd(), 'public/rss.xml');

fs.writeFileSync(outputPath, rssContent);
console.log(`RSS Feed generated at: ${outputPath}`);

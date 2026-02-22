import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.3.2'
import { logIngestionStart, logIngestionEnd } from '../_shared/logging.ts'
import { withTimeout } from '../_shared/timeout-guard.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEEDS = [
    // Global Feeds
    { url: 'https://www.ft.com/markets?format=rss', source: 'Financial Times', region: 'global' },
    { url: 'https://www.bloomberg.com/feeds/markets/news.rss', source: 'Bloomberg', region: 'global' },
    { url: 'https://www.reuters.com/arc/outboundfeeds/news-rss/?outputType=xml', source: 'Reuters', region: 'global' },
    // India-Focused Feeds
    { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', source: 'Economic Times', region: 'india' },
    { url: 'https://www.livemint.com/rss/markets', source: 'Mint', region: 'india' },
    { url: 'https://news.google.com/rss/search?q=RBI+monetary+policy&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News (RBI)', region: 'india' },
    { url: 'https://news.google.com/rss/search?q=india+macro+economy+fiscal&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News (India Macro)', region: 'india' },
]

const KEYWORDS = [
    // Global macro
    'liquidity', 'gold', 'treasury', 'BRICS', 'China', 'Fed', 'ECB',
    'dollar', 'reserves', 'sovereign', 'de-dollarization',
    // India-specific
    'India', 'RBI', 'SEBI', 'rupee', 'INR', 'MoSPI', 'fiscal deficit',
    'GST', 'NIFTY', 'Sensex', 'inflation India', 'credit growth',
    'FII', 'DII', 'G-Sec', 'repo rate', 'SBI', 'HDFC',
]

const INDIA_KEYWORDS = [
    'India', 'RBI', 'SEBI', 'rupee', 'INR', 'MoSPI', 'NIFTY', 'Sensex',
    'fiscal deficit', 'GST', 'FII', 'DII', 'G-Sec', 'repo rate',
]

function isValidUrl(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return !lower.includes('example.com') &&
        !lower.includes('localhost') &&
        (lower.startsWith('http://') || lower.startsWith('https://'));
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Start logging
    const logId = await logIngestionStart(supabase, 'ingest-macro-news-headlines');

    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        })

        console.log('Starting Macro News ingestion...')
        const articles: any[] = []

        for (const feed of FEEDS) {
            try {
                await withTimeout(async () => {
                    let attempt = 0;
                    const maxRetries = 2;
                    let success = false;

                    while (attempt < maxRetries && !success) {
                        try {
                            console.log(`Fetching ${feed.source} feed (attempt ${attempt + 1})...`)
                            const response = await fetch(feed.url)
                            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)

                            const xml = await response.text()
                            const jsonObj = parser.parse(xml)

                            // Handle different RSS structures
                            const items = jsonObj.rss?.channel?.item || jsonObj.feed?.entry || []
                            const itemList = Array.isArray(items) ? items : [items]

                            const feedArticles = itemList.map((item: any) => {
                                // Extract link - handle various RSS/Atom formats
                                let link = item.link;
                                if (typeof link === 'object' && link['@_href']) {
                                    link = link['@_href'];
                                } else if (Array.isArray(link)) {
                                    const preferred = link.find((l: any) => l['@_rel'] === 'alternate' || !l['@_rel']);
                                    link = preferred ? (preferred['@_href'] || preferred) : link[0];
                                }

                                // Fallback to guid/id if link is missing or object
                                if ((!link || typeof link !== 'string') && item.guid) {
                                    link = typeof item.guid === 'object' ? item.guid['#text'] || item.guid['@_isPermaLink'] : item.guid;
                                }

                                return {
                                    title: item.title?.['#text'] || item.title || 'Untitled Article',
                                    link: link,
                                    source: feed.source,
                                    region: feed.region,
                                    published_at: item.pubDate || item.updated || item.published || new Date().toISOString()
                                };
                            }).filter(a => isValidUrl(a.link));

                            articles.push(...feedArticles)
                            success = true
                        } catch (e) {
                            attempt++
                            console.error(`Error fetching ${feed.source}:`, e.message)
                            if (attempt < maxRetries) {
                                await new Promise(r => setTimeout(r, 1000 * attempt))
                            }
                        }
                    }
                }, 45000, `News Ingestion for ${feed.source}`);
            } catch (err: any) {
                console.error(`Feed ${feed.source} timed out or failed:`, err.message);
            }
        }

        console.log(`Total articles fetched: ${articles.length}`)

        // Filter by keywords
        const filteredArticles = articles.filter(article => {
            const textToSearch = `${article.title}`.toLowerCase()
            const matchingKeywords = KEYWORDS.filter(keyword =>
                textToSearch.includes(keyword.toLowerCase())
            )

            if (matchingKeywords.length > 0) {
                article.keywords = matchingKeywords
                return true
            }
            return false
        })

        console.log(`Articles matching macro keywords: ${filteredArticles.length}`)

        if (filteredArticles.length > 0) {
            // Upsert articles - use link as unique key to prevent duplicates
            const { error: upsertError } = await supabase
                .from('macro_news_headlines')
                .upsert(
                    filteredArticles.map(a => {
                        // Classify as India or Global based on source region + keyword match
                        const textLower = a.title.toLowerCase();
                        const isIndiaSource = a.region === 'india';
                        const hasIndiaKeyword = INDIA_KEYWORDS.some(k => textLower.includes(k.toLowerCase()));
                        const category = (isIndiaSource || hasIndiaKeyword) ? 'India' : 'Global';

                        return {
                            title: a.title,
                            link: a.link,
                            source: a.source,
                            published_at: new Date(a.published_at).toISOString(),
                            keywords: a.keywords,
                            category: category,
                        };
                    }),
                    { onConflict: 'link', ignoreDuplicates: true }
                )

            if (upsertError) throw upsertError
        }

        // Retention policy: Delete older than 30 days (tighter retention for noise)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { error: deleteError } = await supabase
            .from('macro_news_headlines')
            .delete()
            .lt('published_at', thirtyDaysAgo.toISOString())

        if (deleteError) console.error('Error deleting old articles:', deleteError)
        else console.log(`Cleaned up old articles.`)

        const summary = {
            message: 'Ingestion complete',
            total_fetched: articles.length,
            total_filtered: filteredArticles.length
        };

        // Log success
        await logIngestionEnd(supabase, logId, 'success', {
            rows_inserted: filteredArticles.length,
            metadata: { summary }
        });

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Master Error:', error.message)

        // Ensure log end is recorded
        try {
            if (logId) {
                await logIngestionEnd(supabase, logId, 'failed', { error_message: error.message });
            }
        } catch (logErr) {
            console.error('Failed to log News Ingestion end:', logErr);
        }

        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})

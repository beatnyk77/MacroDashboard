import { createClient } from '@supabase/supabase-js'
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.3.2'
import { logIngestionStart, logIngestionEnd } from '../_shared/logging.ts'
import { withTimeout } from '../_shared/timeout-guard.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEEDS = [
    // Google News RSS — publicly accessible, no paywall
    { url: 'https://news.google.com/rss/search?q=global+liquidity+fed+reserve&hl=en-US&gl=US&ceid=US:en', source: 'Google News (Liquidity)', region: 'global' },
    { url: 'https://news.google.com/rss/search?q=ECB+monetary+policy+interest+rates&hl=en-US&gl=US&ceid=US:en', source: 'Google News (ECB)', region: 'global' },
    { url: 'https://news.google.com/rss/search?q=BRICS+gold+reserves+de-dollarization&hl=en-US&gl=US&ceid=US:en', source: 'Google News (BRICS)', region: 'global' },
    { url: 'https://news.google.com/rss/search?q=US+treasury+yield+fiscal+deficit&hl=en-US&gl=US&ceid=US:en', source: 'Google News (US Treasury)', region: 'global' },
    { url: 'https://news.google.com/rss/search?q=Fed+interest+rate+inflation+outlook&hl=en-US&gl=US&ceid=US:en', source: 'Google News (Fed)', region: 'global' },
    { url: 'https://news.google.com/rss/search?q=China+economy+PBoC+yuan&hl=en-US&gl=US&ceid=US:en', source: 'Google News (China)', region: 'global' },
    { url: 'https://news.google.com/rss/search?q=oil+crude+OPEC+energy+commodities&hl=en-US&gl=US&ceid=US:en', source: 'Google News (Energy)', region: 'global' },
    // India-Focused Google News RSS
    { url: 'https://news.google.com/rss/search?q=RBI+monetary+policy+repo+rate&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News (RBI)', region: 'india' },
    { url: 'https://news.google.com/rss/search?q=India+macro+economy+fiscal+capex&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News (India Macro)', region: 'india' },
    { url: 'https://news.google.com/rss/search?q=NIFTY+Sensex+FII+DII+flows&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News (India Markets)', region: 'india' },
    // Economic Times RSS (publicly accessible)
    { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', source: 'Economic Times', region: 'india' },
]

const KEYWORDS = [
    // Global macro
    'liquidity', 'gold', 'treasury', 'BRICS', 'China', 'Fed', 'ECB', 'BoJ', 'PBoC',
    'dollar', 'reserves', 'sovereign', 'de-dollarization', 'yield', 'inflation',
    'growth', 'GDP', 'recession', 'debt', 'fiscal', 'deficit', 'rates', 'hike',
    'cut', 'oil', 'energy', 'commodities', 'tariff', 'trade', 'war', 'geopolitical',
    'sanctions', 'energy security', 'crude', 'natural gas', 'OPEC', 'crisis',
    'stagflation', 'hard landing', 'soft landing', 'carry trade', 'volatility',
    // India-specific
    'India', 'RBI', 'SEBI', 'rupee', 'INR', 'MoSPI', 'fiscal deficit',
    'GST', 'NIFTY', 'Sensex', 'inflation India', 'credit growth',
    'FII', 'DII', 'G-Sec', 'repo rate', 'SBI', 'HDFC', 'capex',
    'IIP', 'WPI', 'CPI', 'gift city', 'corporate india', 'earnings',
]

const INDIA_KEYWORDS = [
    'India', 'RBI', 'SEBI', 'rupee', 'INR', 'MoSPI', 'NIFTY', 'Sensex',
    'fiscal deficit', 'GST', 'FII', 'DII', 'G-Sec', 'repo rate', 'capex',
    'IIP', 'WPI', 'CPI', 'gift city',
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
                // BUG FIX: withTimeout takes a Promise, not a function.
                // Wrapped the logic in an IIFE to return a promise.
                await withTimeout((async () => {
                    let attempt = 0;
                    const maxRetries = 2;
                    let success = false;

                    while (attempt < maxRetries && !success) {
                        try {
                            console.log(`Fetching ${feed.source} feed (attempt ${attempt + 1})...`)
                            const response = await fetch(feed.url, {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
                                }
                            })
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
                        } catch (e: any) {
                            attempt++
                            console.error(`Error fetching ${feed.source}:`, e.message)
                            if (attempt < maxRetries) {
                                await new Promise(r => setTimeout(r, 1000 * attempt))
                            }
                        }
                    }
                })(), 45000, `News Ingestion for ${feed.source}`);
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

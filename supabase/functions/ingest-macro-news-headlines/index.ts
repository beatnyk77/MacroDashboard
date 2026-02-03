import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.3.2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEEDS = [
    { url: 'https://www.ft.com/markets?format=rss', source: 'Financial Times' },
    { url: 'https://www.bloomberg.com/feeds/markets/news.rss', source: 'Bloomberg' },
    { url: 'https://www.reuters.com/arc/outboundfeeds/news-rss/?outputType=xml', source: 'Reuters' }
]

const KEYWORDS = [
    'liquidity', 'gold', 'treasury', 'BRICS', 'China', 'Fed', 'ECB',
    'dollar', 'reserves', 'sovereign', 'de-dollarization'
]

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)
        const parser = new XMLParser()

        console.log('Starting Macro News ingestion...')
        const articles: any[] = []

        for (const feed of FEEDS) {
            let attempt = 0;
            const maxRetries = 3;
            let success = false;

            while (attempt < maxRetries && !success) {
                try {
                    console.log(`Fetching ${feed.source} feed (attempt ${attempt + 1})...`)
                    const response = await fetch(feed.url)
                    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)

                    const xml = await response.text()
                    const jsonObj = parser.parse(xml)
                    const items = jsonObj.rss?.channel?.item || []

                    const feedArticles = (Array.isArray(items) ? items : [items]).map((item: any) => ({
                        title: item.title,
                        link: item.link,
                        source: feed.source,
                        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
                    }))

                    articles.push(...feedArticles)
                    success = true
                } catch (e) {
                    attempt++
                    console.error(`Error fetching ${feed.source}:`, e.message)
                    if (attempt === maxRetries) {
                        console.error(`Failed to fetch ${feed.source} after ${maxRetries} attempts.`)
                    } else {
                        await new Promise(r => setTimeout(r, 1000 * attempt))
                    }
                }
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
            // Upsert articles
            const { error: upsertError } = await supabase
                .from('macro_news_headlines')
                .upsert(
                    filteredArticles.map(a => ({
                        title: a.title,
                        link: a.link,
                        source: a.source,
                        published_at: a.published_at,
                        keywords: a.keywords
                    })),
                    { onConflict: 'link', ignoreDuplicates: true }
                )

            if (upsertError) throw upsertError
        }

        // Retention policy: Delete older than 60 days
        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

        const { error: deleteError, count } = await supabase
            .from('macro_news_headlines')
            .delete()
            .lt('published_at', sixtyDaysAgo.toISOString())

        if (deleteError) console.error('Error deleting old articles:', deleteError)
        else console.log(`Cleaned up old articles.`)

        return new Response(JSON.stringify({
            message: 'Ingestion complete',
            total_fetched: articles.length,
            total_filtered: filteredArticles.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Master Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { logIngestionStart, logIngestionEnd } from '../_shared/logging.ts'
import { withTimeout } from '../_shared/timeout-guard.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response;
            console.warn(`Attempt ${i + 1} for ${url} failed with ${response.status}`);
        } catch (err) {
            console.warn(`Attempt ${i + 1} for ${url} errored: ${err}`);
        }
        await new Promise(r => setTimeout(r, 2000 * Math.pow(2, i)));
    }
    throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const logId = await logIngestionStart(supabase, 'ingest-us-treasury-auctions');

    try {
        console.log('Starting US Treasury Auctions ingestion...')
        const results: any[] = []

        await withTimeout((async () => {
            // Fetch last 52 weeks of auction data to ensure history for sparklines
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            const dateStr = oneYearAgo.toISOString().split('T')[0];

            // Primary endpoint: https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query
            // Filter by security_type to reduce payload size
            const apiUrl = `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query?filter=auction_date:gte:${dateStr},security_type:in:(Bill,Note,Bond)&sort=-auction_date&page[size]=1000`;

            console.log(`Fetching auctions since ${dateStr}...`);
            const response = await fetchWithRetry(apiUrl);
            const json = await response.json();

            if (!json.data || json.data.length === 0) {
                console.warn("No matching auction data found.");
                return;
            }
            console.log(`Found ${json.data.length} records to filter locally.`);

            // Key securities we want to track
            const TARGET_SECURITIES = [
                { type: 'Bill', term: '4-Week' },
                { type: 'Bill', term: '13-Week' },
                { type: 'Note', term: '2-Year' },
                { type: 'Note', term: '10-Year' },
                { type: 'Bond', term: '30-Year' }
            ];

            json.data.forEach((auction: any) => {
                const securityType = auction.security_type;
                const securityTerm = auction.security_term;

                // Match targets
                const isTarget = TARGET_SECURITIES.some(t =>
                    securityType.includes(t.type) && securityTerm === t.term
                );

                if (!isTarget) return;

                const bidToCover = parseFloat(auction.bid_to_cover_ratio);
                const highYield = parseFloat(auction.high_yield);

                // Bidder breakdown (Confirmed field names: total_accepted, primary_dealer_accepted, etc.)
                const totalAccepted = parseFloat(auction.total_accepted) || 0;
                const primaryDealerAccepted = parseFloat(auction.primary_dealer_accepted) || 0;
                const indirectBidderAccepted = parseFloat(auction.indirect_bidder_accepted) || 0;
                const directBidderAccepted = parseFloat(auction.direct_bidder_accepted) || 0;

                if (totalAccepted === 0) {
                    console.log(`Skipping ${securityType} ${securityTerm} on ${auction.auction_date} due to zero accepted amount.`);
                    return;
                }

                const primaryDealerPct = (primaryDealerAccepted / totalAccepted) * 100;
                const indirectBidderPct = (indirectBidderAccepted / totalAccepted) * 100;
                const directBidderPct = (directBidderAccepted / totalAccepted) * 100;

                // Demand Strength Score = bid_to_cover × (indirect_bidder_pct / 100)
                const demandStrengthScore = bidToCover * (indirectBidderPct / 100);

                console.log(`Matched: ${securityType} ${securityTerm} | Date: ${auction.auction_date} | BTC: ${bidToCover} | Indirect: ${indirectBidderPct.toFixed(2)}% | Score: ${demandStrengthScore.toFixed(2)}`);

                results.push({
                    auction_date: auction.auction_date,
                    security_type: securityType.includes('Bill') ? 'Bill' :
                        securityType.includes('Note') ? 'Note' :
                            securityType.includes('Bond') ? 'Bond' : securityType,
                    term: securityTerm,
                    bid_to_cover: bidToCover,
                    high_yield: isNaN(highYield) ? null : highYield,
                    total_tendered: parseFloat(auction.total_tendered),
                    total_accepted: totalAccepted,
                    primary_dealer_pct: primaryDealerPct,
                    indirect_bidder_pct: indirectBidderPct,
                    direct_bidder_pct: directBidderPct,
                    demand_strength_score: demandStrengthScore
                });
            });

            console.log(`Processed ${results.length} auction records.`);

        })(), 120000, 'US Treasury Auctions Ingestion');

        if (results.length > 0) {
            // Upsert records
            const { error: upsertError } = await supabase
                .from('us_treasury_auctions')
                .upsert(results, { onConflict: 'auction_date, security_type, term' });

            if (upsertError) throw upsertError;
        }

        const summary = {
            success: true,
            rows_inserted: results.length,
            latest_auction_date: results[0]?.auction_date
        };

        await logIngestionEnd(supabase, logId, 'success', summary);

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('US Treasury Auctions Ingestion error:', error.message)
        if (logId) {
            await logIngestionEnd(supabase, logId, 'failed', { error_message: error.message });
        }

        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})

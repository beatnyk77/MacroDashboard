import { SupabaseClient } from '@supabase/supabase-js';

interface AuctionRecord {
    auction_date: string;
    security_type: string;
    term: string;
    bid_to_cover: number;
    high_yield: number | null;
    total_tendered: number;
    total_accepted: number;
    primary_dealer_pct: number;
    indirect_bidder_pct: number;
    direct_bidder_pct: number;
    demand_strength_score: number;
}

export async function processAuctions(supabase: SupabaseClient) {
    try {
        console.log('Fetching US Treasury Auctions data...');
        
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const dateStr = oneYearAgo.toISOString().split('T')[0];

        const apiUrl = `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query?filter=auction_date:gte:${dateStr},security_type:in:(Bill,Note,Bond)&sort=-auction_date&page[size]=1000`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`FiscalData API failed: ${response.status}`);
        
        const json = await response.json();
        if (!json.data || json.data.length === 0) {
            return { success: true, count: 0, message: 'No new auction data found' };
        }

        const TARGET_SECURITIES = [
            { type: 'Bill', term: '4-Week' },
            { type: 'Bill', term: '13-Week' },
            { type: 'Note', term: '2-Year' },
            { type: 'Note', term: '10-Year' },
            { type: 'Bond', term: '30-Year' }
        ];

        const results: AuctionRecord[] = [];

        json.data.forEach((auction: any) => {
            const securityType = auction.security_type;
            const securityTerm = auction.security_term;

            const isTarget = TARGET_SECURITIES.some(t =>
                securityType.includes(t.type) && securityTerm === t.term
            );

            if (!isTarget) return;

            const bidToCover = parseFloat(auction.bid_to_cover_ratio);
            const highYield = parseFloat(auction.high_yield);
            const totalAccepted = parseFloat(auction.total_accepted) || 0;

            if (totalAccepted === 0) return;

            const primaryDealerAccepted = parseFloat(auction.primary_dealer_accepted) || 0;
            const indirectBidderAccepted = parseFloat(auction.indirect_bidder_accepted) || 0;
            const directBidderAccepted = parseFloat(auction.direct_bidder_accepted) || 0;

            const indirectBidderPct = (indirectBidderAccepted / totalAccepted) * 100;

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
                primary_dealer_pct: (primaryDealerAccepted / totalAccepted) * 100,
                indirect_bidder_pct: indirectBidderPct,
                direct_bidder_pct: (directBidderAccepted / totalAccepted) * 100,
                demand_strength_score: bidToCover * (indirectBidderPct / 100)
            });
        });

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('us_treasury_auctions')
                .upsert(results, { onConflict: 'auction_date, security_type, term' });

            if (upsertError) throw upsertError;
            return { success: true, count: results.length };
        }

        return { success: true, count: 0 };
    } catch (error: any) {
        console.error('Auctions processing error:', error);
        return { success: false, error: error.message };
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { SupabaseClient } from '@supabase/supabase-js';
import { withTimeout } from '../_shared/timeout-guard.ts';
import { normalizeAuctionTerm, TARGET_CANONICAL_TERMS } from './auctionTerms.ts';

export { normalizeAuctionTerm, TARGET_CANONICAL_TERMS } from './auctionTerms.ts';

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

export function toTenYearAuctionMetricObservations(results: AuctionRecord[], fetchedAt: string) {
    return results
        .filter((auction) => auction.term === '10-Year')
        .flatMap((auction) => [
            ['US_TREASURY_10Y_BID_TO_COVER', auction.bid_to_cover],
            ['US_TREASURY_10Y_INDIRECT_PCT', auction.indirect_bidder_pct],
            ['US_TREASURY_10Y_PRIMARY_DEALER_PCT', auction.primary_dealer_pct],
            ['US_TREASURY_10Y_DEMAND_SCORE', auction.demand_strength_score],
        ].map(([metric_id, value]) => ({ metric_id, as_of_date: auction.auction_date, value, last_updated_at: fetchedAt })));
}

interface RawAuction {
    auctionDate: string;
    securityType: string;
    securityTerm: string | null;
    originalTerm: string | null;
    bidToCover: unknown;
    highYield: unknown;
    totalTendered: unknown;
    totalAccepted: unknown;
    primaryDealerAccepted: unknown;
    indirectBidderAccepted: unknown;
    directBidderAccepted: unknown;
}

/** Shared normalisation for FiscalData and TreasuryDirect rows; null when the auction has no results yet. */
export function toAuctionRecord(raw: RawAuction): AuctionRecord | null {
    const termToUse = normalizeAuctionTerm(raw.securityTerm, raw.originalTerm || raw.securityTerm, raw.securityType);
    if (!termToUse || !TARGET_CANONICAL_TERMS.has(termToUse)) return null;

    const bidToCover = parseFloat(String(raw.bidToCover));
    const highYield = parseFloat(String(raw.highYield));
    const totalAccepted = parseFloat(String(raw.totalAccepted)) || 0;
    if (totalAccepted === 0 || isNaN(bidToCover) || bidToCover <= 0) return null;

    const primaryDealerAccepted = parseFloat(String(raw.primaryDealerAccepted)) || 0;
    const indirectBidderAccepted = parseFloat(String(raw.indirectBidderAccepted)) || 0;
    const directBidderAccepted = parseFloat(String(raw.directBidderAccepted)) || 0;
    const indirectBidderPct = (indirectBidderAccepted / totalAccepted) * 100;
    const securityType = raw.securityType;
    const typeLabel = securityType.includes('Bill')
        ? 'Bill'
        : securityType.includes('Note')
            ? 'Note'
            : securityType.includes('Bond')
                ? 'Bond'
                : securityType;

    return {
        auction_date: raw.auctionDate,
        security_type: typeLabel,
        term: termToUse,
        bid_to_cover: bidToCover,
        high_yield: isNaN(highYield) ? null : highYield,
        total_tendered: parseFloat(String(raw.totalTendered)) || 0,
        total_accepted: totalAccepted,
        primary_dealer_pct: (primaryDealerAccepted / totalAccepted) * 100,
        indirect_bidder_pct: indirectBidderPct,
        direct_bidder_pct: (directBidderAccepted / totalAccepted) * 100,
        demand_strength_score: bidToCover * (indirectBidderPct / 100),
    };
}

/**
 * TreasuryDirect publishes results on auction day; FiscalData's auctions_query lists the same
 * auctions with null results for several days. Field mapping verified against FiscalData
 * (e.g. 2026-10-15 8-Week: grandTotalParAwarded == total_accepted).
 */
export function fromTreasuryDirect(r: any): RawAuction {
    return {
        auctionDate: String(r.competitiveAuctionCloseDate ?? r.auctionDate ?? '').slice(0, 10),
        securityType: String(r.securityType ?? ''),
        securityTerm: r.securityTerm ?? null,
        originalTerm: r.originalSecurityTerm ?? null,
        bidToCover: r.bidToCoverRatio,
        highYield: r.highYield,
        totalTendered: r.grandTotalParRecognized,
        totalAccepted: r.grandTotalParAwarded,
        primaryDealerAccepted: r.primaryDealersCompetitiveParAwarded,
        indirectBidderAccepted: r.indirectBiddersCompetitiveParAwarded,
        directBidderAccepted: r.directBiddersCompetitiveParAwarded,
    };
}

function fromFiscalData(r: any): RawAuction {
    return {
        auctionDate: r.auction_date,
        securityType: String(r.security_type ?? ''),
        securityTerm: r.security_term ?? null,
        originalTerm: r.original_security_term ?? null,
        bidToCover: r.bid_to_cover_ratio,
        highYield: r.high_yield,
        totalTendered: r.total_tendered,
        totalAccepted: r.total_accepted,
        primaryDealerAccepted: r.primary_dealer_accepted,
        indirectBidderAccepted: r.indirect_bidder_accepted,
        directBidderAccepted: r.direct_bidder_accepted,
    };
}

const TREASURY_DIRECT_URL = 'https://www.treasurydirect.gov/TA_WS/securities/auctioned?format=json&days=30';

export async function processAuctions(supabase: SupabaseClient) {
    try {
        console.log('Fetching US Treasury Auctions data...');

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const dateStr = oneYearAgo.toISOString().split('T')[0];

        const apiUrl =
            `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query` +
            `?filter=auction_date:gte:${dateStr},security_type:in:(Bill,Note,Bond)` +
            `&sort=-auction_date&page[size]=1000`;

        const response = await withTimeout(fetch(apiUrl), 20000, 'Auctions Fetch') as Response;
        if (!response.ok) throw new Error(`FiscalData API failed: ${response.status}`);

        const json = await response.json();
        const fiscalRows = (json.data ?? []) as any[];

        // Recent results from TreasuryDirect fill FiscalData's publication lag. Best-effort:
        // if it is unreachable, FiscalData alone is used as before.
        let directRows: any[] = [];
        try {
            const tdResponse = await withTimeout(fetch(TREASURY_DIRECT_URL), 20000, 'TreasuryDirect Fetch') as Response;
            if (tdResponse.ok) directRows = await tdResponse.json();
            else console.warn(`TreasuryDirect API returned ${tdResponse.status}; using FiscalData only`);
        } catch (tdError: any) {
            console.warn(`TreasuryDirect unavailable (${tdError.message}); using FiscalData only`);
        }

        if (fiscalRows.length === 0 && directRows.length === 0) {
            return { success: true, count: 0, message: 'No new auction data found' };
        }

        const results: AuctionRecord[] = [];
        const sourceByKey = new Map<string, string>();
        // FiscalData first so it stays canonical wherever both sources have results.
        const candidates = [
            ...fiscalRows.map((r) => ({ raw: fromFiscalData(r), source: 'live_api:fiscaldata' })),
            ...directRows.map((r) => ({ raw: fromTreasuryDirect(r), source: 'live_api:treasurydirect' })),
        ];
        for (const { raw, source } of candidates) {
            const record = toAuctionRecord(raw);
            if (!record) continue;
            const dedupeKey = `${record.auction_date}|${record.security_type}|${record.term}`;
            if (sourceByKey.has(dedupeKey)) continue;
            sourceByKey.set(dedupeKey, source);
            results.push(record);
        }

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('us_treasury_auctions')
                .upsert(results, { onConflict: 'auction_date, security_type, term' });

            if (upsertError) throw upsertError;
            const tenYear = results.filter((auction) => auction.term === '10-Year');
            const metricRows = tenYear.flatMap((auction) =>
                toTenYearAuctionMetricObservations([auction], new Date().toISOString()).map((row) => ({
                    ...row,
                    provenance: 'api_live',
                    source_ref: sourceByKey.get(`${auction.auction_date}|${auction.security_type}|${auction.term}`) ?? 'live_api:fiscaldata',
                    is_provisional: false,
                })),
            );
            if (metricRows.length > 0) {
                const { error: metricError } = await supabase
                    .from('metric_observations')
                    .upsert(metricRows, { onConflict: 'metric_id, as_of_date' });
                if (metricError) throw metricError;
            }
            return { success: true, count: results.length };
        }

        return { success: true, count: 0 };
    } catch (error: any) {
        console.error('Auctions processing error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Deno tests for auction term normalization.
 * Run: deno test supabase/functions/ingest-us-macro/auctions_normalize.test.ts
 */
import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { normalizeAuctionTerm } from './auctionTerms.ts';

Deno.test('maps 13-Week → 3-Month', () => {
  assertEquals(normalizeAuctionTerm('13-Week', '13-Week', 'Bill'), '3-Month');
  assertEquals(normalizeAuctionTerm('13 Week', null, 'Bill'), '3-Month');
  assertEquals(normalizeAuctionTerm('3-Month', null, 'Bill'), '3-Month');
});

Deno.test('maps 26-Week → 6-Month', () => {
  assertEquals(normalizeAuctionTerm('26-Week', null, 'Bill'), '6-Month');
  assertEquals(normalizeAuctionTerm('6-Month', '26-Week', 'Bill'), '6-Month');
});

Deno.test('maps note tenors including 5-Year', () => {
  assertEquals(normalizeAuctionTerm('5-Year', null, 'Note'), '5-Year');
  assertEquals(normalizeAuctionTerm('2-Year', '2-Year', 'Note'), '2-Year');
  assertEquals(normalizeAuctionTerm('10-Year', null, 'Note'), '10-Year');
  assertEquals(normalizeAuctionTerm('30-Year', null, 'Bond'), '30-Year');
});

Deno.test('returns null for non-target / junk', () => {
  assertEquals(normalizeAuctionTerm('CMB', null, 'Bill'), null);
  assertEquals(normalizeAuctionTerm(null, null, 'Bill'), null);
});

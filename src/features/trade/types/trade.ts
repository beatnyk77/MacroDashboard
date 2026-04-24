// ── Core trade data types for the Trade Intelligence module ──────────────────

export interface HSCodeMaster {
    code: string
    description: string
    chapter: string | null
    heading: string | null
    level: 2 | 4 | 6
}

export interface TradeDemandRow {
    hs_code: string
    reporter_iso3: string
    reporter_iso2: string | null
    reporter_name: string | null
    year: number
    import_value_usd: number | null
    qty_value: number | null
    qty_unit: string | null
    fetched_at: string
}

export interface SupplierBreakdown {
    hs_code: string
    reporter_iso3: string
    partner_iso3: string
    partner_name: string | null
    year: number
    import_value_usd: number | null
    market_share_pct: number | null
}

export interface OpportunityScore {
    hs_code: string
    reporter_iso3: string
    reporter_iso2: string | null
    reporter_name: string | null

    // Score components (0–100)
    market_size_score: number
    growth_score: number
    competition_score: number
    macro_score: number
    volatility_score: number
    overall_score: number

    // Competition detail
    hhi: number | null                  // 0–1 Herfindahl-Hirschman Index
    top_supplier_iso3: string | null
    top_supplier_share: number | null   // %

    // Raw metrics
    latest_import_usd: number | null
    cagr_5yr_pct: number | null         // %
    data_year: number | null
    computed_at: string
}

/** Enriched market row used in GlobalDemandRanker */
export interface TradeMarket extends OpportunityScore {
    flag?: string           // emoji flag derived from iso2
    opportunityTags: string[]
    insightText: string
}

/** Trend data point for ImportTrendChart */
export interface TrendPoint {
    year: number
    import_value_usd: number
}

/** State for the demand hook */
export type DemandState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'fetching_live' }   // cache miss, invoking edge function
    | { status: 'success'; markets: TradeMarket[]; hsCode: string; cachedAt: string }
    | { status: 'error'; message: string }

/** Country flag emoji from ISO-2 code */
export function isoToFlag(iso2: string | null): string {
    if (!iso2 || iso2.length !== 2) return '🌐'
    const codePoints = [...iso2.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
    return String.fromCodePoint(...codePoints)
}

/** Format USD value with B/M suffix */
export function formatTradeValue(usd: number | null): string {
    if (!usd) return '—'
    if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`
    if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(0)}M`
    return `$${usd.toLocaleString()}`
}

/** Score → color class (Tailwind) */
export function scoreToColor(score: number): string {
    if (score >= 70) return 'text-emerald-400'
    if (score >= 45) return 'text-amber-400'
    return 'text-rose-400'
}

/** Score → background class */
export function scoreToBg(score: number): string {
    if (score >= 70) return 'bg-emerald-500/10 border-emerald-500/20'
    if (score >= 45) return 'bg-amber-500/10 border-amber-500/20'
    return 'bg-rose-500/10 border-rose-500/20'
}

/** Generate opportunity tags for a market */
export function buildOpportunityTags(market: OpportunityScore): string[] {
    const tags: string[] = []
    if (market.latest_import_usd && market.latest_import_usd >= 1_000_000_000)
        tags.push('💰 Large Market')
    if (market.cagr_5yr_pct && market.cagr_5yr_pct >= 8)
        tags.push('🔥 Fast Growth')
    if (market.hhi !== null && market.hhi < 0.25)
        tags.push('🎯 Low Competition')
    if (market.macro_score >= 70)
        tags.push('📈 Strong Macro')
    if (market.top_supplier_iso3 === 'CHN' && market.top_supplier_share && market.top_supplier_share > 30)
        tags.push('🔄 China Dominant')
    if (market.competition_score >= 75)
        tags.push('🚪 Open Market')
    return tags.slice(0, 4)
}

/** Generate one-line insight for a market */
export function buildInsightText(market: OpportunityScore): string {
    const val = formatTradeValue(market.latest_import_usd)
    const growth = market.cagr_5yr_pct !== null
        ? `growing at ${market.cagr_5yr_pct > 0 ? '+' : ''}${market.cagr_5yr_pct.toFixed(1)}%/yr`
        : 'trend data limited'
    const comp = market.hhi !== null
        ? market.hhi < 0.2 ? 'fragmented supply base' : market.hhi < 0.4 ? 'moderate competition' : 'concentrated market'
        : 'competition unknown'
    return `${val} import market, ${growth}. ${comp[0].toUpperCase() + comp.slice(1)}.`
}

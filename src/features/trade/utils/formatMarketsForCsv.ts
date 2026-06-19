import type { TradeMarket } from '../types/trade'

export interface MarketCsvRow {
    Rank: number
    Country: string
    ISO3: string
    'Opportunity Score': number
    'Import Value USD': number | null
    '5yr CAGR %': number | null
    HHI: number | null
    'Macro Score': number
    Tags: string
    'Data Year': number | null
    'HS Code': string
}

/** Flatten ranked markets for CSV export (Excel / Sheets workflows). */
export function formatMarketsForCsv(markets: TradeMarket[]): MarketCsvRow[] {
    return markets.map((m, i) => ({
        Rank: i + 1,
        Country: m.reporter_name ?? m.reporter_iso3,
        ISO3: m.reporter_iso3,
        'Opportunity Score': m.overall_score,
        'Import Value USD': m.latest_export_usd,
        '5yr CAGR %': m.cagr_5yr_pct,
        HHI: m.hhi,
        'Macro Score': m.macro_score,
        Tags: m.opportunityTags.join('; '),
        'Data Year': m.data_year,
        'HS Code': m.hs_code,
    }))
}
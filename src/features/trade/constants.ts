export const TRADE_DATA_YEAR = 2023

export const COMTRADE_PROVENANCE = {
    source: 'UN Comtrade',
    methodology: `Annual bilateral flows · HS-6 · ${TRADE_DATA_YEAR}`,
} as const

export const FALLBACK_REPORTERS = [
    { iso3: 'USA', name: 'United States', iso2: 'US' },
    { iso3: 'CHN', name: 'China', iso2: 'CN' },
    { iso3: 'DEU', name: 'Germany', iso2: 'DE' },
    { iso3: 'JPN', name: 'Japan', iso2: 'JP' },
    { iso3: 'IND', name: 'India', iso2: 'IN' },
    { iso3: 'GBR', name: 'United Kingdom', iso2: 'GB' },
    { iso3: 'FRA', name: 'France', iso2: 'FR' },
    { iso3: 'KOR', name: 'South Korea', iso2: 'KR' },
] as const

export const CURATED_HS_CODES = ['8542', '6203', '3004'] as const

export type TradeView = 'exports' | 'imports' | 'bilateral'

export const TRADE_VIEWS: TradeView[] = ['exports', 'imports', 'bilateral']
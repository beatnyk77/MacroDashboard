import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface CountryOption {
    iso3: string
    name: string
    iso2: string
    total_import_value: number
}

/**
 * Fetches countries ranked by total import value from vw_country_trade_imports.
 * Returns top N countries + fallback major reporters.
 */
export function useAvailableImportCountries(limit: number = 20) {
    return useQuery<CountryOption[]>({
        queryKey: ['available-import-countries', limit],
        queryFn: async () => {
            // Mapping of ISO3 to ISO2 and full names — from UN data
            const iso3ToDetails: Record<string, { iso2: string; name: string }> = {
                USA: { iso2: 'US', name: 'United States' },
                CHN: { iso2: 'CN', name: 'China' },
                DEU: { iso2: 'DE', name: 'Germany' },
                JPN: { iso2: 'JP', name: 'Japan' },
                IND: { iso2: 'IN', name: 'India' },
                GBR: { iso2: 'GB', name: 'United Kingdom' },
                FRA: { iso2: 'FR', name: 'France' },
                KOR: { iso2: 'KR', name: 'South Korea' },
                CAN: { iso2: 'CA', name: 'Canada' },
                MEX: { iso2: 'MX', name: 'Mexico' },
                NLD: { iso2: 'NL', name: 'Netherlands' },
                ITA: { iso2: 'IT', name: 'Italy' },
                ESP: { iso2: 'ES', name: 'Spain' },
                AUS: { iso2: 'AU', name: 'Australia' },
                BRA: { iso2: 'BR', name: 'Brazil' },
                RUS: { iso2: 'RU', name: 'Russia' },
                ZAF: { iso2: 'ZA', name: 'South Africa' },
                SGP: { iso2: 'SG', name: 'Singapore' },
                HKG: { iso2: 'HK', name: 'Hong Kong' },
                ARE: { iso2: 'AE', name: 'United Arab Emirates' },
            }

            try {
                // Query the view to get unique countries and their total import values
                const { data, error } = await supabase
                    .from('vw_country_trade_imports')
                    .select('reporter_iso3, import_value_usd')

                if (error) throw error
                if (!data || data.length === 0) return []

                // Aggregate by country
                const countryTotals: Record<string, number> = {}
                data.forEach(row => {
                    const iso3 = row.reporter_iso3
                    if (!iso3) return // TODO(types): vw_country_trade_imports.reporter_iso3 is nullable
                    if (!countryTotals[iso3]) {
                        countryTotals[iso3] = 0
                    }
                    countryTotals[iso3] += row.import_value_usd || 0
                })

                // Convert to array and sort by total import value
                const countries = Object.entries(countryTotals)
                    .map(([iso3, total]) => ({
                        iso3,
                        name: iso3ToDetails[iso3]?.name || iso3,
                        iso2: iso3ToDetails[iso3]?.iso2 || iso3.substring(0, 2),
                        total_import_value: total,
                    }))
                    .sort((a, b) => b.total_import_value - a.total_import_value)
                    .slice(0, limit)

                return countries
            } catch (err) {
                console.error('[useAvailableImportCountries] Error:', err)
                // Fallback to major reporters on error
                return [
                    { iso3: 'USA', name: 'United States', iso2: 'US', total_import_value: 0 },
                    { iso3: 'CHN', name: 'China', iso2: 'CN', total_import_value: 0 },
                    { iso3: 'DEU', name: 'Germany', iso2: 'DE', total_import_value: 0 },
                    { iso3: 'JPN', name: 'Japan', iso2: 'JP', total_import_value: 0 },
                    { iso3: 'IND', name: 'India', iso2: 'IN', total_import_value: 0 },
                    { iso3: 'GBR', name: 'United Kingdom', iso2: 'GB', total_import_value: 0 },
                    { iso3: 'FRA', name: 'France', iso2: 'FR', total_import_value: 0 },
                    { iso3: 'KOR', name: 'South Korea', iso2: 'KR', total_import_value: 0 },
                ]
            }
        },
        staleTime: 60 * 60 * 1000, // 1 hour
        gcTime: 2 * 60 * 60 * 1000, // 2 hours
    })
}

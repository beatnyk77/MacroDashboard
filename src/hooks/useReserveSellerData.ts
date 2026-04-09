import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ReserveSellerCountry {
    country_name: string;
    country_code: string;
    country_label: string;
    country_type: string;
    tic_holdings: { date: string; value: number }[];
    fx_reserves: { date: string; value: number }[];
    latest_tic: number;
    latest_fx: number;
    tic_delta_qoq: number;
    fx_delta_qoq: number;
}

export interface ReserveSellerData {
    countries: ReserveSellerCountry[];
    oilPrice: { date: string; value: number }[];
    latestOil: number;
}

const COUNTRY_CONFIG = [
    { code: 'JP', tic: 'Japan',              label: 'Japan',              type: 'G7 Powerhouse'      },
    { code: 'CN', tic: 'China, Mainland',    label: 'China',              type: 'BRICS Anchor'       },
    { code: 'IN', tic: 'India',              label: 'India',              type: 'Emerging Markets'   },
    { code: 'SA', tic: 'Saudi Arabia',       label: 'GCC / Saudi Arabia', type: 'Petrodollar Anchor' },
    { code: 'KR', tic: 'Korea, South',      label: 'South Korea',        type: 'Major Reserve Hub'  },
    { code: 'TW', tic: 'Taiwan',             label: 'Taiwan',             type: 'Major Reserve Hub'  },
    { code: 'SG', tic: 'Singapore',          label: 'Singapore',          type: 'Financial Center'   },
    { code: 'HK', tic: 'Hong Kong',          label: 'Hong Kong',          type: 'Financial Center'   },
    { code: 'GB', tic: 'United Kingdom',     label: 'United Kingdom',     type: 'G7 Powerhouse'      },
    { code: 'AE', tic: 'United Arab Emirates', label: 'UAE',              type: 'Petrodollar Anchor' },
    { code: 'BR', tic: 'Brazil',             label: 'Brazil',             type: 'Emerging Markets'   },
    { code: 'CH', tic: 'Switzerland',        label: 'Switzerland',        type: 'Financial Center'   },
    { code: 'LU', tic: 'Luxembourg',         label: 'Luxembourg',         type: 'Offshore Hub'       },
    { code: 'KY', tic: 'Cayman Islands',     label: 'Cayman Islands',     type: 'Offshore Hub'       },
] as const;

export function useReserveSellerData() {
    return useSuspenseQuery({
        queryKey: ['reserve_seller_tracker'],
        queryFn: async (): Promise<ReserveSellerData> => {
            const ticCountryNames = COUNTRY_CONFIG.map(c => c.tic);
            const countryCodes    = COUNTRY_CONFIG.map(c => c.code);

            // 1. Fetch TIC holdings history (all tracked entities)
            const { data: ticHistory, error: ticError } = await supabase
                .from('tic_foreign_holders')
                .select('country_name, as_of_date, holdings_usd_bn')
                .in('country_name', ticCountryNames)
                .order('as_of_date', { ascending: true });

            if (ticError) throw ticError;

            // 2. Fetch FX Reserves history (available for G20-tracked countries: JP, CN, IN, SA, KR, DE, BR)
            const { data: fxHistory, error: fxError } = await supabase
                .from('country_reserves')
                .select('country_code, as_of_date, fx_reserves_usd')
                .in('country_code', countryCodes)
                .order('as_of_date', { ascending: true });

            if (fxError) throw fxError;

            // 3. Fetch Brent oil price history
            const { data: oilHistory, error: oilError } = await supabase
                .from('commodity_prices')
                .select('as_of_date, price')
                .eq('symbol', 'Brent')
                .order('as_of_date', { ascending: true });

            if (oilError) throw oilError;

            // Map data to each country using COUNTRY_CONFIG as the source of truth
            const countries: ReserveSellerCountry[] = COUNTRY_CONFIG.map(config => {
                const countryTic = (ticHistory ?? [])
                    .filter(t => t.country_name === config.tic)
                    .map(t => ({ date: t.as_of_date, value: Number(t.holdings_usd_bn) }));

                // FX reserves only available for G20-tracked country codes
                const countryFx = (fxHistory ?? [])
                    .filter(f => f.country_code === config.code)
                    .map(f => ({ date: f.as_of_date, value: Number(f.fx_reserves_usd) / 1e9 }));

                const latestTic = countryTic[countryTic.length - 1]?.value ?? 0;
                // Approximate QoQ: 4 periods back if monthly, else first available
                const prevTic = countryTic.length >= 4
                    ? countryTic[countryTic.length - 4].value
                    : (countryTic[0]?.value ?? 0);

                const latestFx = countryFx[countryFx.length - 1]?.value ?? 0;
                const prevFx   = countryFx.length >= 4
                    ? countryFx[countryFx.length - 4].value
                    : (countryFx[0]?.value ?? 0);

                return {
                    country_name:  config.tic,
                    country_code:  config.code,
                    country_label: config.label,
                    country_type:  config.type,
                    tic_holdings:  countryTic,
                    fx_reserves:   countryFx,
                    latest_tic:    latestTic,
                    latest_fx:     latestFx,
                    tic_delta_qoq: prevTic ? ((latestTic - prevTic) / prevTic) * 100 : 0,
                    fx_delta_qoq:  prevFx  ? ((latestFx  - prevFx)  / prevFx)  * 100 : 0,
                };
            });

            const processedOil = (oilHistory ?? []).map(o => ({
                date:  o.as_of_date,
                value: Number(o.price),
            }));

            return {
                countries,
                oilPrice:  processedOil,
                latestOil: processedOil[processedOil.length - 1]?.value ?? 0,
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

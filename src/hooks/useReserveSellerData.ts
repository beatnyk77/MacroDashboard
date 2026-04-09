import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ReserveSellerCountry {
    country_name: string;
    country_code: string;
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

export function useReserveSellerData() {
    return useSuspenseQuery({
        queryKey: ['reserve_seller_tracker'],
        queryFn: async (): Promise<ReserveSellerData> => {
            const countryCodes = ['JP', 'CN', 'IN', 'SA'];
            const ticCountryNames = ['Japan', 'China, Mainland', 'India', 'Saudi Arabia'];

            // 1. Fetch TIC holdings history
            const { data: ticHistory, error: ticError } = await supabase
                .from('tic_foreign_holders')
                .select('country_name, as_of_date, holdings_usd_bn')
                .in('country_name', ticCountryNames)
                .order('as_of_date', { ascending: true });

            if (ticError) throw ticError;

            // 2. Fetch FX Reserves history
            const { data: fxHistory, error: fxError } = await supabase
                .from('country_reserves')
                .select('country_code, as_of_date, fx_reserves_usd')
                .in('country_code', countryCodes)
                .order('as_of_date', { ascending: true });

            if (fxError) throw fxError;

            // 3. Fetch Oil price history (Brent)
            const { data: oilHistory, error: oilError } = await supabase
                .from('commodity_prices')
                .select('as_of_date, price')
                .eq('symbol', 'Brent')
                .order('as_of_date', { ascending: true });

            if (oilError) throw oilError;

            // Grouping data
            const countries: ReserveSellerCountry[] = countryCodes.map((code, idx) => {
                const name = ticCountryNames[idx];
                const countryTic = (ticHistory || [])
                    .filter(t => t.country_name === name)
                    .map(t => ({ date: t.as_of_date, value: Number(t.holdings_usd_bn) }));
                
                const countryFx = (fxHistory || [])
                    .filter(f => f.country_code === code)
                    .map(f => ({ date: f.as_of_date, value: Number(f.fx_reserves_usd) / 1e9 })); // Convert to BN for comparison

                const latestTic = countryTic[countryTic.length - 1]?.value || 0;
                const prevTic = countryTic[countryTic.length - 4]?.value || countryTic[0]?.value || 0; // Approx 1 quarter if monthly
                
                const latestFx = countryFx[countryFx.length - 1]?.value || 0;
                const prevFx = countryFx[countryFx.length - 4]?.value || countryFx[0]?.value || 0;

                return {
                    country_name: name,
                    country_code: code,
                    tic_holdings: countryTic,
                    fx_reserves: countryFx,
                    latest_tic: latestTic,
                    latest_fx: latestFx,
                    tic_delta_qoq: prevTic ? ((latestTic - prevTic) / prevTic) * 100 : 0,
                    fx_delta_qoq: prevFx ? ((latestFx - prevFx) / prevFx) * 100 : 0,
                };
            });

            const processedOil = (oilHistory || []).map(o => ({
                date: o.as_of_date,
                value: Number(o.price)
            }));

            return {
                countries,
                oilPrice: processedOil,
                latestOil: processedOil[processedOil.length - 1]?.value || 0
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

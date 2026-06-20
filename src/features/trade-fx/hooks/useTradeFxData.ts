import { useCurrencyWars } from '@/hooks/useCurrencyWars';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useIndiaMacro } from '@/hooks/useIndiaMacro';
import { useUSMacroPulse } from '@/hooks/useUSMacroPulse';
import { useDeDollarization } from '@/hooks/useDeDollarization';
import { useCommodities } from '@/hooks/useCommodities';
import { useRBIFXDefense } from '@/hooks/useRBIFXDefense';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { classifyRegime } from '../lib/regimeEngine';
import { estimateForwardRate } from '../constants/currencyPairs';
import type { CurrencyPair, TimeHorizon, TradeFxData } from '../lib/tradeFxTypes';

type UseTradeFxDataOptions = {
    pair?: CurrencyPair;
    horizon?: TimeHorizon;
};

/**
 * Composes existing macro hooks into a unified TradeFxData object.
 * Must be called inside a React Suspense boundary (useUSMacroPulse,
 * useDeDollarization, and useCommodities use useSuspenseQuery).
 */
export function useTradeFxData({
    pair = 'USD/INR',
    horizon = '3M',
}: UseTradeFxDataOptions = {}): TradeFxData {
    const {
        data: currencyWars,
        isLoading: currencyWarsLoading,
        isError: currencyWarsError,
    } = useCurrencyWars();

    const {
        data: usdInrMetric,
        isLoading: spotLoading,
        isError: spotError,
    } = useLatestMetric(MID.USD_INR_RATE);

    const {
        data: indiaMacro,
        isLoading: indiaLoading,
        isError: indiaError,
    } = useIndiaMacro();

    const { data: rbiFx, loading: rbiLoading, error: rbiError } = useRBIFXDefense();

    const { data: usMacro } = useUSMacroPulse();
    const { data: deDol } = useDeDollarization();
    const { data: commodities } = useCommodities();

    const latestCurrencyWars = currencyWars?.[currencyWars.length - 1];
    const spotFromWars = latestCurrencyWars?.usd_inr ?? null;
    const spot = usdInrMetric?.value ?? spotFromWars;

    const spotHistoryFromWars = (currencyWars ?? [])
        .filter((row) => row.usd_inr != null)
        .map((row) => ({ date: row.date, value: row.usd_inr as number }));

    const spotHistory =
        spotHistoryFromWars.length > 0
            ? spotHistoryFromWars
            : (usdInrMetric?.history ?? []);

    const latestRbi = rbiFx[rbiFx.length - 1];
    const fxReservesBn = latestRbi?.fx_reserves_bn ?? null;

    const us10yMetric = usMacro?.find((m) => m.metric_id === MID.US_10Y_YIELD);
    const us10yYield = us10yMetric?.current_value ?? null;

    const brentPrice = commodities?.brent.current?.value ?? null;
    const brentHistory = commodities?.brent.history ?? [];
    const prevBrent =
        brentHistory.length >= 2 ? brentHistory[brentHistory.length - 2].value : null;
    const brentDelta =
        brentPrice !== null && prevBrent !== null && prevBrent > 0
            ? ((brentPrice - prevBrent) / prevBrent) * 100
            : null;

    const regimeResult = classifyRegime({
        spotHistory,
        compositePressure:
            latestCurrencyWars?.composite_pressure ??
            latestCurrencyWars?.pressure ??
            null,
        policyDivergence: latestCurrencyWars?.divergence ?? null,
        flowTension: latestCurrencyWars?.tension ?? null,
        fxReservesBn,
        brentPrice,
        brentDelta,
        usdSharePct: deDol?.usdShare?.value ?? null,
        usdShareDeltaYoy: deDol?.usdShare?.delta_yoy_pct ?? null,
        us10yYield,
        sourceFreshness: {
            india_pulse: latestRbi?.date ?? indiaMacro?.metrics?.[0]?.last_updated_at,
            us_pulse: us10yMetric?.history?.[us10yMetric.history.length - 1]?.date,
            dedol_lab: deDol?.usdShare?.last_updated_at,
            commodities: brentHistory[brentHistory.length - 1]?.date,
            currency_wars: latestCurrencyWars?.date,
        },
    });

    const forwardRate = spot !== null ? estimateForwardRate(spot, horizon) : null;

    const isLoading = currencyWarsLoading || spotLoading || indiaLoading || rbiLoading;
    const hasError = currencyWarsError || spotError || indiaError || rbiError !== null;

    return {
        pair,
        spot,
        forwardRate,
        spotHistory,
        volatilityRegime: regimeResult.volatilityRegime,
        realizedVolPct: regimeResult.realizedVolPct,
        macroSignals: regimeResult.macroSignals,
        regimeNote: regimeResult.regimeNote,
        isLoading,
        hasError,
    };
}
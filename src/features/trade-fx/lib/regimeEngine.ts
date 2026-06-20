import { getStaleness } from '@/hooks/useStaleness';
import type {
    MacroRegimeSignal,
    RegimeEngineInput,
    RegimeEngineOutput,
    VolatilityRegime,
} from './tradeFxTypes';
import { calculateRealizedVol } from './collarPayoff';

const VOL_REGIME_ORDER: VolatilityRegime[] = ['low', 'moderate', 'elevated', 'high'];

function classifyBaseVolatility(realizedVolPct: number): VolatilityRegime {
    if (realizedVolPct < 6) return 'low';
    if (realizedVolPct < 9) return 'moderate';
    if (realizedVolPct < 13) return 'elevated';
    return 'high';
}

function bumpRegime(regime: VolatilityRegime, direction: 'up' | 'down'): VolatilityRegime {
    const idx = VOL_REGIME_ORDER.indexOf(regime);
    if (direction === 'up') {
        return VOL_REGIME_ORDER[Math.min(idx + 1, VOL_REGIME_ORDER.length - 1)];
    }
    return VOL_REGIME_ORDER[Math.max(idx - 1, 0)];
}

function applyPressureOverride(
    base: VolatilityRegime,
    compositePressure: number | null,
): VolatilityRegime {
    if (compositePressure === null) return base;
    if (compositePressure > 75) return bumpRegime(base, 'up');
    if (compositePressure < 25) return bumpRegime(base, 'down');
    return base;
}

function buildIndiaSignal(
    input: RegimeEngineInput,
    volRegime: VolatilityRegime,
): MacroRegimeSignal {
    const reserves = input.fxReservesBn;
    const freshness = input.sourceFreshness.india_pulse ?? new Date().toISOString();
    const staleness = getStaleness(freshness, 'weekly').state;

    let sentiment: MacroRegimeSignal['sentiment'] = 'neutral';
    let detail =
        'India forex reserve telemetry unavailable — monitor RBI FX defense panel for intervention bias.';

    if (reserves !== null) {
        if (reserves > 650 && volRegime !== 'high') {
            sentiment = 'supportive';
            detail = `India forex reserves at $${reserves.toFixed(0)}B; RBI intervention capacity supportive for USD receivable hedging windows.`;
        } else if (reserves < 600 || volRegime === 'high') {
            sentiment = 'cautionary';
            detail = `Reserve buffer at $${reserves.toFixed(0)}B with ${volRegime} volatility — intervention bias may tighten.`;
        } else {
            detail = `India forex reserves at $${reserves.toFixed(0)}B; RBI posture neutral in current vol regime.`;
        }
    }

    return {
        source: 'india_pulse',
        label: 'Reserves & RBI Bias',
        sentiment,
        detail,
        freshness,
        link: '/intel/india',
        staleness,
    };
}

function buildUSSignal(input: RegimeEngineInput): MacroRegimeSignal {
    const freshness = input.sourceFreshness.us_pulse ?? new Date().toISOString();
    const staleness = getStaleness(freshness, 'daily').state;
    const us10y = input.us10yYield;
    const divergence = input.policyDivergence;

    let sentiment: MacroRegimeSignal['sentiment'] = 'neutral';
    let detail = 'US macro pulse mixed — monitor Fed path and DXY for INR pass-through.';

    if ((us10y !== null && us10y > 4.5) || (divergence !== null && divergence > 200)) {
        sentiment = 'cautionary';
        detail = `Fed/RBI policy divergence at ${divergence?.toFixed(0) ?? '—'} bps with US 10Y at ${us10y?.toFixed(2) ?? '—'}% — USD strength risk elevated.`;
    } else if (divergence !== null && divergence < 100) {
        sentiment = 'supportive';
        detail = `Narrow Fed/RBI divergence (${divergence.toFixed(0)} bps) — reduced directional pressure on USD/INR.`;
    }

    return {
        source: 'us_pulse',
        label: 'Fed / DXY Pressure',
        sentiment,
        detail,
        freshness,
        link: '/labs/us-macro-fiscal',
        staleness,
    };
}

function buildDeDolSignal(input: RegimeEngineInput): MacroRegimeSignal {
    const freshness = input.sourceFreshness.dedol_lab ?? new Date().toISOString();
    const staleness = getStaleness(freshness, 'quarterly').state;
    const delta = input.usdShareDeltaYoy;

    let sentiment: MacroRegimeSignal['sentiment'] = 'neutral';
    let detail = 'De-dollarization pulse stable — INR settlement corridors unchanged.';

    if (delta !== null && delta < -0.5) {
        sentiment = 'supportive';
        detail = `Global USD reserve share declining (${delta.toFixed(1)} pp YoY) — structural hedge via INR invoicing increasingly viable.`;
    }

    return {
        source: 'dedol_lab',
        label: 'Settlement Corridors',
        sentiment,
        detail,
        freshness,
        link: '/labs/de-dollarization-gold',
        staleness,
    };
}

function buildCommoditySignal(input: RegimeEngineInput): MacroRegimeSignal {
    const freshness = input.sourceFreshness.commodities ?? new Date().toISOString();
    const staleness = getStaleness(freshness, 'daily').state;
    const brent = input.brentPrice;
    const brentDelta = input.brentDelta;

    let sentiment: MacroRegimeSignal['sentiment'] = 'neutral';
    let detail = 'Commodity pass-through to INR import costs within normal range.';

    if ((brent !== null && brent > 85) || (brentDelta !== null && brentDelta > 5)) {
        sentiment = 'cautionary';
        detail = `Brent at $${brent?.toFixed(1) ?? '—'}/bbl — energy import cost pressure may compress INR via CAD channel.`;
    }

    return {
        source: 'commodities',
        label: 'Import Cost Pass-through',
        sentiment,
        detail,
        freshness,
        link: '/labs/energy-commodities',
        staleness,
    };
}

function buildCurrencyWarsSignal(input: RegimeEngineInput): MacroRegimeSignal {
    const freshness = input.sourceFreshness.currency_wars ?? new Date().toISOString();
    const staleness = getStaleness(freshness, 'daily').state;
    const tension = input.flowTension;

    let sentiment: MacroRegimeSignal['sentiment'] = 'neutral';
    let detail = 'Capital flow tension within normal operating range.';

    if (tension !== null && tension > 60) {
        sentiment = 'cautionary';
        detail = `Flow tension index at ${tension.toFixed(1)} — elevated capital flow volatility may widen USD/INR ranges.`;
    } else if (tension !== null && tension < 40) {
        sentiment = 'supportive';
        detail = `Flow tension index at ${tension.toFixed(1)} — stable capital flows supportive of tactical hedging entry.`;
    }

    return {
        source: 'currency_wars',
        label: 'Flow Tension',
        sentiment,
        detail,
        freshness,
        link: '/intel/india',
        staleness,
    };
}

function buildRegimeNote(
    volRegime: VolatilityRegime,
    signals: MacroRegimeSignal[],
): string {
    const supportive = signals.find((s) => s.sentiment === 'supportive');
    const cautionary = signals.find((s) => s.sentiment === 'cautionary');

    const parts = [`${volRegime.charAt(0).toUpperCase() + volRegime.slice(1)} volatility regime.`];
    if (supportive) parts.push(supportive.detail);
    if (cautionary) parts.push(cautionary.detail);

    return parts.join(' ');
}

/**
 * Pure deterministic regime classification from composed macro inputs.
 */
export function classifyRegime(input: RegimeEngineInput): RegimeEngineOutput {
    const realizedVolPct = calculateRealizedVol(input.spotHistory);
    const baseRegime = classifyBaseVolatility(realizedVolPct);
    const volatilityRegime = applyPressureOverride(baseRegime, input.compositePressure);

    const macroSignals = [
        buildIndiaSignal(input, volatilityRegime),
        buildUSSignal(input),
        buildDeDolSignal(input),
        buildCommoditySignal(input),
        buildCurrencyWarsSignal(input),
    ];

    return {
        volatilityRegime,
        realizedVolPct,
        macroSignals,
        regimeNote: buildRegimeNote(volatilityRegime, macroSignals),
    };
}
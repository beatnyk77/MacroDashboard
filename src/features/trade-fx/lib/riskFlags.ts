import type { MacroRegimeSignal, Role, VolatilityRegime } from './tradeFxTypes';

export type RiskFlagType = 'opportunity' | 'caution' | 'risk';

export type RiskFlag = {
    type: RiskFlagType;
    color: 'green' | 'amber' | 'red';
    headline: string;
    detail: string;
    link: string;
    linkLabel: string;
};

function signalBySource(
    signals: MacroRegimeSignal[],
    source: MacroRegimeSignal['source'],
): MacroRegimeSignal | undefined {
    return signals.find((s) => s.source === source);
}

function exporterFlags(
    regime: VolatilityRegime,
    signals: MacroRegimeSignal[],
): RiskFlag[] {
    const flags: RiskFlag[] = [];
    const india = signalBySource(signals, 'india_pulse');
    const us = signalBySource(signals, 'us_pulse');

    if (regime === 'low' || regime === 'moderate') {
        flags.push({
            type: 'opportunity',
            color: 'green',
            headline: 'Hedging window open',
            detail:
                india?.detail ??
                'Low-to-moderate volatility regime — favorable entry for forward contracts or collars on USD receivables.',
            link: '/intel/india',
            linkLabel: 'India Pulse',
        });
    }

    if (us?.sentiment === 'cautionary' || regime === 'elevated' || regime === 'high') {
        flags.push({
            type: 'caution',
            color: 'amber',
            headline: 'USD strength watch',
            detail:
                us?.detail ??
                'Fed policy uncertainty persists. Monitor US Pulse for DXY signals before locking long tenors.',
            link: '/labs/us-macro-fiscal',
            linkLabel: 'US Pulse',
        });
    }

    if (regime === 'high') {
        flags.push({
            type: 'risk',
            color: 'red',
            headline: 'Elevated tail-risk regime',
            detail:
                'Realized volatility elevated — consider premium protection structures or reduced open exposure on receivables.',
            link: '/intel/india',
            linkLabel: 'India Pulse',
        });
    }

    return flags;
}

function importerFlags(
    regime: VolatilityRegime,
    signals: MacroRegimeSignal[],
): RiskFlag[] {
    const flags: RiskFlag[] = [];
    const dedol = signalBySource(signals, 'dedol_lab');
    const commodities = signalBySource(signals, 'commodities');

    if (dedol?.sentiment === 'supportive' || dedol?.sentiment === 'neutral') {
        flags.push({
            type: 'caution',
            color: 'amber',
            headline: 'CNY corridor signal emerging',
            detail:
                dedol?.detail ??
                'De-dollarization data shows early INR settlement signals on China corridor — explore invoicing flexibility.',
            link: '/labs/de-dollarization-gold',
            linkLabel: 'De-Dol Lab',
        });
    }

    if (commodities?.sentiment === 'cautionary') {
        flags.push({
            type: 'caution',
            color: 'amber',
            headline: 'Import cost pass-through watch',
            detail: commodities.detail,
            link: '/labs/energy-commodities',
            linkLabel: 'Commodities',
        });
    }

    if (regime === 'elevated' || regime === 'high') {
        flags.push({
            type: 'risk',
            color: 'red',
            headline: 'Payable rate volatility elevated',
            detail:
                'USD/INR volatility elevated — importers with open payables face wider budget variance; monitor forward cover on committed tranches.',
            link: '/labs/us-macro-fiscal',
            linkLabel: 'US Pulse',
        });
    }

    return flags;
}

function dedupeFlags(flags: RiskFlag[]): RiskFlag[] {
    const seen = new Set<string>();
    return flags.filter((flag) => {
        if (seen.has(flag.headline)) return false;
        seen.add(flag.headline);
        return true;
    });
}

export function buildRiskFlags(
    role: Role,
    volatilityRegime: VolatilityRegime,
    macroSignals: MacroRegimeSignal[],
): RiskFlag[] {
    if (role === 'exporter') {
        return exporterFlags(volatilityRegime, macroSignals).slice(0, 3);
    }
    if (role === 'importer') {
        return importerFlags(volatilityRegime, macroSignals).slice(0, 3);
    }

    return dedupeFlags([
        ...exporterFlags(volatilityRegime, macroSignals),
        ...importerFlags(volatilityRegime, macroSignals),
    ]).slice(0, 4);
}
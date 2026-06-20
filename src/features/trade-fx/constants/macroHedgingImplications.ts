import { TRADE_FX_AFFILIATE_CTA_ID } from '../lib/hedgingArchetypes';
import type { MacroRegimeSignalSource, Role, TimeHorizon } from '../lib/tradeFxTypes';

export type MacroHedgingCTA = {
    label: string;
    horizon: TimeHorizon;
    scrollTarget: string;
};

export type MacroHedgingImplication = {
    hedgingImplication: Record<Role, string>;
    collarCTA?: MacroHedgingCTA;
};

export const MACRO_HEDGING_IMPLICATIONS: Record<
    MacroRegimeSignalSource,
    MacroHedgingImplication
> = {
    india_pulse: {
        hedgingImplication: {
            exporter:
                'RBI intervention buffer may cap USD/INR spikes — collars may be more attractive than pure forwards at current vol.',
            importer:
                'RBI support reduces tail risk of sudden INR depreciation — partial hedges may suffice vs full forward booking.',
            balanced:
                'Strong reserves reduce extreme move risk — balanced partial hedge strategy fits current regime.',
        },
        collarCTA: {
            label: 'See 3M collar payoff →',
            horizon: '3M',
            scrollTarget: 'collar-payoff',
        },
    },
    us_pulse: {
        hedgingImplication: {
            exporter:
                'Mixed Fed signals keep USD/INR range-bound — forward booking at current levels captures reasonable certainty.',
            importer:
                'DXY uncertainty argues for avoiding full forward locks; monitor for better entry.',
            balanced:
                'Mixed signals: hedge committed flows only; leave discretionary exposure open.',
        },
    },
    dedol_lab: {
        hedgingImplication: {
            exporter:
                'INR invoicing corridors emerging on Asia trade routes — explore structural hedge before booking forwards.',
            importer:
                'INR settlement options reduce USD payables need on China/ASEAN corridors — worth exploring with bank.',
            balanced:
                'De-dollarisation signals support INR invoicing exploration as a structural hedge.',
        },
        collarCTA: {
            label: 'Explore INR invoicing →',
            horizon: '6M',
            scrollTarget: TRADE_FX_AFFILIATE_CTA_ID,
        },
    },
    commodities: {
        hedgingImplication: {
            exporter:
                'Commodity-linked INR volatility within normal range — no special hedging urgency from this signal.',
            importer:
                'Commodity import costs within normal pass-through range — no unusual INR cost pressure at current oil/gold levels.',
            balanced: 'Commodity signals neutral — standard hedging framework applies.',
        },
    },
    currency_wars: {
        hedgingImplication: {
            exporter:
                'Capital flow within normal range — no imminent INR depreciation pressure from this signal.',
            importer:
                'Flow tension within bounds — no urgent hedging trigger from cross-border capital movements.',
            balanced: 'Flow conditions neutral — regime remains balanced.',
        },
    },
};
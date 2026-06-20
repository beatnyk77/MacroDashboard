export type MacroEvent = {
    date: string;
    label: string;
    gqNote: string;
};

/** Static RBI/Fed policy annotations for RateRegimeChart ReferenceLine markers. */
export const MACRO_EVENTS: MacroEvent[] = [
    {
        date: '2025-02-07',
        label: 'RBI MPC — rate hold',
        gqNote: 'RBI signals pause; INR steady on strong reserves',
    },
    {
        date: '2025-03-19',
        label: 'Fed FOMC',
        gqNote: 'Fed hold — DXY softer; exporters\' window widened',
    },
    {
        date: '2025-04-09',
        label: 'RBI FX intervention',
        gqNote: 'RBI active in spot market; volatility contained',
    },
    {
        date: '2025-06-04',
        label: 'RBI MPC',
        gqNote: 'India reserves robust; RBI intervention bias supportive',
    },
    {
        date: '2025-09-17',
        label: 'Fed FOMC — cut cycle',
        gqNote: 'Fed easing bias; EM FX relief signal',
    },
    {
        date: '2025-12-05',
        label: 'RBI MPC — year-end',
        gqNote: 'Year-end liquidity management; forward points elevated',
    },
    {
        date: '2026-02-06',
        label: 'RBI MPC',
        gqNote: 'Policy hold; reserves buffer intact',
    },
    {
        date: '2026-04-29',
        label: 'Fed FOMC',
        gqNote: 'Divergence watch — monitor composite pressure index',
    },
];
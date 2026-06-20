import type {
    CollarMetrics,
    CollarParams,
    CollarPayoffPoint,
    ExposureSimResult,
    Role,
} from './tradeFxTypes';

const TRADING_DAYS_PER_YEAR = 252;

/**
 * Rolling realized volatility (annualized %) from spot observations.
 */
export function calculateRealizedVol(
    history: { value: number }[],
    windowDays = 60,
): number {
    if (history.length < 2) return 0;

    const window = history.slice(-windowDays);
    const returns: number[] = [];

    for (let i = 1; i < window.length; i += 1) {
        const prev = window[i - 1].value;
        const curr = window[i].value;
        if (prev > 0) {
            returns.push((curr - prev) / prev);
        }
    }

    if (returns.length === 0) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
        returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;
    const dailyStd = Math.sqrt(variance);

    return dailyStd * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100;
}

/**
 * Generates data points for the collar payoff diagram.
 * Exporter perspective: long USD/INR (benefits from INR depreciation).
 */
export function generateCollarPayoffData(
    params: CollarParams,
    steps = 100,
): CollarPayoffPoint[] {
    const { currentSpot, forwardRate, floorStrike, capStrike } = params;
    const spotMin = currentSpot * 0.88;
    const spotMax = currentSpot * 1.12;
    const step = (spotMax - spotMin) / steps;

    return Array.from({ length: steps + 1 }, (_, i) => {
        const spot = spotMin + i * step;
        const unhedged = spot;
        const forwardHedge = forwardRate;
        const zeroCollar =
            spot < floorStrike ? floorStrike : spot > capStrike ? capStrike : spot;

        return { spotAtMaturity: spot, unhedged, forwardHedge, zeroCollar };
    });
}

/** Calculates summary metrics for the collar structure. */
export function calculateCollarMetrics(params: CollarParams): CollarMetrics {
    const { floorStrike, capStrike, forwardRate } = params;

    return {
        protectedFloor: floorStrike,
        cappedAt: capStrike,
        participationZone: [floorStrike, capStrike],
        breakEvenVsForward: forwardRate - floorStrike,
    };
}

/**
 * Calculates exposure impact for exporter and importer roles.
 * ΔP&L_Exporter = NotionalFC × ΔRate × (+1)
 * ΔP&L_Importer = NotionalFC × ΔRate × (-1)
 */
export function calculateExposureImpact(
    role: Role,
    notionalFC: number,
    currentSpot: number,
    deltaRatePct: number,
    regimeNote = '',
): ExposureSimResult {
    const deltaRateAbsolute = currentSpot * (deltaRatePct / 100);
    const magnitude = notionalFC * deltaRateAbsolute;

    let pnlINR: number;
    if (role === 'exporter') {
        pnlINR = magnitude;
    } else if (role === 'importer') {
        pnlINR = -magnitude;
    } else {
        pnlINR = 0;
    }

    const direction: ExposureSimResult['direction'] =
        Math.abs(pnlINR) < 0.01 ? 'neutral' : pnlINR > 0 ? 'gain' : 'loss';

    return {
        role,
        notionalFC,
        deltaRatePct,
        deltaRateAbsolute,
        pnlINR,
        direction,
        regimeNote,
    };
}

export type PayoffTableRow = {
    label: string;
    spotAtMaturity: number;
    unhedgedINR: number;
    forwardINR: number;
    collarINR: number;
    diffVsUnhedged: number;
};

export function buildPayoffTable(params: CollarParams): PayoffTableRow[] {
    const { floorStrike, capStrike, currentSpot, forwardRate, notionalFC } = params;

    const scenarios = [
        { label: 'Floor (protection level)', spot: floorStrike },
        { label: 'Current spot', spot: currentSpot },
        { label: 'Cap (upside limit)', spot: capStrike },
        { label: 'Tail scenario (+8%)', spot: currentSpot * 1.08 },
    ];

    return scenarios.map(({ label, spot }) => {
        const collarRate =
            spot < floorStrike ? floorStrike : spot > capStrike ? capStrike : spot;
        const unhedgedINR = spot * notionalFC;
        const forwardINR = forwardRate * notionalFC;
        const collarINR = collarRate * notionalFC;

        return {
            label,
            spotAtMaturity: spot,
            unhedgedINR,
            forwardINR,
            collarINR,
            diffVsUnhedged: collarINR - unhedgedINR,
        };
    });
}
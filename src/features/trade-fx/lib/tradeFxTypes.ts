import type { FreshnessStatus } from '@/components/FreshnessChip';

export type Role = 'exporter' | 'importer' | 'balanced';

export type CurrencyPair = 'USD/INR' | 'EUR/INR' | 'CNY/INR';

export type TimeHorizon = '1M' | '3M' | '6M' | '1Y' | 'YTD';

export type VolatilityRegime = 'low' | 'moderate' | 'elevated' | 'high';

export type MacroRegimeSignalSource =
    | 'india_pulse'
    | 'us_pulse'
    | 'dedol_lab'
    | 'commodities'
    | 'currency_wars';

export type MacroRegimeSignal = {
    source: MacroRegimeSignalSource;
    label: string;
    sentiment: 'supportive' | 'neutral' | 'cautionary';
    detail: string;
    freshness: string;
    link: string;
    staleness: FreshnessStatus;
};

export type CollarPayoffPoint = {
    spotAtMaturity: number;
    unhedged: number;
    forwardHedge: number;
    zeroCollar: number;
};

export type CollarParams = {
    currentSpot: number;
    forwardRate: number;
    floorStrike: number;
    capStrike: number;
    notionalFC: number;
    horizonDays: number;
};

export type CollarMetrics = {
    protectedFloor: number;
    cappedAt: number;
    participationZone: [number, number];
    breakEvenVsForward: number;
};

export type HedgingArchetype = {
    id: string;
    name: string;
    typicalRegimeFit: string;
    treasuryNote: string;
    protectionLevel: 'high' | 'medium' | 'low';
    costDrag: 'lowest' | 'low' | 'moderate' | 'premium';
    upsideParticipation: 'full' | 'partial' | 'capped' | 'none';
    keyMacroTrigger: string;
    regimeFilter: (regime: VolatilityRegime, role: Role) => boolean;
    partnerCTA: string;
    partnerCTALabel: string;
};

export type ExposureSimResult = {
    role: Role;
    notionalFC: number;
    deltaRatePct: number;
    deltaRateAbsolute: number;
    pnlINR: number;
    direction: 'gain' | 'loss' | 'neutral';
    regimeNote: string;
};

export type TradeFxData = {
    pair: CurrencyPair;
    spot: number | null;
    forwardRate: number | null;
    spotHistory: { date: string; value: number }[];
    volatilityRegime: VolatilityRegime;
    realizedVolPct: number;
    macroSignals: MacroRegimeSignal[];
    regimeNote: string;
    isLoading: boolean;
    hasError: boolean;
    isIllustrativeRates: boolean;
};

export type TradeFxLeadPayload = {
    contactName: string;
    email: string;
    tradeRole: Role;
    currencyPair: CurrencyPair;
    notionalRange: '<1Cr' | '1-5Cr' | '5-25Cr' | '>25Cr';
    partnerPreference: 'hdfc' | 'kotak' | 'icici' | 'skydo' | 'karbon' | 'any';
    interestType: 'forward' | 'collar' | 'options' | 'inr_invoicing' | 'general';
    honeypot?: string;
};

export type RegimeEngineInput = {
    spotHistory: { date: string; value: number }[];
    compositePressure: number | null;
    policyDivergence: number | null;
    flowTension: number | null;
    fxReservesBn: number | null;
    brentPrice: number | null;
    brentDelta: number | null;
    usdSharePct: number | null;
    usdShareDeltaYoy: number | null;
    us10yYield: number | null;
    sourceFreshness: Partial<Record<MacroRegimeSignalSource, string>>;
};

export type RegimeEngineOutput = {
    volatilityRegime: VolatilityRegime;
    realizedVolPct: number;
    macroSignals: MacroRegimeSignal[];
    regimeNote: string;
};
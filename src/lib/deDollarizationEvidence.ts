export type EvidenceClass = 'observed' | 'derived' | 'estimated' | 'scenario';
export type EvidenceFamily =
    | 'reserve-composition'
    | 'official-gold'
    | 'sovereign-collateral'
    | 'settlement-rails'
    | 'market-confirmation'
    | 'country-bloc';

export type Direction = 'up' | 'down';

export interface EvidenceDefinition {
    id: string;
    label: string;
    family: EvidenceFamily;
    unit: string;
    source: string;
    sourceUrl: string;
    frequency: string;
    expectedLag: string;
    evidenceClass: EvidenceClass;
    role: 'primary' | 'confirmation';
    direction?: Direction;
    description: string;
    limitation: string;
}

export const EVIDENCE_FAMILIES: Array<{
    id: EvidenceFamily;
    label: string;
    description: string;
    sourceSummary: string;
}> = [
    {
        id: 'reserve-composition',
        label: 'Reserve composition',
        description: 'Currency denomination of official foreign-exchange reserves.',
        sourceSummary: 'IMF COFER',
    },
    {
        id: 'official-gold',
        label: 'Official gold accumulation',
        description: 'Reported central-bank gold holdings and changes in tonnes.',
        sourceSummary: 'WGC / IMF',
    },
    {
        id: 'sovereign-collateral',
        label: 'Sovereign collateral demand',
        description: 'Foreign holdings and demand signals for US Treasury collateral.',
        sourceSummary: 'US Treasury TIC',
    },
    {
        id: 'settlement-rails',
        label: 'Settlement and payment rails',
        description: 'Currency use in payment systems, trade invoicing, and bilateral settlement.',
        sourceSummary: 'Methodology pending',
    },
    {
        id: 'market-confirmation',
        label: 'Market confirmation',
        description: 'Market prices and ratios that provide context around reserve behavior.',
        sourceSummary: 'Market / derived',
    },
    {
        id: 'country-bloc',
        label: 'Country and bloc exposure',
        description: 'Comparable country and bloc reserve exposures where coverage exists.',
        sourceSummary: 'Coverage audit pending',
    },
];

const IMF_COFER = 'https://data.imf.org/en/Datasets/COFER/Frequently-Asked-Questions';
const WGC_GOLD = 'https://www.gold.org/goldhub/data/gold-reserves-by-country';
const TREASURY_TIC = 'https://home.treasury.gov/data/treasury-international-capital-tic-system-home-page/description-of-TIC-system';

export const EVIDENCE_DEFINITIONS: EvidenceDefinition[] = [
    {
        id: 'GLOBAL_USD_SHARE_PCT', label: 'USD share of FX reserves', family: 'reserve-composition', unit: '%',
        source: 'IMF COFER', sourceUrl: IMF_COFER, frequency: 'quarterly', expectedLag: 'Quarterly release lag', evidenceClass: 'observed', role: 'primary', direction: 'down',
        description: 'Share of global foreign-exchange reserves reported in US dollars.', limitation: 'COFER excludes monetary gold and is published as global aggregates, not country-level composition.',
    },
    {
        id: 'GLOBAL_RMB_SHARE_PCT', label: 'RMB share of FX reserves', family: 'reserve-composition', unit: '%',
        source: 'IMF COFER', sourceUrl: IMF_COFER, frequency: 'quarterly', expectedLag: 'Quarterly release lag', evidenceClass: 'observed', role: 'confirmation', direction: 'up',
        description: 'Share of global foreign-exchange reserves reported in renminbi.', limitation: 'Share movements can reflect valuation effects as well as transactions.',
    },
    {
        id: 'GLOBAL_EUR_SHARE_PCT', label: 'EUR share of FX reserves', family: 'reserve-composition', unit: '%',
        source: 'IMF COFER', sourceUrl: IMF_COFER, frequency: 'quarterly', expectedLag: 'Quarterly release lag', evidenceClass: 'observed', role: 'confirmation',
        description: 'Share of global foreign-exchange reserves reported in euros.', limitation: 'COFER does not identify individual country allocations.',
    },
    {
        id: 'cb_gold_net', label: 'Central-bank net gold purchases', family: 'official-gold', unit: 'tonnes',
        source: 'WGC / IMF', sourceUrl: WGC_GOLD, frequency: 'monthly', expectedLag: 'Usually two months in arrears', evidenceClass: 'observed', role: 'primary', direction: 'up',
        description: 'Compiled purchases less sales by official-sector gold holders.', limitation: 'Reported holdings and changes can be revised and do not capture every transaction immediately.',
    },
    {
        id: 'tic_foreign_holdings', label: 'Foreign Treasury holdings', family: 'sovereign-collateral', unit: 'USD bn',
        source: 'US Treasury TIC', sourceUrl: TREASURY_TIC, frequency: 'monthly', expectedLag: 'Monthly release lag', evidenceClass: 'observed', role: 'primary', direction: 'down',
        description: 'Reported foreign holdings of US Treasury securities by recorded country.', limitation: 'Custody chains and intermediaries prevent precise ultimate-owner attribution.',
    },
    {
        id: 'GOLD_PRICE_USD', label: 'Gold price', family: 'market-confirmation', unit: 'USD/oz',
        source: 'Market / WGC', sourceUrl: WGC_GOLD, frequency: 'daily', expectedLag: 'Daily market close', evidenceClass: 'observed', role: 'primary', direction: 'up',
        description: 'Market price of gold in US dollars per troy ounce.', limitation: 'Price appreciation alone does not establish reserve or settlement diversification.',
    },
    {
        id: 'BRENT_CRUDE_PRICE', label: 'Brent crude price', family: 'market-confirmation', unit: 'USD/bbl',
        source: 'EIA / market', sourceUrl: 'https://www.eia.gov/petroleum/', frequency: 'daily', expectedLag: 'Daily market close', evidenceClass: 'observed', role: 'confirmation',
        description: 'Brent crude reference price used for energy-market context.', limitation: 'It does not measure the currency used to settle an oil transaction.',
    },
    {
        id: 'RATIO_M2_GOLD', label: 'M2 / Gold ratio', family: 'market-confirmation', unit: 'ratio',
        source: 'GraphiQuestor calculation', sourceUrl: 'https://graphiquestor.com/methods/m2-gold-ratio/', frequency: 'varies by input', expectedLag: 'Input-dependent', evidenceClass: 'derived', role: 'confirmation',
        description: 'Relative scale of broad money against the value of above-ground gold.', limitation: 'The ratio is a valuation context measure, not a reserve allocation measure.',
    },
    {
        id: 'RATIO_DEBT_GOLD', label: 'Debt / Gold ratio', family: 'market-confirmation', unit: 'ratio',
        source: 'GraphiQuestor calculation', sourceUrl: 'https://graphiquestor.com/methods/debt-gold-z-score/', frequency: 'varies by input', expectedLag: 'Input-dependent', evidenceClass: 'derived', role: 'confirmation',
        description: 'Sovereign debt relative to the market value of official gold reserves.', limitation: 'It is sensitive to gold price valuation and does not show actual central-bank intent.',
    },
];

export const getEvidenceDefinition = (id: string) => EVIDENCE_DEFINITIONS.find((item) => item.id === id);
export const getFamilyDefinitions = (family: EvidenceFamily) => EVIDENCE_DEFINITIONS.filter((item) => item.family === family);

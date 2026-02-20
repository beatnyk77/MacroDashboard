export const INITIAL_INDIA_DEBT_DATA = [
    // Data from RBI Handbook of Statistics 2024 / Quarterly Report on Public Debt (Sept 2024)
    // Central Government Dated Securities Maturity Profile
    { date: '2024-09-30', bucket: '<1Y', amount_crore: 485000, type: 'central' },
    { date: '2024-09-30', bucket: '1-3Y', amount_crore: 1024000, type: 'central' },
    { date: '2024-09-30', bucket: '3-5Y', amount_crore: 1256000, type: 'central' },
    { date: '2024-09-30', bucket: '5-10Y', amount_crore: 2845000, type: 'central' },
    { date: '2024-09-30', bucket: '10-20Y', amount_crore: 3120000, type: 'central' },
    { date: '2024-09-30', bucket: '20Y+', amount_crore: 1850000, type: 'central' },

    // State Development Loans (SDL) - Approximate based on RBI data
    { date: '2024-09-30', bucket: '<1Y', amount_crore: 152000, type: 'state' },
    { date: '2024-09-30', bucket: '1-3Y', amount_crore: 584000, type: 'state' },
    { date: '2024-09-30', bucket: '3-5Y', amount_crore: 845000, type: 'state' },
    { date: '2024-09-30', bucket: '5-10Y', amount_crore: 1985000, type: 'state' },
    { date: '2024-09-30', bucket: '10-20Y', amount_crore: 1120000, type: 'state' },
    { date: '2024-09-30', bucket: '20Y+', amount_crore: 450000, type: 'state' }
];

import React from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Chip } from '@mui/material';

interface MetricInfo {
    category: string;
    metric: string;
    metricId: string;
    source: string;
    frequency: string;
    tier: 'Core' | 'Secondary';
}

const metrics: MetricInfo[] = [
    // Liquidity & Rates
    { category: 'Rates', metric: 'SOFR (Secured Overnight Financing Rate)', metricId: 'SOFR', source: 'FRED', frequency: 'Daily', tier: 'Core' },
    { category: 'Rates', metric: 'Fed Funds Rate', metricId: 'FEDFUNDS', source: 'FRED', frequency: 'Daily', tier: 'Core' },
    { category: 'Liquidity', metric: 'US M2 Money Supply', metricId: 'US_M2', source: 'FRED (M2SL)', frequency: 'Weekly', tier: 'Core' },

    // Gold & Precious Metals
    { category: 'Safe Assets', metric: 'Gold Price (USD/oz)', metricId: 'GOLD_PRICE_USD', source: 'FRED (GOLDAMGBD228NLBM)', frequency: 'Daily', tier: 'Core' },
    { category: 'Safe Assets', metric: 'M2/Gold Ratio', metricId: 'M2_GOLD_RATIO', source: 'Computed', frequency: 'Daily', tier: 'Core' },
    { category: 'Safe Assets', metric: 'SPX/Gold Ratio', metricId: 'SPX_GOLD_RATIO', source: 'Computed', frequency: 'Daily', tier: 'Secondary' },

    // Equity Markets
    { category: 'Equities', metric: 'S&P 500 Index', metricId: 'SPX_INDEX', source: 'FRED (SP500)', frequency: 'Daily', tier: 'Core' },

    // Treasury & Sovereign
    { category: 'Sovereign', metric: 'US Debt Outstanding', metricId: 'UST_DEBT_OUTSTANDING', source: 'US Treasury FiscalData', frequency: 'Daily', tier: 'Core' },
    { category: 'Sovereign', metric: 'G20 Debt/GDP', metricId: 'G20_DEBT_GDP_PCT', source: 'IMF WEO', frequency: 'Quarterly', tier: 'Core' },

    // BRICS Tracker
    { category: 'BRICS', metric: 'BRICS+ Gold Holdings (tonnes)', metricId: 'BRICS_GOLD_HOLDINGS_TONNES', source: 'IMF / WGC', frequency: 'Quarterly', tier: 'Core' },
    { category: 'BRICS', metric: 'BRICS+ USD Reserve Share (%)', metricId: 'BRICS_USD_RESERVE_SHARE_PCT', source: 'IMF COFER', frequency: 'Quarterly', tier: 'Core' },
    { category: 'BRICS', metric: 'BRICS+ GDP (PPP, $T)', metricId: 'BRICS_GDP_PPP_TN', source: 'IMF WEO', frequency: 'Annual', tier: 'Secondary' },
    { category: 'BRICS', metric: 'BRICS+ Debt/GDP (%)', metricId: 'BRICS_DEBT_GDP_PCT', source: 'IMF WEO', frequency: 'Annual', tier: 'Secondary' },

    // De-Dollarization
    { category: 'De-Dollarization', metric: 'Global USD Reserve Share (%)', metricId: 'GLOBAL_USD_SHARE_PCT', source: 'IMF COFER', frequency: 'Quarterly', tier: 'Core' },
    { category: 'De-Dollarization', metric: 'Global EUR Reserve Share (%)', metricId: 'GLOBAL_EUR_SHARE_PCT', source: 'IMF COFER', frequency: 'Quarterly', tier: 'Secondary' },
    { category: 'De-Dollarization', metric: 'Global RMB Reserve Share (%)', metricId: 'GLOBAL_RMB_SHARE_PCT', source: 'IMF COFER', frequency: 'Quarterly', tier: 'Core' },
    { category: 'De-Dollarization', metric: 'Global Gold Reserve Share (%)', metricId: 'GLOBAL_GOLD_SHARE_PCT', source: 'IMF COFER', frequency: 'Quarterly', tier: 'Core' },
];

export const MetricsMethodologyPage: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                Data Methodology
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" paragraph>
                GraphiQuestor provides institutional-grade macro intelligence for policy planners, central banks, sovereign wealth funds, and investment professionals. Below are the sources, calculation methods, and update frequencies for all metrics tracked.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mt: 4 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                            <TableCell><Typography variant="subtitle2" fontWeight={700}>Category</Typography></TableCell>
                            <TableCell><Typography variant="subtitle2" fontWeight={700}>Metric</Typography></TableCell>
                            <TableCell><Typography variant="subtitle2" fontWeight={700}>Source</Typography></TableCell>
                            <TableCell><Typography variant="subtitle2" fontWeight={700}>Frequency</Typography></TableCell>
                            <TableCell><Typography variant="subtitle2" fontWeight={700}>Tier</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {metrics.map((row) => (
                            <TableRow key={row.metricId} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                <TableCell>{row.category}</TableCell>
                                <TableCell>{row.metric}</TableCell>
                                <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.source}</Typography></TableCell>
                                <TableCell>{row.frequency}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={row.tier}
                                        size="small"
                                        color={row.tier === 'Core' ? 'primary' : 'default'}
                                        variant="outlined"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 6 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                    Regime Detection
                </Typography>
                <Typography variant="body1" paragraph>
                    Our "Macro Regime" indicator is derived from a deterministic rules-based model:
                </Typography>
                <ul>
                    <li>
                        <Typography variant="body2">
                            <strong>Tightening Risk:</strong> Triggered when M2/Gold Z-Score &gt; 1.5 AND SOFR Spreads widen &gt; 15bps.
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2">
                            <strong>Liquidity Expansion:</strong> Triggered when M2/Gold Z-Score &lt; -1.5, indicating aggressive debasement relative to trend.
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body2">
                            <strong>Neutral / Mixed:</strong> Default state when signals are conflicting or within normal bounds.
                        </Typography>
                    </li>
                </ul>
            </Box>

            <Box sx={{ mt: 6 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                    Data Sources
                </Typography>
                <Typography variant="body1" paragraph>
                    GraphiQuestor aggregates data from trusted institutional sources:
                </Typography>
                <ul>
                    <li><Typography variant="body2"><strong>FRED</strong> – Federal Reserve Economic Data (St. Louis Fed)</Typography></li>
                    <li><Typography variant="body2"><strong>US Treasury FiscalData</strong> – Debt, auctions, and maturity profiles</Typography></li>
                    <li><Typography variant="body2"><strong>IMF</strong> – COFER (Currency Composition of Official Foreign Exchange Reserves), WEO (World Economic Outlook)</Typography></li>
                    <li><Typography variant="body2"><strong>World Gold Council</strong> – Central bank gold holdings</Typography></li>
                </ul>
            </Box>
        </Container>
    );
};

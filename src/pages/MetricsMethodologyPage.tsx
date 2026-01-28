import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Chip, Grid } from '@mui/material';

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
    { category: 'Rates', metric: 'SOFR (Secured Overnight Financing Rate)', metricId: 'SOFR_RATE', source: 'FRED', frequency: 'Daily', tier: 'Core' },
    { category: 'Rates', metric: 'Fed Funds Rate', metricId: 'FED_FUNDS_RATE', source: 'FRED', frequency: 'Daily', tier: 'Core' },
    { category: 'Liquidity', metric: 'US M2 Money Supply', metricId: 'US_M2', source: 'FRED (M2SL)', frequency: 'Weekly', tier: 'Core' },
    { category: 'Liquidity', metric: 'Net Liquidity Composite', metricId: 'NET_LIQUIDITY', source: 'Fed Assets - (TGA + RRP)', frequency: 'Weekly', tier: 'Core' },

    // Gold & Precious Metals
    { category: 'Safe Assets', metric: 'Gold Price (USD/oz)', metricId: 'GOLD_PRICE_USD', source: 'Yahoo Finance (GC=F)', frequency: 'Daily', tier: 'Core' },
    { category: 'Safe Assets', metric: 'M2 / Gold Ratio', metricId: 'M2/Gold', source: 'Computed', frequency: 'Daily', tier: 'Core' },
    { category: 'Safe Assets', metric: 'SPX / Gold Ratio', metricId: 'SPX/Gold', source: 'Computed', frequency: 'Daily', tier: 'Secondary' },
    { category: 'Safe Assets', metric: 'Debt / Gold Ratio', metricId: 'DEBT/Gold', source: 'Computed', frequency: 'Daily', tier: 'Core' },

    // Equity Markets
    { category: 'Equities', metric: 'S&P 500 Index', metricId: 'SPX_INDEX', source: 'FRED (SP500)', frequency: 'Daily', tier: 'Core' },

    // Treasury & Sovereign
    { category: 'Sovereign', metric: 'US Debt Outstanding', metricId: 'UST_DEBT_TOTAL', source: 'US Treasury FiscalData', frequency: 'Daily', tier: 'Core' },
    { category: 'Sovereign', metric: 'G20 Debt/GDP', metricId: 'G20_DEBT_GDP_PCT', source: 'IMF WEO', frequency: 'Quarterly', tier: 'Core' },

    // BRICS Tracker
    { category: 'BRICS', metric: 'BRICS+ Gold Holdings', metricId: 'BRICS_GOLD_HOLDINGS_TONNES', source: 'IMF / WGC', frequency: 'Quarterly', tier: 'Core' },
    { category: 'BRICS', metric: 'BRICS+ USD Reserve Share (%)', metricId: 'BRICS_USD_RESERVE_SHARE_PCT', source: 'IMF COFER', frequency: 'Quarterly', tier: 'Core' },

    // De-Dollarization
    { category: 'De-Dollarization', metric: 'Global USD Reserve Share (%)', metricId: 'GLOBAL_USD_SHARE_PCT', source: 'IMF COFER', frequency: 'Quarterly', tier: 'Core' },
    { category: 'De-Dollarization', metric: 'Global Gold Reserve Share (%)', metricId: 'GLOBAL_GOLD_SHARE_PCT', source: 'IMF COFER', frequency: 'Quarterly', tier: 'Core' },
];

export const MetricsMethodologyPage: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Data Methodology
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" paragraph sx={{ maxWidth: 800 }}>
                GraphiQuestor provides institutional-grade macro intelligence. All Z-scores and percentiles are calculated using a
                <strong> 25-year rolling window</strong> to capture full debt and monetary cycles.
            </Typography>

            <Box sx={{ mt: 6 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>Calculation Formulas</Typography>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {[
                        { label: 'Net Liquidity', formula: 'Fed Assets - (TGA Balance + Reverse Repo)' },
                        { label: 'M2 / Gold', formula: 'US M2 Money Stock (Billions) / Gold Spot Price' },
                        { label: 'Debt / Gold', formula: 'Total Public Debt (Billions) / Gold Spot Price' },
                        { label: 'Z-Score', formula: '(Current Value - 25yr Mean) / 25yr StdDev' }
                    ].map((item) => (
                        <Grid item xs={12} md={6} key={item.label}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>{item.label}</Typography>
                                <Typography variant="h6" sx={{ fontFamily: 'serif', fontStyle: 'italic', mt: 1 }}>{item.formula}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            <TableContainer component={Paper} variant="outlined">
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
                                <TableCell sx={{ fontWeight: 600 }}>{row.category}</TableCell>
                                <TableCell>{row.metric}</TableCell>
                                <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'primary.main' }}>{row.source}</Typography></TableCell>
                                <TableCell>{row.frequency}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={row.tier}
                                        size="small"
                                        color={row.tier === 'Core' ? 'primary' : 'default'}
                                        variant="outlined"
                                        sx={{ borderRadius: 1, fontWeight: 700, fontSize: '0.65rem' }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 8 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                    Regime Detection
                </Typography>
                <Typography variant="body1" paragraph color="text.secondary">
                    Our "Macro Regime" indicator is derived from a deterministic rules-based model using normalized liquidity and volatility signals:
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Paper variant="outlined" sx={{ p: 3, height: '100%', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
                            <Typography variant="h6" color="error.main" gutterBottom>Tightening Risk</Typography>
                            <Typography variant="body2">
                                Triggered when Net Liquidity Z-Score &lt; -1.5 OR SOFR Spreads widen &gt; 15bps. Indicates restrictive conditions.
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper variant="outlined" sx={{ p: 3, height: '100%', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                            <Typography variant="h6" color="success.main" gutterBottom>Liquidity Expansion</Typography>
                            <Typography variant="body2">
                                Triggered when Net Liquidity Z-Score &gt; 1.5, indicating aggressive central bank accommodation or TGA drain.
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>Neutral / Stable</Typography>
                            <Typography variant="body2">
                                Signals are within +/- 1.0 StdDev of the 25-year mean. Market is in a trend-following structural phase.
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                    Data Integrity & Sources
                </Typography>
                <Typography variant="body1" paragraph color="text.secondary">
                    GraphiQuestor leverages the <strong>Supabase Model Context Protocol (MCP)</strong> for real-time validation and automated cron-based ingestion.
                </Typography>
                <ul>
                    <li><Typography variant="body2"><strong>FRED</strong> – US Federal Reserve Macro Data (St. Louis)</Typography></li>
                    <li><Typography variant="body2"><strong>US Treasury FiscalData</strong> – Real-time debt and auction monitoring</Typography></li>
                    <li><Typography variant="body2"><strong>IMF / COFER</strong> – Global reserve composition and gold accumulation</Typography></li>
                    <li><Typography variant="body2"><strong>Yahoo Finance</strong> – Real-time market data for Gold (GC=F) and SPX</Typography></li>
                </ul>
            </Box>
        </Container>
    );
};

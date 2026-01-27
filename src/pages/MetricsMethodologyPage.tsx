import React from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Chip } from '@mui/material';

interface MetricInfo {
    category: string;
    metric: string;
    source: string;
    frequency: string;
    tier: 'Core' | 'Secondary';
}

const metrics: MetricInfo[] = [
    { category: 'Liquidity', metric: 'Fed Net Liquidity', source: 'FRED (WALCL - TGA - RRP)', frequency: 'Weekly', tier: 'Core' },
    { category: 'Liquidity', metric: 'Global Liquidity Index', source: 'Bloomberg / Custom', frequency: 'Daily', tier: 'Core' },
    { category: 'Rates', metric: '10y-2y Spread', source: 'FRED (T10Y2Y)', frequency: 'Daily', tier: 'Core' },
    { category: 'Rates', metric: 'SOFR Spread', source: 'New York Fed', frequency: 'Daily', tier: 'Secondary' },
    { category: 'Safe Assets', metric: 'Gold vs Real Rates', source: 'FRED / COMEX', frequency: 'Daily', tier: 'Core' },
];

export const MetricsMethodologyPage: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                Data Methodology
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" paragraph>
                Transparency is key. Below are the sources, calculation methods, and update frequencies for all metrics tracked on this dashboard.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mt: 4 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><Typography variant="subtitle2" fontWeight={700}>Category</Typography></TableCell>
                            <TableCell><Typography variant="subtitle2" fontWeight={700}>Metric</Typography></TableCell>
                            <TableCell><Typography variant="subtitle2" fontWeight={700}>Source</Typography></TableCell>
                            <TableCell><Typography variant="subtitle2" fontWeight={700}>Frequency</Typography></TableCell>
                            <TableCell><Typography variant="subtitle2" fontWeight={700}>Tier</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {metrics.map((row) => (
                            <TableRow key={row.metric} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell>{row.category}</TableCell>
                                <TableCell>{row.metric}</TableCell>
                                <TableCell>{row.source}</TableCell>
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
        </Container>
    );
};

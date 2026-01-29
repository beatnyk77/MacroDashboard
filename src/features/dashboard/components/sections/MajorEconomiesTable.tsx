import React from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Paper,
    Skeleton,
    Tooltip,
    useTheme
} from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { useMajorEconomies, MajorEconomyRow } from '@/hooks/useMajorEconomies';
import { Info } from 'lucide-react';

export const MajorEconomiesTable: React.FC = () => {
    const theme = useTheme();
    const { data, isLoading } = useMajorEconomies();

    const formatValue = (val: number, decimals: number = 2) => {
        if (val === 0) return '-';
        return val.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    const getStalenessColor = (staleness: string) => {
        switch (staleness) {
            case 'fresh': return theme.palette.success.main;
            case 'lagged': return theme.palette.warning.main;
            case 'very_lagged': return theme.palette.error.main;
            default: return theme.palette.text.disabled;
        }
    };

    const renderCell = (value: number, suffix: string = '', decimals: number = 2, tooltip?: string) => (
        <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {formatValue(value, decimals)}{suffix}
                </Typography>
                {tooltip && (
                    <Tooltip title={tooltip} arrow placement="top">
                        <Box component="span" sx={{ cursor: 'help', opacity: 0.3, display: 'flex' }}>
                            <Info size={12} />
                        </Box>
                    </Tooltip>
                )}
            </Box>
        </TableCell>
    );

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="Major Economies Overview"
                subtitle="High-signal macro comparison: GDP, Growth, CPI, Policy Rates, and Reserves (Jan 2026)"
            />

            <TableContainer
                component={Paper}
                sx={{
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px -8px rgba(0,0,0,0.5)',
                }}
            >
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                            <TableCell sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                Country
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                GDP (Nom)
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                GDP (PPP)
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                Real Growth
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                CPI YoY
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                Policy Rate
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                FX Reserves
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                Gold (t)
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                Debt/Gold (x)
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                Status
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton variant="text" /></TableCell>
                                    {Array.from({ length: 8 }).map((_, j) => (
                                        <TableCell key={j}><Skeleton variant="text" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            data?.map((row: MajorEconomyRow) => (
                                <TableRow
                                    key={row.code}
                                    sx={{
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Typography sx={{ fontSize: '1.2rem' }}>{row.flag}</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                {row.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    {renderCell(row.gdp_nominal, 'T', 1, "Latest nominal GDP in USD Trillions. Source: IMF WEO.")}
                                    {renderCell(row.gdp_ppp, 'T', 1, "Purchasing Power Parity GDP in USD Trillions. Source: IMF WEO.")}
                                    {renderCell(row.growth, '%', 1, "Real GDP Growth Year-over-Year. Source: National Accounts.")}
                                    {renderCell(row.cpi, '%', 1, "Consumer Price Index Inflation YoY. Source: National Statistics Bureau.")}
                                    {renderCell(row.policy_rate, '%', 2, "Benchmark Policy Interest Rate. Source: Relevant Central Bank.")}
                                    {renderCell(row.fx_reserves, 'B', 0, "Current Foreign Exchange Reserves in USD Billions. Source: IMF IFS.")}
                                    {renderCell(row.gold_reserves, 't', 0, "Official Gold Bullion Reserves in Tonnes. Source: World Gold Council.")}
                                    {renderCell(row.debt_gold_ratio, 'x', 1, "Ratio of Total Debt to Gold Reserves (valued at current spot). Measures how many ounces of gold are needed to back the debt. Higher = Danger.")}

                                    <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                            <Typography variant="caption" sx={{
                                                fontSize: '0.6rem',
                                                fontWeight: 800,
                                                color: getStalenessColor(row.staleness),
                                                textTransform: 'uppercase'
                                            }}>
                                                {row.staleness.replace('_', ' ')}
                                            </Typography>
                                            <Box sx={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: '50%',
                                                bgcolor: getStalenessColor(row.staleness)
                                            }} />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

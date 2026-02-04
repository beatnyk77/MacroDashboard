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
    const [isExpanded, setIsExpanded] = React.useState(false);

    const formatValue = (val: number, decimals: number = 2) => {
        if (val === 0) return '-';
        return val.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };


    const renderCell = (value: number, suffix: string = '', decimals: number = 2, tooltip?: string) => (
        <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontFamily: 'monospace' }}>
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

    const visibleData = data ? (isExpanded ? data : data.slice(0, 5)) : [];

    return (
        <Box id="major-economies-section" sx={{ mb: 6 }}>
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
                                Inv. % GDP
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                Dependency Ratio
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
                                    {Array.from({ length: 9 }).map((_, j) => (
                                        <TableCell key={j}><Skeleton variant="text" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            visibleData.map((row: MajorEconomyRow) => (
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

                                    {/* GFCF Column */}
                                    <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <Typography variant="body2" sx={{
                                                    fontWeight: 600,
                                                    fontFamily: 'monospace',
                                                    color: row.gfcf_pct > 25 ? theme.palette.success.main : row.gfcf_pct < 20 ? theme.palette.error.main : 'text.primary'
                                                }}>
                                                    {formatValue(row.gfcf_pct, 1)}%
                                                </Typography>
                                                {row.private_gfcf_pct && (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                                        Pvt: {formatValue(row.private_gfcf_pct, 1)}%
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Tooltip title={
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Gross Fixed Capital Formation % GDP</Typography>
                                                    <Typography variant="caption" display="block">Investment intensity. {'>'}25% suggests strong future growth capacity. {'<'}20% warns of consumption dominance/stagnation.</Typography>
                                                    {row.private_gfcf_pct && <Typography variant="caption" display="block" sx={{ mt: 1 }}>US Private Investment: {row.private_gfcf_pct}% (Declining share may indicate fiscal crowding out)</Typography>}
                                                </Box>
                                            } arrow placement="top">
                                                <Box component="span" sx={{ cursor: 'help', opacity: 0.3, display: 'flex' }}>
                                                    <Info size={12} />
                                                </Box>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>

                                    {renderCell(row.dependency_ratio, '%', 1, "Old-age dependency ratio (% of working-age population). Higher ratio → fiscal drag & lower long-term growth potential. Source: World Bank.")}

                                    <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                            <Typography variant="caption" sx={{
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                color: 'text.disabled',
                                                textTransform: 'uppercase',
                                                opacity: 0.5
                                            }}>
                                                {row.staleness === 'fresh' ? 'Updated' : row.staleness.replace(/_/g, ' ')}
                                            </Typography>
                                            <Box sx={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: '50%',
                                                bgcolor: row.staleness === 'fresh' ? 'primary.main' : 'text.disabled',
                                                opacity: row.staleness === 'fresh' ? 0.8 : 0.3
                                            }} />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {data && data.length > 5 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography
                        variant="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        sx={{
                            cursor: 'pointer',
                            color: 'primary.main',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            '&:hover': { color: 'primary.light', textDecoration: 'underline' }
                        }}
                    >
                        {isExpanded ? '▲ Show Less' : `▼ View Full Table (${data.length} Countries)`}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

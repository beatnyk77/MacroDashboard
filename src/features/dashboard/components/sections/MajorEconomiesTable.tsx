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
    LinearProgress,
    Stack
} from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { useMajorEconomies, MajorEconomyRow } from '@/hooks/useMajorEconomies';

const SparkBar: React.FC<{ value: number, color: string, max?: number, suffix?: string }> = ({ value, color, max = 10, suffix = '%' }) => (
    <Box sx={{ width: '100%', minWidth: 60 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 900, fontFamily: 'monospace' }}>
                {value > 0 ? '+' : ''}{value.toFixed(1)}{suffix}
            </Typography>
        </Box>
        <LinearProgress
            variant="determinate"
            value={Math.min(100, (Math.abs(value) / max) * 100)}
            sx={{
                height: 4,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.05)',
                '& .MuiLinearProgress-bar': {
                    bgcolor: color,
                    borderRadius: 1
                }
            }}
        />
    </Box>
);

const PolicyDot: React.FC<{ rate: number }> = ({ rate }) => {
    const getColor = () => {
        if (rate > 5) return '#ef4444'; // Restrictive
        if (rate > 3) return '#f59e0b'; // Neutral+
        if (rate > 0) return '#10b981'; // Accommodative
        return '#3b82f6'; // Crisis/ZIRP
    };

    return (
        <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: getColor(),
                boxShadow: `0 0 8px ${getColor()}40`
            }} />
            <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {rate.toFixed(2)}%
            </Typography>
        </Stack>
    );
};

export const MajorEconomiesTable: React.FC = () => {
    const { data, isLoading } = useMajorEconomies();
    const [isExpanded, setIsExpanded] = React.useState(false);

    const formatValue = (val: number, decimals: number = 2) => {
        if (val === 0) return '-';
        return val.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    const visibleData = data ? (isExpanded ? data : data.slice(0, 6)) : [];

    return (
        <Box id="major-economies-section" sx={{ mb: 6 }}>
            <SectionHeader
                title="Sovereign Health Matrix"
                subtitle="Comparative fundamentals across G20 anchors (Jan 2026)"
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
                            <TableCell sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                Country
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                GDP (Nom)
                            </TableCell>
                            <TableCell sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                Real Growth
                            </TableCell>
                            <TableCell sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                CPI Inflation
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                Policy Rate
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                Debt/Gold
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                Investment
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                Health
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton variant="text" /></TableCell>
                                    <TableCell><Skeleton variant="text" /></TableCell>
                                    <TableCell><Skeleton variant="rectangular" height={20} /></TableCell>
                                    <TableCell><Skeleton variant="rectangular" height={20} /></TableCell>
                                    <TableCell><Skeleton variant="text" /></TableCell>
                                    <TableCell><Skeleton variant="text" /></TableCell>
                                    <TableCell><Skeleton variant="text" /></TableCell>
                                    <TableCell><Skeleton variant="text" /></TableCell>
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
                                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography sx={{ fontSize: '1rem' }}>{row.flag}</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary', fontSize: '0.75rem' }}>
                                                {row.code}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            ${formatValue(row.gdp_nominal, 1)}T
                                        </Typography>
                                    </TableCell>

                                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.03)', width: 100 }}>
                                        <SparkBar
                                            value={row.growth}
                                            color={row.growth > 3 ? '#10b981' : (row.growth > 0 ? '#3b82f6' : '#ef4444')}
                                            max={8}
                                        />
                                    </TableCell>

                                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.03)', width: 100 }}>
                                        <SparkBar
                                            value={row.cpi}
                                            color={row.cpi > 5 ? '#ef4444' : (row.cpi > 3 ? '#f59e0b' : '#10b981')}
                                            max={12}
                                        />
                                    </TableCell>

                                    <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <PolicyDot rate={row.policy_rate} />
                                        </Box>
                                    </TableCell>

                                    <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 800,
                                            fontFamily: 'monospace',
                                            fontSize: '0.75rem',
                                            color: row.debt_gold_ratio > 200 ? 'error.main' : (row.debt_gold_ratio > 100 ? 'warning.main' : 'success.main')
                                        }}>
                                            {row.debt_gold_ratio.toFixed(1)}x
                                        </Typography>
                                    </TableCell>

                                    <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 700,
                                            fontFamily: 'monospace',
                                            fontSize: '0.75rem',
                                            color: row.gfcf_pct > 25 ? 'success.main' : (row.gfcf_pct < 20 ? 'error.main' : 'text.primary')
                                        }}>
                                            {row.gfcf_pct.toFixed(1)}%
                                        </Typography>
                                    </TableCell>

                                    <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                            <Tooltip title={row.staleness === 'fresh' ? 'Data is fresh' : `Stale since: ${row.staleness}`}>
                                                <Box sx={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: '50%',
                                                    bgcolor: row.staleness === 'fresh' ? '#10b981' : '#f59e0b',
                                                    boxShadow: row.staleness === 'fresh' ? '0 0 6px #10b98150' : 'none'
                                                }} />
                                            </Tooltip>
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', fontWeight: 700 }}>
                                                {row.growth > 0 && row.cpi < 5 ? 'STABLE' : 'STRESS'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {data && data.length > 6 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography
                        variant="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        sx={{
                            cursor: 'pointer',
                            color: 'primary.main',
                            fontWeight: 900,
                            letterSpacing: '0.05em',
                            fontSize: '0.7rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            '&:hover': { color: 'primary.light' }
                        }}
                    >
                        {isExpanded ? '▲ CONSOLIDATE' : `▼ EXPAND ALL (${data.length})`}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

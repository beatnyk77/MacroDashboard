import React, { useState } from 'react';
import {
    Box,
    Card,
    Typography,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Skeleton,
    useTheme,
    Alert,
    AlertTitle
} from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { useTreasuryHolders } from '@/hooks/useTreasuryHolders';
import { TreasuryHoldersChart } from '../charts/TreasuryHoldersChart';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatNumber';
import { IconButton, Tooltip } from '@mui/material';
import { Image as ImageIcon } from 'lucide-react';
import { exportSectionToPNG } from '@/utils/exportUtils';

const COUNTRY_FLAGS: Record<string, string> = {
    'Japan': '🇯🇵',
    'United Kingdom': '🇬🇧',
    'China, Mainland': '🇨🇳',
    'Belgium': '🇧🇪',
    'Luxembourg': '🇱🇺',
    'Canada': '🇨🇦',
    'Cayman Islands': '🇰🇾',
    'Switzerland': '🇨🇭',
    'Ireland': '🇮🇪',
    'Taiwan': '🇹🇼',
    'India': '🇮🇳',
    'Hong Kong': '🇭🇰',
    'Singapore': '🇸🇬',
    'Brazil': '🇧🇷',
    'Norway': '🇳🇴',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Israel': '🇮🇱',
    'Total Foreign': '🌐',
    'Grand Total': '🌐'
};

export const TreasuryHoldersSection: React.FC = () => {
    const theme = useTheme();
    const { data, isLoading, error } = useTreasuryHolders();
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

    if (isLoading) return <Skeleton variant="rectangular" height={600} sx={{ borderRadius: 2, mb: 6 }} />;

    if (error) return (
        <Alert severity="error" sx={{ mb: 6 }}>
            <AlertTitle>Error loading TIC Data</AlertTitle>
            Could not fetch Treasury Holdings data. Please try again later.
        </Alert>
    );

    if (!data || data.length === 0) return null;

    const latestDate = data[0].as_of_date;
    const latestHolders = data
        .filter(d => d.as_of_date === latestDate && d.country_name !== 'Total Foreign' && d.country_name !== 'Grand Total')
        .sort((a, b) => b.holdings_usd_bn - a.holdings_usd_bn);

    const totalForeign = data.find(d => d.as_of_date === latestDate && (d.country_name === 'Total Foreign' || d.country_name === 'Grand Total'));

    const renderTrendIcon = (change: number | null) => {
        if (change === null) return <Minus size={12} color={theme.palette.text.disabled} />;
        if (change > 0) return <TrendingUp size={12} color={theme.palette.success.main} />;
        if (change < 0) return <TrendingDown size={12} color={theme.palette.error.main} />;
        return <Minus size={12} color={theme.palette.text.disabled} />;
    };

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="Major Foreign Holders of U.S. Treasuries"
                subtitle="Tracking institutional demand and sovereign accumulation of U.S. government debt"
                exportId="treasury-holders-section"
            />

            <Grid container spacing={3}>
                {/* Visual Chart Area */}
                <Grid item xs={12}>
                    <Card id="treasury-chart-card" sx={{ p: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}>
                                    Historical Stacked Positions ($ BN)
                                </Typography>
                                {/* Top 3 Movers Badge */}
                                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                                    {latestHolders
                                        .filter(h => h.mom_pct_change !== null)
                                        .sort((a, b) => Math.abs(b.mom_pct_change!) - Math.abs(a.mom_pct_change!))
                                        .slice(0, 3)
                                        .map(mover => (
                                            <Box key={mover.country_name} sx={{
                                                bgcolor: 'rgba(255,255,255,0.03)',
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                border: '1px solid',
                                                borderColor: 'divider'
                                            }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700 }}>{COUNTRY_FLAGS[mover.country_name] || ''} {mover.country_name}</Typography>
                                                <Typography variant="caption" sx={{
                                                    fontWeight: 800,
                                                    color: (mover.mom_pct_change || 0) > 0 ? 'success.main' : 'error.main'
                                                }}>
                                                    {formatPercentage(mover.mom_pct_change, { showSign: true })}
                                                </Typography>
                                            </Box>
                                        ))}
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Tooltip title="Export Chart">
                                    <IconButton size="small" onClick={() => exportSectionToPNG('treasury-chart-card', 'Treasury_Holdings_Chart')}>
                                        <ImageIcon size={16} />
                                    </IconButton>
                                </Tooltip>
                                {totalForeign && (
                                    <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                                        <Typography variant="caption" color="text.secondary">Total Foreign Holdings</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatCurrency(totalForeign.holdings_usd_bn / 1000, { suffix: 'T', decimals: 2 })}</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                        <TreasuryHoldersChart data={data} />
                    </Card>
                </Grid>

                {/* Data Table Area */}
                <Grid item xs={12}>
                    <TableContainer sx={{
                        maxHeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'background.paper'
                    }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>Country / Holder</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: 'background.paper', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>Holdings ($BN)</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: 'background.paper', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>MoM %</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: 'background.paper', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>YoY %</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: 'background.paper', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>Share (%)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {latestHolders.map((holder) => (
                                    <TableRow
                                        key={holder.country_name}
                                        onMouseEnter={() => setHoveredCountry(holder.country_name)}
                                        onMouseLeave={() => setHoveredCountry(null)}
                                        sx={{
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                                            transition: 'background-color 0.2s',
                                            bgcolor: hoveredCountry === holder.country_name ? 'rgba(255,255,255,0.05)' : 'transparent'
                                        }}
                                    >
                                        <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Typography sx={{ fontSize: '1.1rem' }}>{COUNTRY_FLAGS[holder.country_name] || '🌐'}</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{holder.country_name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatCurrency(holder.holdings_usd_bn, { decimals: 0 })}</Typography>
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                                {renderTrendIcon(holder.mom_pct_change)}
                                                <Typography variant="caption" sx={{
                                                    fontWeight: 700,
                                                    color: (holder.mom_pct_change || 0) > 0 ? 'success.main' : (holder.mom_pct_change || 0) < 0 ? 'error.main' : 'text.disabled'
                                                }}>
                                                    {holder.mom_pct_change !== null ? formatPercentage(holder.mom_pct_change, { showSign: true, decimals: 2 }) : '—'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                                {holder.yoy_pct_change !== null ? formatPercentage(holder.yoy_pct_change, { showSign: true, decimals: 1 }) : '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'secondary.light' }}>
                                                {holder.pct_of_total_foreign ? formatPercentage(holder.pct_of_total_foreign, { decimals: 1 }) : '—'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>

            {/* Insight Note */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info size={14} color={theme.palette.text.disabled} />
                <Typography variant="caption" color="text.disabled">
                    Data source: U.S. Treasury International Capital (TIC). Monthly updates provided post-release (approx. 15th of month). Percentages based on total reported foreign holdings.
                </Typography>
            </Box>
        </Box>
    );
};

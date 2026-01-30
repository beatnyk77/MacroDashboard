import React from 'react';
import {
    Card,
    Box,
    Typography,
    Tooltip,
    Skeleton
} from '@mui/material';
import { Scale, Info } from 'lucide-react';
import { useUSDebtGoldBacking } from '@/hooks/useUSDebtGoldBacking';

export const USDebtGoldBackingCard: React.FC = () => {
    const { data, isLoading } = useUSDebtGoldBacking();

    if (isLoading) return <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />;
    if (!data) return null;

    // Dual Ratios: 
    // 1. Debt Coverage Ratio (Inverse) ~ 53x
    // 2. Implied Gold Price (Debt / Ounces) ~ $137k
    const debtCoverageRatio = data?.debt_to_gold_coverage_ratio || data?.debt_gold_ratio || 0;
    const impliedPrice = data?.implied_gold_price || 0;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <Card sx={{
            p: 3,
            height: '100%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}>
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Scale size={20} style={{ color: '#eab308' }} />
                        <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.1em', color: 'text.secondary' }}>
                            PAPER vs HARD MONEY
                        </Typography>
                    </Box>
                    <Tooltip title="US Total Public Debt vs Market Value of US Treasury Gold Reserves.">
                        <Info size={16} style={{ color: '#64748b', cursor: 'help' }} />
                    </Tooltip>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                        DEBT COVERAGE RATIO (INVERSE)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: 'error.main' }}>
                            {debtCoverageRatio.toFixed(1)}x
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Paper &gt; Gold
                        </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                        Multiple of Debt over Total Gold Value
                    </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: 'rgba(255,215,0,0.05)', borderRadius: 1, border: '1px solid rgba(255,215,0,0.1)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            ZERO DEFICIT PRICE
                        </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', fontFamily: 'monospace' }}>
                        {formatCurrency(impliedPrice)}
                        <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '4px' }}>/oz</span>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', mt: 0.5, display: 'block' }}>
                        Gold price required to back 100% of US Debt.
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
};

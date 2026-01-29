import React, { useState } from 'react';
import {
    Card,
    Box,
    Typography,
    Slider,
    Tooltip,
    useTheme,
    Skeleton,
    Divider
} from '@mui/material';
import { Database, History, TrendingUp } from 'lucide-react';
import { useUSDebtGoldBacking } from '@/hooks/useUSDebtGoldBacking';

const GOLD_SCENARIOS = [
    { value: 5000, label: '$5k' },
    { value: 10000, label: '$10k' },
    { value: 20000, label: '$20k' },
    { value: 50000, label: '$50k' }
];

export const USDebtGoldBackingCard: React.FC = () => {
    const theme = useTheme();
    const { data: backing, isLoading } = useUSDebtGoldBacking();
    const [scenarioPrice, setScenarioPrice] = useState<number | null>(null);

    if (isLoading) return <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />;
    if (!backing) return null;

    const currentPrice = backing.gold_price_usd;
    const activePrice = scenarioPrice || currentPrice;

    // Ratio = Debt / (Gold Ounces * Active Price)
    const ratio = backing.total_debt / (backing.gold_ounces * activePrice);

    const getStatusColor = (val: number) => {
        if (val > 10) return theme.palette.error.main;
        if (val >= 5) return theme.palette.warning.main;
        return theme.palette.success.main;
    };

    const statusColor = getStatusColor(ratio);

    // Percentage of gold value vs debt
    const backingPct = (1 / ratio) * 100;

    return (
        <Card
            sx={{
                p: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: statusColor,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: `0 0 30px ${statusColor}30`,
                    borderColor: statusColor
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp size={18} color={statusColor} />
                    <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.12em', color: 'text.secondary' }}>
                        US DEBT VS GOLD BACKING
                    </Typography>
                </Box>
                <Tooltip title="In 1971 pre-Nixon shock, ratio was ~1x. Current ratio measures how many ounces of gold are needed to back total debt at spot prices." arrow placement="top">
                    <Box component="span" sx={{ cursor: 'help', color: 'text.disabled' }}>
                        <History size={16} />
                    </Box>
                </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: statusColor, letterSpacing: '-0.02em' }}>
                        {ratio.toFixed(2)}x
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {scenarioPrice ? `Scenario at $${scenarioPrice.toLocaleString()}/oz` : `Spot at $${currentPrice.toLocaleString()}/oz`}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {backingPct.toFixed(2)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Backing Share
                    </Typography>
                </Box>
            </Box>

            {/* Inverted Progress Bar: Debt vs Gold Value */}
            <Box sx={{ width: '100%', height: 12, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, position: 'relative', mt: 1, overflow: 'hidden' }}>
                <Box
                    sx={{
                        width: `${Math.min(backingPct, 100)}%`,
                        height: '100%',
                        bgcolor: statusColor,
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: `0 0 10px ${statusColor}`
                    }}
                />
            </Box>

            <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                        GOLD PRICE SCENARIO ($/OZ)
                    </Typography>
                </Box>
                <Slider
                    size="small"
                    defaultValue={currentPrice}
                    min={2000}
                    max={50000}
                    step={500}
                    marks={GOLD_SCENARIOS}
                    onChange={(_, val) => setScenarioPrice(val as number)}
                    valueLabelDisplay="auto"
                    sx={{
                        color: statusColor,
                        '& .MuiSlider-thumb': {
                            width: 14,
                            height: 14,
                            transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                            '&:before': {
                                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
                            },
                        },
                        '& .MuiSlider-markLabel': {
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            color: 'text.disabled'
                        },
                        '& .MuiSlider-track': {
                            height: 4,
                        },
                        '& .MuiSlider-rail': {
                            height: 4,
                            bgcolor: 'rgba(255,255,255,0.1)'
                        }
                    }}
                />
            </Box>

            <Divider sx={{ my: 1, opacity: 0.1 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.6 }}>
                <Database size={12} />
                <Tooltip
                    title="Methodology: Debt / (8,133.5 Tonnes * 32,150.75 oz/t * price). Sources: FiscalData (Total Debt), Treasury (Gold Reserves), Yahoo Finance (Gold Price)."
                    arrow
                >
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, cursor: 'help' }}>
                        FiscalData • Treasury • yfinance
                    </Typography>
                </Tooltip>
            </Box>
        </Card>
    );
};

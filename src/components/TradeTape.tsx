import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSmartMoneyTradeTape } from '@/hooks/useSmartMoneyTradeTape';

const TradeTapeItem: React.FC<{ trade: any }> = ({ trade }) => {
    const isBuy = trade.trade_type === 'BUY' || trade.direction === 'ACCUMULATE' || trade.delta_pct > 0;
    const isSell = trade.trade_type === 'SELL' || trade.direction === 'DISTRIBUTE' || trade.delta_pct < 0;

    let color = '#22d3ee'; // cyan neutral
    if (isBuy) color = '#0df259'; // green
    if (isSell) color = '#f87171'; // red

    // Truncate fund name to 12 chars
    const fundName = trade.fund_name.length > 12 ? trade.fund_name.slice(0, 12) + '…' : trade.fund_name;
    // Ticker: up to 5 chars
    const ticker = trade.ticker ? (trade.ticker.length > 5 ? trade.ticker.slice(0, 5) + '…' : trade.ticker) : trade.cusip.slice(-4);
    // Sector: short 3-4 chars if needed
    const sectorShort = trade.sector ? (trade.sector.length > 4 ? trade.sector.slice(0, 4) : trade.sector) : '';

    const ArrowIcon = isBuy ? ArrowUpRight : isSell ? ArrowDownRight : Minus;

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                px: 3,
                py: 1.5,
                mx: 1.5,
                bgcolor: 'rgba(15, 23, 42, 0.4)',
                border: `1px solid ${color}40`,
                borderRadius: 2,
                whiteSpace: 'nowrap',
                flexShrink: 0
            }}
        >
            <ArrowIcon size={16} color={color} strokeWidth={2.5} />
            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 800, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {fundName}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.8rem' }}>
                {ticker}
            </Typography>
            {sectorShort && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.05)', px: 0.5, borderRadius: 0.5 }}>
                    {sectorShort}
                </Typography>
            )}
            <Typography variant="body2" sx={{ color, fontWeight: 900, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {trade.delta_pct > 0 ? '+' : ''}{trade.delta_pct.toFixed(1)}%
            </Typography>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: color + '25',
                    border: `1px solid ${color}60`,
                }}
            >
                <Typography variant="caption" sx={{ color, fontWeight: 900, fontSize: '0.7rem' }}>
                    C{trade.conviction_score}
                </Typography>
            </Box>
        </Box>
    );
};

const TradeTape: React.FC = () => {
    const { recentTrades } = useSmartMoneyTradeTape();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md')); // <1024px

    if (recentTrades.length === 0) {
        return (
            <Box
                sx={{
                    py: 2,
                    textAlign: 'center',
                    bgcolor: 'rgba(15,23,42,0.4)',
                    borderRadius: 1,
                    border: '1px dashed rgba(255,255,255,0.1)',
                    mx: 1
                }}
            >
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    No recent inferred trades. Ingestion may be pending.
                </Typography>
            </Box>
        );
    }

    // For marquee, duplicate array for seamless loop
    const displayTrades = isMobile ? recentTrades : [...recentTrades, ...recentTrades];

    if (isMobile) {
        // Mobile: horizontal scroll static row
        return (
            <Box sx={{ overflowX: 'auto', py: 1 }}>
                <Box
                    sx={{
                        display: 'flex',
                        width: 'max-content',
                        mx: 1
                    }}
                >
                    {recentTrades.map((trade, idx) => (
                        <TradeTapeItem key={`${trade.cik}-${trade.ticker}-${idx}`} trade={trade} />
                    ))}
                </Box>
            </Box>
        );
    }

    // Desktop: infinite marquee
    return (
        <Box
            sx={{
                overflow: 'hidden',
                py: 2,
                maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
            }}
        >
            <motion.div
                style={{ display: 'flex', width: 'max-content' }}
                animate={{ x: [0, -(displayTrades.length * 260)] }} // approximate width per item
                transition={{
                    duration: 35, // seconds per full loop
                    ease: 'linear',
                    repeat: Infinity,
                    repeatType: 'loop'
                }}
            >
                {displayTrades.map((trade, idx) => (
                    <TradeTapeItem key={`${trade.cik}-${trade.ticker}-${idx}`} trade={trade} />
                ))}
            </motion.div>
        </Box>
    );
};

export default TradeTape;

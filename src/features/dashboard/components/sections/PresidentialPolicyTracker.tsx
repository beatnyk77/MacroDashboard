import React, { useState } from 'react';
import { Box, Typography, Card, Tooltip, Chip, LinearProgress, IconButton, Collapse } from '@mui/material';
import { Flag, ShieldAlert, Zap, Info, Target, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { usePresidentialPolicies } from '@/hooks/usePresidentialPolicies';

// Mock asset impact data - in production this would come from the database
interface AssetImpact {
    symbol: string;
    change: number;
    direction: 'up' | 'down';
}

const MOCK_ASSET_IMPACTS: Record<string, AssetImpact[]> = {
    'Proposed Corporate Tax Cut 2.0': [
        { symbol: 'SPX', change: 1.8, direction: 'up' },
        { symbol: 'DXY', change: -0.5, direction: 'down' }
    ],
    'Tariff Phase 1': [
        { symbol: 'DXY', change: 2.3, direction: 'up' },
        { symbol: 'SPX', change: -1.1, direction: 'down' },
        { symbol: '10Y', change: 0.15, direction: 'up' }
    ]
};

const NARRATIVE_TAGS: Record<string, string> = {
    'Proposed Corporate Tax Cut 2.0': 'Risk-on fiscal impulse',
    'Tariff Phase 1': 'Trade frictions, dollar strength'
};

const MACRO_ANALOGUES: Record<string, string> = {
    'Tariff Phase 1': '2018 Tariff Phase correlates with DXY +3.2% (90D)',
    'Proposed Corporate Tax Cut 2.0': '2017 Tax Cuts Act: SPX +8.5% (6M post-passage)'
};

export const PresidentialPolicyTracker: React.FC = () => {
    const { data: policies, isLoading } = usePresidentialPolicies();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (isLoading || !policies || policies.length === 0) return null;

    const toggleExpanded = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <Card sx={{
            p: 4,
            height: '100%',
            bgcolor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                bgcolor: 'error.main',
                opacity: 0.8
            }
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Target size={18} color="#ef4444" />
                        <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: '0.2em', color: 'text.secondary', fontSize: '0.75rem' }}>
                            ADMINISTRATION INTELLIGENCE
                        </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
                        Policy Impact Monitor: Trump 2.0
                    </Typography>
                </Box>
                <Chip
                    label="H-S CONFIDENCE"
                    size="small"
                    sx={{
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                        color: 'error.light',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {policies.slice(0, 4).map((policy, idx) => {
                    const absScore = Math.abs(policy.policy_score);
                    const isPositive = policy.policy_score > 0;
                    const assetImpacts = MOCK_ASSET_IMPACTS[policy.event_name] || [];
                    const narrativeTag = NARRATIVE_TAGS[policy.event_name];
                    const macroAnalogue = MACRO_ANALOGUES[policy.event_name];
                    const isExpanded = expandedId !== null && expandedId === policy.id;

                    return (
                        <Box key={policy.id} sx={{
                            position: 'relative',
                            pb: 2,
                            borderBottom: idx < policies.slice(0, 4).length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isPositive ? <Zap size={14} color="#f59e0b" /> : <ShieldAlert size={14} color="#ef4444" />}
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: isPositive ? 'warning.light' : 'error.light', letterSpacing: '0.05em' }}>
                                        {policy.category.toUpperCase()}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700 }}>
                                    {new Date(policy.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Typography>
                            </Box>

                            <Typography variant="body2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary', lineHeight: 1.3 }}>
                                {policy.event_name}
                            </Typography>

                            {/* Narrative Tag */}
                            {narrativeTag && (
                                <Chip
                                    label={narrativeTag}
                                    size="small"
                                    sx={{
                                        mb: 1.5,
                                        height: '20px',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                                        color: 'primary.light',
                                        border: '1px solid rgba(59, 130, 246, 0.2)'
                                    }}
                                />
                            )}

                            {/* Affected Assets */}
                            {assetImpacts.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    {assetImpacts.map((asset, assetIdx) => (
                                        <Chip
                                            key={assetIdx}
                                            icon={asset.direction === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            label={`${asset.symbol} ${asset.change > 0 ? '+' : ''}${asset.change}%`}
                                            size="small"
                                            sx={{
                                                height: '24px',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                bgcolor: asset.direction === 'up' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: asset.direction === 'up' ? 'success.light' : 'error.light',
                                                border: '1px solid',
                                                borderColor: asset.direction === 'up' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                                                '& .MuiChip-icon': {
                                                    color: asset.direction === 'up' ? 'success.light' : 'error.light',
                                                    ml: 0.5
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}

                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', fontWeight: 700 }}>
                                        MARKET IMPACT MAGNITUDE
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 900, color: isPositive ? 'success.light' : 'error.light' }}>
                                        {absScore * 10}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={absScore * 10}
                                    sx={{
                                        height: 4,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(255,255,255,0.05)',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: isPositive ? 'success.main' : 'error.main'
                                        }
                                    }}
                                />
                            </Box>

                            {/* Macro Analogue Badge */}
                            {macroAnalogue && (
                                <Box>
                                    <Box
                                        onClick={() => toggleExpanded(policy.id)}
                                        sx={{
                                            mt: 1.5,
                                            px: 1.5,
                                            py: 1,
                                            bgcolor: 'rgba(234, 179, 8, 0.05)',
                                            borderRadius: 1,
                                            border: '1px solid rgba(234, 179, 8, 0.2)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                bgcolor: 'rgba(234, 179, 8, 0.1)',
                                                borderColor: 'rgba(234, 179, 8, 0.4)'
                                            }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <Flag size={10} color="#eab308" />
                                                <Typography variant="caption" sx={{ color: 'warning.light', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                                                    MACRO ANALOGUE
                                                </Typography>
                                            </Box>
                                            <IconButton size="small" sx={{ p: 0 }}>
                                                <ChevronDown
                                                    size={14}
                                                    color="#eab308"
                                                    style={{
                                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s'
                                                    }}
                                                />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    <Collapse in={isExpanded}>
                                        <Box sx={{
                                            mt: 1,
                                            px: 1.5,
                                            py: 1.5,
                                            bgcolor: 'rgba(15, 23, 42, 0.6)',
                                            borderRadius: 1,
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <Typography variant="caption" sx={{ color: 'warning.light', fontSize: '0.7rem', fontWeight: 600, lineHeight: 1.5 }}>
                                                {macroAnalogue}
                                            </Typography>
                                        </Box>
                                    </Collapse>
                                </Box>
                            )}

                            <Tooltip title={policy.impact_notes} arrow placement="top">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5, cursor: 'help' }}>
                                    <Info size={12} color="#64748b" />
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', fontWeight: 600 }}>
                                        Institutional Impact Attribution...
                                    </Typography>
                                </Box>
                            </Tooltip>
                        </Box>
                    );
                })}
            </Box>

            <Box sx={{
                mt: 'auto',
                pt: 2,
                px: 2,
                py: 1.5,
                bgcolor: 'rgba(239, 68, 68, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(239, 68, 68, 0.1)'
            }}>
                <Typography variant="caption" sx={{ color: 'error.light', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Flag size={10} /> Live policy tracking with historical correlation analysis
                </Typography>
            </Box>
        </Card>
    );
};

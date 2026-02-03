import React from 'react';
import { Box, Card, Typography, Link, Stack, Chip, Skeleton, useTheme } from '@mui/material';
import { Newspaper, Clock } from 'lucide-react';
import { useMacroHeadlines } from '@/hooks/useMacroHeadlines';

const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

export const LatestMacroHeadlinesCard: React.FC = () => {
    const theme = useTheme();
    const { data: headlines, isLoading, error } = useMacroHeadlines();

    if (isLoading) {
        return (
            <Card sx={{
                p: 3,
                bgcolor: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                height: '100%'
            }}>
                <Stack spacing={2}>
                    <Skeleton variant="text" width="60%" height={30} />
                    {[...Array(5)].map((_, i) => (
                        <Box key={i} sx={{ py: 1 }}>
                            <Skeleton variant="text" width="90%" />
                            <Skeleton variant="text" width="40%" height={15} />
                        </Box>
                    ))}
                </Stack>
            </Card>
        );
    }

    if (error || !headlines || headlines.length === 0) {
        return null;
    }

    return (
        <Card sx={{
            p: 3,
            bgcolor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '2px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
            }
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'rgba(37, 99, 235, 0.1)',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Newspaper size={20} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em', color: 'text.primary' }}>
                    Latest Macro Headlines
                </Typography>
            </Box>

            <Stack spacing={2.5}>
                {headlines.slice(0, 8).map((headline) => (
                    <Box key={headline.id}>
                        <Link
                            href={headline.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="none"
                            sx={{
                                display: 'block',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    transform: 'translateX(4px)',
                                    '& .headline-title': { color: 'primary.main' }
                                }
                            }}
                        >
                            <Typography
                                className="headline-title"
                                variant="body1"
                                sx={{
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    lineHeight: 1.4,
                                    fontSize: '0.925rem',
                                    mb: 0.75,
                                    transition: 'color 0.2s',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}
                            >
                                {headline.title}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="caption" sx={{
                                    fontWeight: 700,
                                    color: 'primary.light',
                                    textTransform: 'uppercase',
                                    fontSize: '0.65rem',
                                    letterSpacing: '0.05em'
                                }}>
                                    {headline.source}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
                                    <Clock size={12} />
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        {timeAgo(new Date(headline.published_at))}
                                    </Typography>
                                </Box>
                            </Box>
                        </Link>
                    </Box>
                ))}
            </Stack>

            {headlines.length > 0 && (
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'rgba(255,255,255,0.05)' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, mr: 1, alignSelf: 'center' }}>
                            FILTERS:
                        </Typography>
                        {['Liquidity', 'Gold', 'Treasury', 'BRICS', 'China', 'Fed'].map((kw) => (
                            <Chip
                                key={kw}
                                label={kw}
                                size="small"
                                sx={{
                                    height: 18,
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    color: 'text.secondary',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </Card>
    );
};

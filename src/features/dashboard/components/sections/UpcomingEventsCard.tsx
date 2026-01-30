import React from 'react';
import { Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Skeleton, Tooltip } from '@mui/material';
import { Calendar, Info } from 'lucide-react';
import { useMacroEvents, MacroEvent } from '@/hooks/useMacroEvents';
import { HoverDetail } from '@/components/HoverDetail';
import { useViewContext } from '@/context/ViewContext';

export const UpcomingEventsCard: React.FC = () => {
    const { data: events, isLoading } = useMacroEvents();
    const { isInstitutionalView } = useViewContext();

    if (isLoading) return <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />;
    if (!events || events.length === 0) return null;

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.event_date) >= now);
    const pastEvents = events.filter(e => new Date(e.event_date) < now).reverse().slice(0, 5); // Last 5 past events

    const renderRow = (event: MacroEvent) => {
        const isPast = new Date(event.event_date) < now;
        const surpriseVal = event.surprise ? parseFloat(event.surprise) : 0;
        const surpriseColor = surpriseVal > 0 ? '#10b981' : (surpriseVal < 0 ? '#f43f5e' : 'transparent');
        const hasSurprise = event.surprise && event.surprise !== '0';

        return (
            <HoverDetail
                key={event.id}
                title={event.event_name}
                subtitle={`${new Date(event.event_date).toLocaleString()} | ${event.country}`}
                detailContent={{
                    description: `High-impact macro release for ${event.country}. Tracking ${event.event_name} allows institutional players to gauge regime shifts and liquidity cycles.`,
                    stats: [
                        { label: 'Forecast', value: event.forecast || 'N/A' },
                        { label: 'Previous', value: event.previous || 'N/A' },
                        { label: 'Impact', value: (event.impact_level || 'Medium').toUpperCase(), color: event.impact_level === 'High' ? '#f43f5e' : '#eab308' }
                    ],
                    methodology: "Surprise delta is calculated as Actual - Forecast. Positive values typically indicate economic outperformance relative to consensus.",
                    source: event.source_url
                }}
            >
                <TableRow sx={{
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)', cursor: 'pointer' },
                    opacity: isPast ? 0.7 : 1
                }}>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', pl: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.7rem', color: isPast ? 'text.disabled' : 'text.primary' }}>
                            {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
                            {new Date(event.event_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.65rem', color: 'secondary.light' }}>
                                {event.country}
                            </Typography>
                        </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.75rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {event.event_name}
                        </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <Box
                            sx={{
                                width: 8,
                                height: 16,
                                borderRadius: 0.5,
                                bgcolor: event.impact_level === 'High' ? '#ef4444' : (event.impact_level === 'Medium' ? '#f59e0b' : '#94a3b8')
                            }}
                        />
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{event.forecast || '-'}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{event.previous || '-'}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: event.actual ? 'text.primary' : 'text.disabled' }}>
                            {event.actual || 'TBD'}
                        </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', pr: 0, textAlign: 'right' }}>
                        {hasSurprise ? (
                            <Chip
                                label={event.surprise}
                                size="small"
                                sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    fontWeight: 900,
                                    bgcolor: `${surpriseColor}20`, // 20% opacity background
                                    color: surpriseColor,
                                    border: `1px solid ${surpriseColor}40`,
                                    borderRadius: 0.5
                                }}
                            />
                        ) : (
                            isInstitutionalView && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.3 }}>
                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 900, color: event.impact_level === 'High' ? 'error.main' : 'warning.main' }}>
                                        {event.impact_level === 'High' ? '82%' : '45%'} PROB
                                    </Typography>
                                    <Box sx={{ width: 40, height: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                                        <Box sx={{ width: event.impact_level === 'High' ? '82%' : '45%', height: '100%', bgcolor: event.impact_level === 'High' ? 'error.main' : 'warning.main' }} />
                                    </Box>
                                </Box>
                            )
                        )}
                    </TableCell>
                </TableRow>
            </HoverDetail>
        );
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
            gap: 2
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={18} color="#94a3b8" />
                    <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.1em', color: 'text.secondary' }}>
                        MACRO CALENDAR
                    </Typography>
                </Box>
                <Tooltip title="Institutional data seeded for 2026. Weekly refresh via cron.">
                    <Info size={14} color="#64748b" style={{ cursor: 'help' }} />
                </Tooltip>
            </Box>

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', border: 'none', pl: 0 }}>DATE/TIME</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', border: 'none' }}>CUR</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', border: 'none' }}>EVENT</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', border: 'none' }}>IMP</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', border: 'none', textAlign: 'right' }}>FORECAST</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', border: 'none', textAlign: 'right' }}>PREV</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', border: 'none', textAlign: 'right' }}>ACTUAL</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', border: 'none', pr: 0, textAlign: 'right' }}>
                                {isInstitutionalView ? 'VOL PROB' : 'SURP'}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {upcomingEvents.length > 0 && upcomingEvents.slice(0, 8).map(renderRow)}

                        {pastEvents.length > 0 && (
                            <>
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ border: 'none', py: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.05)' }} />
                                            <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: 'text.disabled', letterSpacing: '0.1em' }}>RECENT RELEASES</Typography>
                                            <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.05)' }} />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                {pastEvents.map(renderRow)}
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>
    );
};

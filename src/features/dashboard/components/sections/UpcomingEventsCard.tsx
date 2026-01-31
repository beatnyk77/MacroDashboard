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
        const hasSurprise = event.surprise && event.surprise !== '0' && event.surprise !== '-';

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
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', pl: 0, width: 80 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.65rem', color: isPast ? 'text.disabled' : 'text.primary' }}>
                            {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', fontFamily: 'monospace' }}>
                            {new Date(event.event_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', width: 60 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.65rem', color: 'secondary.light' }}>
                            {event.country}
                        </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', minWidth: 120 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {event.event_name}
                        </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', width: 40 }}>
                        <Box
                            sx={{
                                width: 8,
                                height: 16,
                                borderRadius: 0.5,
                                bgcolor: event.impact_level === 'High' ? '#ef4444' : (event.impact_level === 'Medium' ? '#f59e0b' : '#94a3b8')
                            }}
                        />
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right', width: 70 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontFamily: 'monospace' }}>{event.forecast || '-'}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right', width: 70 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontFamily: 'monospace' }}>{event.previous || '-'}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right', width: 70 }}>
                        {event.actual ? (
                            <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.primary', fontFamily: 'monospace' }}>
                                {event.actual}
                            </Typography>
                        ) : (
                            <Chip label="PENDING" size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 900, bgcolor: 'rgba(255,255,255,0.05)', color: 'text.disabled' }} />
                        )}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', pr: 0, textAlign: 'right', width: 80 }}>
                        {hasSurprise ? (
                            <Chip
                                label={`${surpriseVal > 0 ? '+' : ''}${event.surprise}`}
                                size="small"
                                sx={{
                                    height: 18,
                                    fontSize: '0.6rem',
                                    fontWeight: 900,
                                    bgcolor: `${surpriseColor}20`,
                                    color: surpriseColor,
                                    border: `1px solid ${surpriseColor}40`,
                                    borderRadius: 0.5,
                                    fontFamily: 'monospace'
                                }}
                            />
                        ) : (
                            isInstitutionalView && !isPast && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.3 }}>
                                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 900, color: 'text.disabled' }}>
                                        VOL PROB
                                    </Typography>
                                    <Box sx={{ width: 40, height: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                                        <Box sx={{ width: event.impact_level === 'High' ? '82%' : '45%', height: '100%', bgcolor: 'primary.main', opacity: 0.5 }} />
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
            gap: 2,
            overflow: 'hidden'
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

            <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 700 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', pl: 0, width: '12%' }}>DATE / TIME</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', width: '8%' }}>COUNTRY</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', width: '30%' }}>EVENT</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', width: '8%' }}>IMPACT</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', textAlign: 'right', width: '10%' }}>FORECAST</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', textAlign: 'right', width: '10%' }}>PREVIOUS</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', textAlign: 'right', width: '10%' }}>ACTUAL</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', pr: 0, textAlign: 'right', width: '12%' }}>
                                {isInstitutionalView ? 'VOL PROB' : 'SURPRISE'}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {upcomingEvents.length > 0 && upcomingEvents.slice(0, 8).map(renderRow)}

                        {pastEvents.length > 0 && (
                            <>
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ border: 'none', py: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.5 }}>
                                            <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                                            <Typography sx={{ fontSize: '0.5rem', fontWeight: 900, color: 'text.disabled', letterSpacing: '0.2em' }}>RECENT RELEASES</Typography>
                                            <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
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

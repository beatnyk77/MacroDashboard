import React from 'react';
import { Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Skeleton, Tooltip } from '@mui/material';
import { Calendar, Info } from 'lucide-react';
import { useMacroEvents, MacroEvent } from '@/hooks/useMacroEvents';
import { HoverDetail } from '@/components/HoverDetail';
// import { useViewContext } from '@/context/ViewContext';

export const UpcomingEventsCard: React.FC = () => {
    const { data: events, isLoading } = useMacroEvents();
    // const { isInstitutionalView } = useViewContext();

    if (isLoading) return <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />;
    if (!events || events.length === 0) return null;

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.event_date) >= now);
    const pastEvents = events.filter(e => new Date(e.event_date) < now).reverse().slice(0, 5); // Last 5 past events

    const renderRow = (event: MacroEvent) => {
        const isPast = new Date(event.event_date) < now;
        // const surpriseVal = event.surprise ? parseFloat(event.surprise) : 0;

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
                <TableRow
                    onClick={() => {
                        gtag('event', 'click_calendar_event', {
                            event_name: event.event_name,
                            country: event.country,
                            impact_level: event.impact_level
                        });
                    }}
                    sx={{
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.02)', cursor: 'pointer' },
                        opacity: isPast ? 0.7 : 1
                    }}
                >
                    <TableCell sx={{ py: 1.5, pl: 0, width: '130px', whiteSpace: 'nowrap' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.65rem', color: isPast ? 'text.disabled' : 'text.primary' }}>
                            {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', fontFamily: 'monospace' }}>
                            {new Date(event.event_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, width: '80px' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.65rem', color: 'secondary.light' }}>
                            {event.country}
                        </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {event.event_name}
                        </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, width: '70px' }}>
                        <Box
                            sx={{
                                width: 8,
                                height: 16,
                                borderRadius: 0.5,
                                bgcolor: event.impact_level === 'High' ? '#ef4444' : (event.impact_level === 'Medium' ? '#f59e0b' : '#94a3b8')
                            }}
                        />
                    </TableCell>
                    <TableCell sx={{ py: 1.5, textAlign: 'right', width: '90px' }}>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontFamily: 'monospace' }}>{event.forecast || '-'}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, textAlign: 'right', width: '90px' }}>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontFamily: 'monospace' }}>{event.previous || '-'}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, textAlign: 'right', width: '90px', pr: 0 }}>
                        {event.actual ? (
                            <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: 'text.primary', fontFamily: 'monospace' }}>
                                {event.actual}
                            </Typography>
                        ) : (
                            <Chip label="PENDING" size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 900, bgcolor: 'rgba(255,255,255,0.05)', color: 'text.disabled' }} />
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

            <TableContainer sx={{
                overflowX: 'auto',
                width: '100%',
                bgcolor: 'transparent',
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }
            }}>
                <Table size="small" sx={{
                    minWidth: 800,
                    tableLayout: 'fixed',
                    '& .MuiTableCell-root': {
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        px: 1
                    }
                }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', pl: 0, width: '130px' }}>DATE / TIME</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', width: '80px' }}>COUNTRY</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none' }}>EVENT</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', width: '70px' }}>IMPACT</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', textAlign: 'right', width: '90px' }}>FORECAST</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', textAlign: 'right', width: '90px' }}>PREVIOUS</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 800, fontSize: '0.6rem', border: 'none', textAlign: 'right', width: '90px', pr: 0 }}>ACTUAL</TableCell>
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

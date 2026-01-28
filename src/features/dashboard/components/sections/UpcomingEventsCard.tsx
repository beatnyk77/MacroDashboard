import React from 'react';
import { Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Skeleton } from '@mui/material';
import { Calendar } from 'lucide-react';
import { useMacroEvents } from '@/hooks/useMacroEvents';


export const UpcomingEventsCard: React.FC = () => {
    const { data: events, isLoading } = useMacroEvents();

    if (isLoading) return <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />;
    if (!events || events.length === 0) return null;
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calendar size={18} color="#94a3b8" />
                <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.1em', color: 'text.secondary' }}>
                    UPCOMING MACRO EVENTS
                </Typography>
            </Box>

            <TableContainer sx={{ mt: 1 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.65rem', border: 'none', pl: 0 }}>DATE</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.65rem', border: 'none' }}>EVENT</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.65rem', border: 'none' }}>CONSENSUS</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.65rem', border: 'none' }}>ACTUAL</TableCell>
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.65rem', border: 'none', pr: 0 }}>IMPACT</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {events.map((event, idx) => (
                            <TableRow key={idx}>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', pl: 0 }}>
                                    {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    {event.event_name}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'primary.light' }}>
                                    {event.consensus_value || '-'}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 900, fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: event.actual_value ? 'text.primary' : 'text.disabled' }}>
                                    {event.actual_value || 'TBD'}
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', pr: 0 }}>
                                    {event.actual_value ? (
                                        <Chip
                                            label="SURPRISE"
                                            size="small"
                                            sx={{
                                                height: 16,
                                                fontSize: '0.55rem',
                                                fontWeight: 900,
                                                bgcolor: 'success.main',
                                                color: 'white',
                                                borderRadius: 0.5
                                            }}
                                        />
                                    ) : (
                                        <Chip
                                            label={event.impact_level.toUpperCase()}
                                            size="small"
                                            sx={{
                                                height: 16,
                                                fontSize: '0.6rem',
                                                fontWeight: 900,
                                                bgcolor: event.impact_level === 'high' ? 'error.main' : 'warning.main',
                                                color: 'white',
                                                borderRadius: 0.5
                                            }}
                                        />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>
    );
};

import React from 'react';
import { Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { Calendar } from 'lucide-react';

interface MacroEvent {
    date: string;
    event: string;
    consensus: string;
    previous: string;
    impact: 'High' | 'Medium' | 'Low';
}

const UPCOMING_EVENTS: MacroEvent[] = [
    { date: 'Jan 28', event: 'FOMC Rate Decision', consensus: '3.50% - 3.75%', previous: '3.75%', impact: 'High' },
    { date: 'Feb 6', event: 'US Non-Farm Payrolls', consensus: '185K', previous: '206K', impact: 'High' },
    { date: 'Feb 11', event: 'US CPI (YoY)', consensus: '3.1%', previous: '3.2%', impact: 'High' },
    { date: 'Feb 13', event: 'US Retail Sales', consensus: '0.3%', previous: '0.4%', impact: 'Medium' },
    { date: 'Feb 26', event: 'US GDP (Q4 Final)', consensus: '2.5%', previous: '2.4%', impact: 'Medium' },
    { date: 'Mar 5', event: 'ECB Rate Decision', consensus: '2.75%', previous: '3.00%', impact: 'High' },
    { date: 'Mar 12', event: 'BoJ Policy Meeting', consensus: '0.25%', previous: '0.25%', impact: 'High' },
    { date: 'Mar 18', event: 'FOMC Rate Decision', consensus: '3.25% - 3.50%', previous: '3.50%', impact: 'High' },
];

export const UpcomingEventsCard: React.FC = () => {
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
                            <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.65rem', border: 'none', pr: 0 }}>IMPACT</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {UPCOMING_EVENTS.map((event, idx) => (
                            <TableRow key={idx}>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', pl: 0 }}>
                                    {event.date}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    {event.event}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'primary.light' }}>
                                    {event.consensus}
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', pr: 0 }}>
                                    <Chip
                                        label={event.impact}
                                        size="small"
                                        sx={{
                                            height: 16,
                                            fontSize: '0.6rem',
                                            fontWeight: 900,
                                            bgcolor: event.impact === 'High' ? 'error.main' : 'warning.main',
                                            color: 'white',
                                            borderRadius: 0.5
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>
    );
};

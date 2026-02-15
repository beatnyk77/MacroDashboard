import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Container, Typography, Box, List, ListItem, ListItemText, ListItemButton, Paper, Divider, Chip } from '@mui/material';
import { SEOManager } from '@/components/SEOManager';
import { Link } from 'react-router-dom';

interface DigestSummary {
    id: string;
    year_month: string;
    subject_line: string;
    generated_at: string;
}

export const RegimeDigestArchivePage: React.FC = () => {
    const [digests, setDigests] = useState<DigestSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDigests = async () => {
            const { data, error } = await supabase
                .from('monthly_regime_digests')
                .select('id, year_month, subject_line, generated_at')
                .order('year_month', { ascending: false });

            if (!error && data) {
                setDigests(data);
            }
            setLoading(false);
        };

        fetchDigests();
    }, []);

    const formatDate = (ym: string) => {
        const [y, m] = ym.split('-');
        return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    return (
        <>
            <SEOManager
                title="Macro Regime Digest Archive"
                description="Monthly institutional-grade macro intelligence reports on Global Liquidity, Debt/Gold, and Geopolitics."
            />
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Box mb={6} textAlign="center">
                    <Typography variant="h3" component="h1" gutterBottom className="font-display">
                        Macro Regime Digest
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Monthly institutional intelligence on Global Liquidity, Sovereign Stress, and De-Dollarization.
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    {loading ? (
                        <Box p={4} textAlign="center">Loading archives...</Box>
                    ) : digests.length === 0 ? (
                        <Box p={4} textAlign="center">No digests published yet.</Box>
                    ) : (
                        <List>
                            {digests.map((digest, index) => (
                                <React.Fragment key={digest.id}>
                                    {index > 0 && <Divider />}
                                    <ListItem disablePadding>
                                        <ListItemButton component={Link} to={`/regime-digest/${digest.year_month.replace('-', '/')}`} sx={{ py: 3 }}>
                                            <ListItemText
                                                primary={
                                                    <Box display="flex" alignItems="center" gap={2} mb={0.5}>
                                                        <Typography variant="h6" color="text.primary">
                                                            {formatDate(digest.year_month)}
                                                        </Typography>
                                                        {index === 0 && <Chip label="Latest" color="primary" size="small" />}
                                                    </Box>
                                                }
                                                secondary={digest.subject_line}
                                                secondaryTypographyProps={{ color: 'text.secondary' }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Paper>
            </Container>
        </>
    );
};

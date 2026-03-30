import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Container, Typography, Box, List, ListItem, ListItemButton, Paper, Divider, Chip, Skeleton, Stack } from '@mui/material';
import { SEOManager } from '@/components/SEOManager';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';

interface WeeklyNarrativeSummary {
    week_ending_date: string;
    description: string;
}

export const WeeklyNarrativeArchive: React.FC = () => {
    const [narratives, setNarratives] = useState<WeeklyNarrativeSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArchives = async () => {
            try {
                // Fetch unique week_ending_dates and a teaser (Regime Shift Summary snippet)
                const { data, error } = await supabase
                    .from('weekly_macro_snapshot')
                    .select('week_ending_date, narrative_snippet')
                    .eq('section_name', 'Regime Shift Summary')
                    .order('week_ending_date', { ascending: false });

                if (!error && data) {
                    const formatted = data.map(item => ({
                        week_ending_date: item.week_ending_date,
                        description: item.narrative_snippet
                    }));
                    setNarratives(formatted);
                }
            } catch (err) {
                console.error('Error fetching archives:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchArchives();
    }, []);

    return (
        <>
            <SEOManager
                title="Weekly Macro Narrative Archive"
                description="Browse past structural intelligence reports and weekly macro regime shifts."
            />
            <div className="min-h-screen bg-background pt-24 pb-32">
                <Container maxWidth="md">
                    <Box mb={10} textAlign="center">
                        <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} mb={3}>
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Calendar size={24} />
                            </div>
                            <Typography variant="overline" className="text-primary font-black tracking-uppercase">
                                INTELLIGENCE ARCHIVE
                            </Typography>
                        </Stack>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium tracking-heading text-foreground mb-6">
                            Weekly Macro Narratives
                        </h1>
                        <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
                            A historical record of structural regime shifts, sovereign debt dynamics, and global liquidity telemetry.
                        </p>
                    </Box>

                    <Paper
                        elevation={0}
                        className="bg-card/20 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {loading ? (
                            <Box p={6}>
                                <Stack spacing={4}>
                                    {[1, 2, 3].map(i => (
                                        <Box key={i}>
                                            <Skeleton variant="text" width="40%" height={32} />
                                            <Skeleton variant="rectangular" height={60} sx={{ mt: 2, borderRadius: 2 }} />
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        ) : narratives.length === 0 ? (
                            <Box p={12} textAlign="center">
                                <Typography color="text.secondary" className="italic">
                                    No weekly signals archived yet.
                                </Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {narratives.map((narrative, index) => (
                                    <React.Fragment key={narrative.week_ending_date}>
                                        <ListItem disablePadding>
                                            <ListItemButton
                                                component={Link}
                                                to={`/?week=${narrative.week_ending_date}#weekly-narrative`}
                                                className="py-10 px-8 md:px-12 hover:bg-white/[0.03] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                                            >
                                                <div className="flex-1">
                                                    <Box display="flex" alignItems="center" gap={3} mb={3}>
                                                        <Typography variant="h5" className="font-serif font-medium text-foreground group-hover:text-primary transition-colors">
                                                            {new Date(narrative.week_ending_date).toLocaleDateString(undefined, {
                                                                month: 'long',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </Typography>
                                                        {index === 0 && (
                                                            <Chip
                                                                label="LATEST"
                                                                size="small"
                                                                className="bg-primary/20 text-primary font-black text-xs tracking-uppercase border-none h-5"
                                                            />
                                                        )}
                                                    </Box>
                                                    <p className="text-base text-muted-foreground line-clamp-2 leading-relaxed max-w-2xl font-medium italic group-hover:text-foreground/80 transition-colors">
                                                        "{narrative.description}"
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1">
                                                    <span className="text-xs font-black uppercase tracking-uppercase hidden md:block">Read Digest</span>
                                                    <ChevronRight size={20} />
                                                </div>
                                            </ListItemButton>
                                        </ListItem>
                                        {index < narratives.length - 1 && (
                                            <Divider className="border-white/5 mx-8 md:mx-12" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>

                    <Box mt={10} textAlign="center">
                        <Link
                            to="/"
                            className="text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-uppercase"
                        >
                            ← Back to Dashboard
                        </Link>
                    </Box>
                </Container>
            </div>
        </>
    );
};

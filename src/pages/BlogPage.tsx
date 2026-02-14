import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, CardActionArea, Chip, Stack } from '@mui/material';
import { Link } from 'react-router-dom';
import { blogArticles } from '@/features/blog/blogData';
import { SEOManager } from '@/components/SEOManager';
import { Calendar, User } from 'lucide-react';

export const BlogPage: React.FC = () => {
    return (
        <Box sx={{ py: 4 }}>
            <SEOManager
                title="Intelligence Journal | Macro Research & Analysis"
                description="Institutional-grade macro research, de-dollarization trackers, and India real-economy analysis."
                keywords={['Macro Research', 'India Economy', 'De-dollarization', 'Gold Ratio', 'Institutional Intelligence']}
            />

            <Container maxWidth="lg">
                <Box sx={{ mb: 6, textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, tracking: '-0.02em' }}>
                        Intelligence <span style={{ color: '#3b82f6' }}>Journal</span>
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
                        Deep-dive analysis on the structural shifts reshaping the global monetary order and the physical economy.
                    </Typography>
                </Box>

                <Grid container spacing={4}>
                    {blogArticles.map((article) => (
                        <Grid item xs={12} md={6} key={article.id}>
                            <Card sx={{
                                height: '100%',
                                bgcolor: 'background.paper',
                                border: '1px solid rgba(255,255,255,0.05)',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    transform: 'translateY(-4px)',
                                    transition: 'all 0.3s ease'
                                }
                            }}>
                                <CardActionArea component={Link} to={`/blog/${article.slug}`} sx={{ height: '100%' }}>
                                    <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                            <Chip
                                                label={article.category}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                                                    color: '#3b82f6',
                                                    fontWeight: 800,
                                                    fontSize: '0.6rem',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </Stack>

                                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, leading: 1.2 }}>
                                            {article.title}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                                            {article.description}
                                        </Typography>

                                        <Stack direction="row" alignItems="center" spacing={3} sx={{ color: 'text.secondary' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Calendar size={14} />
                                                <Typography variant="caption" sx={{ fontWeight: 600 }}>{article.date}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <User size={14} />
                                                <Typography variant="caption" sx={{ fontWeight: 600 }}>{article.author}</Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

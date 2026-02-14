import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea, Stack, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { blogArticles } from '@/features/blog/blogData';
import { ArrowRight } from 'lucide-react';

export const BlogSection: React.FC = () => {
    // Show only the latest 3 articles
    const latestArticles = blogArticles.slice(0, 3);

    return (
        <Box sx={{ py: 8 }}>
            <Stack direction="row" alignItems="center" justifyContent="between" sx={{ mb: 6 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, tracking: '-0.02em' }}>
                        Intelligence <span style={{ color: '#3b82f6' }}>Feed</span>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Institutional-grade research and structural analysis
                    </Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    component={Link}
                    to="/blog"
                    endIcon={<ArrowRight size={16} />}
                    sx={{ color: '#3b82f6', fontWeight: 800 }}
                >
                    View All
                </Button>
            </Stack>

            <Grid container spacing={3}>
                {latestArticles.map((article) => (
                    <Grid item xs={12} md={4} key={article.id}>
                        <Card sx={{
                            height: '100%',
                            bgcolor: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'rgba(255,255,255,0.04)'
                            }
                        }}>
                            <CardActionArea component={Link} to={`/blog/${article.slug}`} sx={{ height: '100%' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 800, mb: 1, display: 'block', textTransform: 'uppercase' }}>
                                        {article.category}
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, leading: 1.3, fontSize: '1rem' }}>
                                        {article.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        fontSize: '0.8rem'
                                    }}>
                                        {article.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

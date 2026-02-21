import React, { useState } from 'react';
import { Container, Typography, Box, Paper, TextField, InputAdornment, Chip, Grid } from '@mui/material';
import { Search, Book } from 'lucide-react';
import { Link } from 'react-router-dom';
import { glossaryData } from '@/features/glossary/glossaryData';
import { SEOManager } from '@/components/SEOManager';

export const GlossaryIndexPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = Array.from(new Set(glossaryData.map(term => term.category)));

    const filteredTerms = glossaryData.filter(term => {
        const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
            term.definition.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? term.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => a.term.localeCompare(b.term));

    return (
        <Box sx={{ py: 6, minHeight: '100vh', bgcolor: 'background.default' }}>
            <SEOManager
                title="Macro Concepts Glossary"
                description="Institutional definitions for macro liquidity, sovereign debt risk, and geo-economic terminology."
                keywords={["Macro Concepts", "Liquidity Glossary", "Institutional Finance Dictionary", "Sovereign Debt Terms"]}
            />

            <Container maxWidth="lg">
                <Box mb={6} textAlign="center">
                    <Book className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <Typography variant="h3" component="h1" gutterBottom className="font-display font-bold">
                        Macro Concepts Glossary
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" maxWidth="sm" mx="auto">
                        A curated dictionary of institutional finance terminology focusing on global liquidity flows, monetary regimes, and sovereign stress.
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 6 }}>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Search concepts (e.g., Net Liquidity, Stealth QE)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search className="text-muted-foreground w-5 h-5" />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)' }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" gap={1} flexWrap="wrap">
                                <Chip
                                    label="All"
                                    onClick={() => setSelectedCategory(null)}
                                    color={selectedCategory === null ? 'primary' : 'default'}
                                    variant={selectedCategory === null ? 'filled' : 'outlined'}
                                    sx={{ cursor: 'pointer' }}
                                />
                                {categories.map(category => (
                                    <Chip
                                        key={category}
                                        label={category}
                                        onClick={() => setSelectedCategory(category)}
                                        color={selectedCategory === category ? 'primary' : 'default'}
                                        variant={selectedCategory === category ? 'filled' : 'outlined'}
                                        sx={{ cursor: 'pointer' }}
                                    />
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }} gap={4}>
                    {filteredTerms.length > 0 ? (
                        filteredTerms.map(term => (
                            <Paper
                                key={term.id}
                                component={Link}
                                to={`/glossary/${term.slug}`}
                                elevation={0}
                                sx={{
                                    p: 4,
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 10px 40px -10px rgba(59,130,246,0.2)'
                                    }
                                }}
                            >
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
                                    {term.category}
                                </Typography>
                                <Typography variant="h6" color="text.primary" fontWeight="bold" gutterBottom>
                                    {term.term}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {term.definition}
                                </Typography>
                            </Paper>
                        ))
                    ) : (
                        <Box gridColumn="1 / -1" textAlign="center" py={8}>
                            <Typography color="text.secondary">No concepts found matching your criteria.</Typography>
                        </Box>
                    )}
                </Box>
            </Container>
        </Box>
    );
};

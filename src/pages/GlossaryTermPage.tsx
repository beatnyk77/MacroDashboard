import React from 'react';
import { useParams, Link as RouterLink, Navigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, BookOpen, Activity } from 'lucide-react';
import { glossaryData } from '@/features/glossary/glossaryData';
import { SEOManager } from '@/components/SEOManager';

export const GlossaryTermPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const termData = glossaryData.find(t => t.slug === slug);

    if (!termData) {
        return <Navigate to="/glossary" replace />;
    }

    // Build enhanced JSON-LD for individual term
    const termJsonLd = {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "@id": `https://graphiquestor.com/glossary/${termData.slug}#definedterm`,
        "name": termData.term,
        "description": termData.definition,
        "url": `https://graphiquestor.com/glossary/${termData.slug}`,
        "inDefinedTermSet": {
            "@type": "DefinedTermSet",
            "name": "GraphiQuestor Macro Intelligence Glossary",
            "url": "https://graphiquestor.com/glossary"
        },
        "category": termData.category,
        "identifier": termData.id,
        "termCode": termData.slug,
        "dateModified": "2026-03-31",
        ...(termData.relatedMetrics && termData.relatedMetrics.length > 0 && {
            "relatedMetrics": termData.relatedMetrics
        })
    };

    // BreadcrumbList schema
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://graphiquestor.com"
        }, {
            "@type": "ListItem",
            "position": 2,
            "name": "Glossary",
            "item": "https://graphiquestor.com/glossary"
        }, {
            "@type": "ListItem",
            "position": 3,
            "name": termData.term,
            "item": `https://graphiquestor.com/glossary/${termData.slug}`
        }]
    };

    return (
        <Box sx={{ py: 8, minHeight: '100vh' }}>
            <SEOManager
                title={`${termData.term} - Macro Concept Definition`}
                description={termData.definition.substring(0, 160) + '...'}
                keywords={[termData.term, termData.category, "Macro Definition", "Institutional Finance Glossary"]}
                jsonLd={[termJsonLd, breadcrumbJsonLd]}
            />

            <Container maxWidth="md">
                <Button
                    component={RouterLink}
                    to="/glossary"
                    startIcon={<ArrowLeft size={16} />}
                    sx={{ mb: 4, color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
                >
                    Back to Glossary
                </Button>

                <Paper elevation={0} sx={{ p: { xs: 4, md: 8 }, bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                    <Box mb={4} display="flex" alignItems="center" gap={2}>
                        <Chip
                            label={termData.category}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.7rem' }}
                        />
                    </Box>

                    <Typography variant="h2" component="h1" gutterBottom className="font-display font-black" sx={{ mb: 6 }}>
                        {termData.term}
                    </Typography>

                    <Typography variant="body1" sx={{ fontSize: '1.2rem', lineHeight: 1.8, color: 'text.secondary', mb: 6 }}>
                        {termData.definition}
                    </Typography>

                    {termData.relatedMetrics && termData.relatedMetrics.length > 0 && (
                        <Box sx={{ mt: 6, p: 4, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 1 }}>
                                <Activity size={16} className="text-blue-400" />
                                Tracked via Dashboard Metrics
                            </Typography>
                            <Box display="flex" gap={2} flexWrap="wrap">
                                {termData.relatedMetrics.map(metric => (
                                    <Chip
                                        key={metric}
                                        label={metric}
                                        sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'text.secondary' }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}

                    <Divider sx={{ my: 6, opacity: 0.1 }} />

                    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                        <BookOpen size={24} className="text-muted-foreground mb-3" />
                        <Typography variant="body2" color="text.secondary" mb={2} maxWidth="sm">
                            This metric is continuously tracked in the primary institutional dashboard alongside real-time monetary data.
                        </Typography>
                        <Button component={RouterLink} to="/" variant="contained" color="primary">
                            View Live Dashboard
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

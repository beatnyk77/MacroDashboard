import React from 'react';
import { useParams, Link as RouterLink, Navigate, Link } from 'react-router-dom';
import { Container, Typography, Box, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, BookOpen, Activity, FlaskConical, Lightbulb, ArrowRight } from 'lucide-react';
import { glossaryData } from '@/features/glossary/glossaryData';
import { SEOManager } from '@/components/SEOManager';

export const GlossaryTermPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const termData = glossaryData.find(t => t.slug === slug);

    if (!termData) {
        return <Navigate to="/glossary" replace />;
    }

    // Related terms (same category, exclude self)
    const related = glossaryData
        .filter(t => t.category === termData.category && t.slug !== slug)
        .slice(0, 3);

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
        "dateModified": "2026-04-10",
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
                title={`${termData.term} — Definition & Formula`}
                description={`${termData.definition.substring(0, 150)}...`}
                keywords={[termData.term, termData.category, "Macro Definition", "Institutional Finance Glossary"]}
                canonicalUrl={`https://graphiquestor.com/glossary/${termData.slug}`}
                jsonLd={[termJsonLd, breadcrumbJsonLd]}
            />

            <Container maxWidth="md">
                {/* Breadcrumb + Back */}
                <Box mb={4} display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <Button
                        component={RouterLink}
                        to="/glossary"
                        startIcon={<ArrowLeft size={16} />}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
                    >
                        Back to Glossary
                    </Button>
                    <Typography variant="caption" color="text.disabled">·</Typography>
                    <Typography variant="caption" color="text.secondary">{termData.category}</Typography>
                </Box>

                <Paper elevation={0} sx={{ p: { xs: 4, md: 8 }, bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                    {/* Category badge */}
                    <Box mb={4} display="flex" alignItems="center" gap={2}>
                        <Chip
                            label={termData.category}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.7rem' }}
                        />
                    </Box>

                    {/* Term heading */}
                    <Typography variant="h2" component="h1" gutterBottom className="font-display font-black" sx={{ mb: 4 }}>
                        {termData.term}
                    </Typography>

                    {/* Definition */}
                    <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'text.secondary', mb: 5 }}>
                        {termData.definition}
                    </Typography>

                    {/* Formula block */}
                    {termData.formula && (
                        <Box sx={{ mt: 4, mb: 5 }}>
                            <Typography variant="subtitle2" sx={{
                                display: 'flex', alignItems: 'center', gap: 1,
                                mb: 2, fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: 1, color: 'text.primary', fontSize: '0.7rem'
                            }}>
                                <FlaskConical size={15} className="text-blue-400" />
                                Formula
                            </Typography>
                            <Box sx={{
                                p: 3, borderRadius: 2, bgcolor: 'rgba(59,130,246,0.05)',
                                border: '1px solid rgba(59,130,246,0.2)',
                                fontFamily: 'monospace', fontSize: '0.87rem',
                                color: '#93c5fd', whiteSpace: 'pre-line', lineHeight: 1.8
                            }}>
                                {termData.formula}
                            </Box>
                        </Box>
                    )}

                    {/* Why It Matters */}
                    {termData.whyItMatters && (
                        <Box sx={{ mt: 4, mb: 5, p: 4, bgcolor: 'rgba(16,185,129,0.04)', borderRadius: 2, border: '1px solid rgba(16,185,129,0.15)' }}>
                            <Typography variant="subtitle2" sx={{
                                display: 'flex', alignItems: 'center', gap: 1,
                                mb: 2, fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: 1, color: '#10b981', fontSize: '0.7rem'
                            }}>
                                <Lightbulb size={15} />
                                Why It Matters
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.85, color: 'text.secondary', fontSize: '0.95rem' }}>
                                {termData.whyItMatters}
                            </Typography>
                        </Box>
                    )}

                    {/* Dashboard metrics */}
                    {termData.relatedMetrics && termData.relatedMetrics.length > 0 && (
                        <Box sx={{ mt: 5, p: 4, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                                <Activity size={15} className="text-blue-400" />
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

                    {/* Methods page deep link */}
                    {termData.methodsPage && (
                        <Box sx={{ mt: 4, p: 4, bgcolor: 'rgba(245,158,11,0.04)', borderRadius: 2, border: '1px solid rgba(245,158,11,0.2)' }}>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                This metric has a detailed methodology article covering its formula, data sources, and institutional use cases.
                            </Typography>
                            <Button
                                component={Link}
                                to={termData.methodsPage}
                                endIcon={<ArrowRight size={15} />}
                                variant="outlined"
                                sx={{ borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b', '&:hover': { borderColor: '#f59e0b', bgcolor: 'rgba(245,158,11,0.08)' } }}
                            >
                                Read Full Methodology
                            </Button>
                        </Box>
                    )}

                    <Divider sx={{ my: 6, opacity: 0.1 }} />

                    {/* Related terms */}
                    {related.length > 0 && (
                        <Box mb={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, mb: 3, color: 'text.secondary', fontSize: '0.7rem' }}>
                                Related Terms
                            </Typography>
                            <Box display="flex" gap={2} flexWrap="wrap">
                                {related.map(r => (
                                    <Button
                                        key={r.slug}
                                        component={RouterLink}
                                        to={`/glossary/${r.slug}`}
                                        variant="outlined"
                                        size="small"
                                        endIcon={<ArrowRight size={12} />}
                                        sx={{ borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
                                    >
                                        {r.term}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* CTA footer */}
                    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                        <BookOpen size={24} className="text-muted-foreground mb-3" />
                        <Typography variant="body2" color="text.secondary" mb={2} maxWidth="sm">
                            This metric is continuously tracked alongside real-time monetary and fiscal data in the GraphiQuestor institutional dashboard.
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

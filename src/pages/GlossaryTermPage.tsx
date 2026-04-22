import React, { useMemo } from 'react';
import { useParams, Link as RouterLink, Navigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, BookOpen, Activity, FlaskConical, Lightbulb, ArrowRight } from 'lucide-react';
import { glossaryData } from '@/features/glossary/glossaryData';
import { SEOManager } from '@/components/SEOManager';

// Config, Hub & Components
import { GLOSSARY_LIVE_CONFIG } from '@/features/glossary/glossaryLiveMap';
import { LiveIntelligenceBox, LiveMetricResult } from '@/features/glossary/LiveIntelligenceBox';
import { useGlossaryDataHub } from '@/features/glossary/useGlossaryDataHub';

export const GlossaryTermPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const termData = glossaryData.find(t => t.slug === slug);

    const hub = useGlossaryDataHub(slug);

    if (!termData) {
        return <Navigate to="/glossary" replace />;
    }

    const { rawData, lastUpdated } = hub || {};

    // Resolve live data based on slug
    const liveResult = useMemo((): LiveMetricResult | null => {
        const config = GLOSSARY_LIVE_CONFIG[slug || ''];
        if (!config || !rawData) return null;

        try {
            const interpretation = config.interpret(rawData);
            return {
                displayValue: interpretation.displayValue,
                unit: config.unit || '',
                label: interpretation.label,
                color: interpretation.color,
                interpretation: interpretation.text,
                lastUpdated: lastUpdated || '',
                linkTo: config.linkTo
            };
        } catch (e) {
            console.error('Error interpreting live data for slug:', slug, e);
            return null;
        }
    }, [slug, rawData, lastUpdated]);

    // Metadata enhancements
    const dynamicTitle = useMemo(() => {
        if (liveResult) {
            return `${termData.term}: ${liveResult.displayValue}${liveResult.unit} (${liveResult.label}) — Definition`;
        }
        return `${termData.term} — Definition & Formula`;
    }, [termData.term, liveResult]);

    const dynamicDescription = useMemo(() => {
        if (liveResult) {
            return `Current ${termData.term}: ${liveResult.displayValue}${liveResult.unit} [${liveResult.label}]. ${termData.definition.substring(0, 100)}...`;
        }
        return `${termData.definition.substring(0, 150)}...`;
    }, [liveResult, termData.term, termData.definition]);

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

    // FAQ Schema for Cross-Pollination
    const faqJsonLd = liveResult ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{
            "@type": "Question",
            "name": GLOSSARY_LIVE_CONFIG[slug || ''].faqQuestion,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": `${termData.term} is currently ${liveResult.displayValue}${liveResult.unit}. In our classification, this represents a ${liveResult.label} regime. Macro Implication: ${liveResult.interpretation}`
            }
        }]
    } : null;

    const schemas: any[] = [termJsonLd, breadcrumbJsonLd];
    if (faqJsonLd) schemas.push(faqJsonLd);

    return (
        <Box sx={{ py: 8, minHeight: '100vh' }}>
            <SEOManager
                title={dynamicTitle}
                description={dynamicDescription}
                keywords={[termData.term, termData.category, "Macro Definition", "Institutional Finance Glossary"]}
                canonicalUrl={`https://graphiquestor.com/glossary/${termData.slug}`}
                jsonLd={schemas}
            />

            <Container maxWidth="md">
                <Box sx={{ mb: 6 }}>
                    <Button 
                        component={RouterLink} 
                        to="/glossary" 
                        startIcon={<ArrowLeft size={18} />}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' }, mb: 4 }}
                    >
                        Back to Glossary
                    </Button>

                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                        <Chip 
                            label={termData.category} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ fontWeight: 700, borderRadius: 1, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' }}
                        />
                    </Box>

                    <Typography variant="h2" sx={{ fontWeight: 900, color: 'text.primary', mb: 3 }}>
                        {termData.term}
                    </Typography>

                    {/* Definition */}
                    <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'text.secondary', mb: 5 }}>
                        {termData.definition}
                    </Typography>

                    {/* Live Intelligence Answer Box (Cross-Pollination) */}
                    {liveResult && <LiveIntelligenceBox result={liveResult} />}

                    {/* Formula block */}
                    {termData.formula && (
                        <Box sx={{ mt: 4, mb: 5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.disabled', letterSpacing: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FlaskConical size={16} /> Formula / Calculation
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, borderStyle: 'dashed' }}>
                                <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem', color: 'primary.main', fontWeight: 600 }}>
                                    {termData.formula}
                                </Typography>
                            </Paper>
                        </Box>
                    )}

                    <Divider sx={{ my: 6, opacity: 0.5 }} />

                    {/* Detailed Analysis / Why it matters */}
                    {termData.whyItMatters && (
                        <Box sx={{ mb: 8 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Lightbulb size={24} className="text-amber-500" /> Why It Matters
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                                {termData.whyItMatters}
                            </Typography>
                        </Box>
                    )}

                    {/* Dashboard metrics */}
                    {termData.relatedMetrics && termData.relatedMetrics.length > 0 && (
                        <Box sx={{ mt: 5, p: 4, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)' }}>
                            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                                <Activity size={15} className="text-blue-400" />
                                Tracked via Dashboard Metrics
                            </Typography>
                            <Box display="flex" gap={2} flexWrap="wrap">
                                {termData.relatedMetrics.map(metric => (
                                    <Chip
                                        key={metric}
                                        label={metric}
                                        sx={{ bgcolor: 'rgba(0,0,0,0.05)', color: 'text.secondary' }}
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
                                component={RouterLink}
                                to={termData.methodsPage}
                                endIcon={<ArrowRight size={15} />}
                                variant="outlined"
                                sx={{ borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b', '&:hover': { borderColor: '#f59e0b', bgcolor: 'rgba(245,158,11,0.08)' } }}
                            >
                                Read Full Methodology
                            </Button>
                        </Box>
                    )}

                    {/* Related Terms Concepts */}
                    <Box sx={{ mt: 8, mb: 8 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <BookOpen size={20} /> Related Concepts
                        </Typography>
                        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={3}>
                            {related.map(term => (
                                <Paper 
                                    key={term.id}
                                    component={RouterLink}
                                    to={`/glossary/${term.slug}`}
                                    variant="outlined"
                                    sx={{ 
                                        p: 2.5, 
                                        textDecoration: 'none', 
                                        transition: 'all 0.2s',
                                        '&:hover': { borderColor: 'primary.main', transform: 'translateY(-4px)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                                        {term.term}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineClamp: 2 }}>
                                        {term.definition}
                                    </Typography>
                                </Paper>
                            ))}
                        </Box>
                    </Box>

                    {/* CTA */}
                    <Paper sx={{ p: 4, borderRadius: 3, bgcolor: 'text.primary', color: 'background.paper', position: 'relative', overflow: 'hidden' }}>
                        <Activity size={100} style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                            Ready to see this live?
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7, mb: 3, maxWidth: '80%' }}>
                            Join institutional allocators using GraphiQuestor to track these signals in real-time across global markets.
                        </Typography>
                        <Button 
                            component={RouterLink}
                            to="/"
                            variant="contained" 
                            color="primary" 
                            size="large"
                            sx={{ fontWeight: 800, px: 4, borderRadius: 2 }}
                        >
                            Open Terminal
                        </Button>
                    </Paper>
                </Box>
            </Container>
        </Box>
    );
};

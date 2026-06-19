import React, { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { TrailLink } from '@/components/TrailLink';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { RelatedContent } from '@/components/RelatedContent';
import { SubscribeCard } from '@/components/SubscribeCard';
import { toAbsoluteUrl, trailRoute } from '@/lib/urlPath';
import { Container, Typography, Box, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, BookOpen, Activity, FlaskConical, Lightbulb, ArrowRight, Code } from 'lucide-react';
import { glossaryData } from '@/features/glossary/glossaryData';
import { SEOManager } from '@/components/SEOManager';
import { getGlossarySeo } from '@/features/glossary/glossarySeoEnrichment';
import { GlossaryMetricPanel } from '@/features/glossary/GlossaryMetricPanel';
import { GlossaryReadingSection } from '@/features/glossary/GlossaryReadingSection';
import { GlossaryInteractiveTools } from '@/components/engagement/GlossaryInteractiveTools';
import { PremiumActionBar } from '@/components/engagement/PremiumActionBar';
import { ValueProgressionPath } from '@/components/engagement/ValueProgressionPath';
import { CiteThisPage } from '@/components/research/CiteThisPage';
import type { ResearchCitationInput } from '@/lib/researchCitation';

import { GLOSSARY_LIVE_CONFIG } from '@/features/glossary/glossaryLiveMap';
import { LiveIntelligenceBox, LiveMetricResult } from '@/features/glossary/LiveIntelligenceBox';
import { useGlossaryDataHub } from '@/features/glossary/useGlossaryDataHub';

export const GlossaryTermPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const termData = glossaryData.find(t => t.slug === slug);
    const seo = slug ? getGlossarySeo(slug) : undefined;

    const hub = useGlossaryDataHub(slug);
    const { rawData, lastUpdated } = hub || {};

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

    const pageTitle = useMemo(() => {
        if (seo?.seoTitle) return seo.seoTitle;
        if (liveResult) {
            return `${termData?.term}: ${liveResult.displayValue}${liveResult.unit} (${liveResult.label}) — Definition`;
        }
        return `${termData?.term} — Definition & Formula`;
    }, [seo, termData?.term, liveResult]);

    const pageDescription = useMemo(() => {
        if (seo?.seoDescription) return seo.seoDescription;
        if (liveResult) {
            return `Current ${termData?.term}: ${liveResult.displayValue}${liveResult.unit} [${liveResult.label}]. ${termData?.definition.substring(0, 100)}...`;
        }
        return `${termData?.definition.substring(0, 150)}...`;
    }, [seo, liveResult, termData?.term, termData?.definition]);

    const pageKeywords = useMemo(() => {
        const base = [termData?.term ?? '', termData?.category ?? '', 'Macro Definition', 'Institutional Finance Glossary'];
        return seo?.seoKeywords ? [...seo.seoKeywords, ...base] : base;
    }, [seo, termData?.term, termData?.category]);

    const citationInput = useMemo((): ResearchCitationInput | null => {
        if (!termData) return null;
        const keyPoints = [
            termData.whyItMatters ?? `Category: ${termData.category}. Used in institutional macro surveillance.`,
            ...(seo?.context2026 ? [seo.context2026.slice(0, 200)] : []),
            ...(termData.relatedMetrics?.length
                ? [`Related metrics: ${termData.relatedMetrics.join(', ')}.`]
                : []),
        ].filter(Boolean) as string[];

        return {
            title: termData.term,
            path: `/glossary/${termData.slug}`,
            pageType: 'glossary',
            category: termData.category,
            summary: termData.definition,
            keyPoints: keyPoints.slice(0, 4),
            formula: termData.formula,
            source: 'GraphiQuestor Macro Intelligence Glossary — live cross-links on terminal',
        };
    }, [termData, seo]);

    if (!termData) {
        return <Navigate to={trailRoute('/glossary')} replace />;
    }

    const related = glossaryData
        .filter(t => t.category === termData.category && t.slug !== slug)
        .slice(0, 3);

    const termJsonLd = {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "@id": `${toAbsoluteUrl(`/glossary/${termData.slug}`)}#definedterm`,
        "name": termData.term,
        "description": termData.definition,
        "url": toAbsoluteUrl(`/glossary/${termData.slug}`),
        "inDefinedTermSet": {
            "@type": "DefinedTermSet",
            "name": "GraphiQuestor Macro Intelligence Glossary",
            "url": toAbsoluteUrl('/glossary')
        },
        "category": termData.category,
        "identifier": termData.id,
        "termCode": termData.slug,
        "dateModified": "2026-06-19",
        ...(termData.relatedMetrics && termData.relatedMetrics.length > 0 && {
            "relatedMetrics": termData.relatedMetrics
        })
    };

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": toAbsoluteUrl('/')
        }, {
            "@type": "ListItem",
            "position": 2,
            "name": "Glossary",
            "item": toAbsoluteUrl('/glossary')
        }, {
            "@type": "ListItem",
            "position": 3,
            "name": termData.term,
            "item": toAbsoluteUrl(`/glossary/${termData.slug}`)
        }]
    };

    const faqEntities: object[] = [
        {
            "@type": "Question",
            "name": `What is ${termData.term}?`,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": termData.definition
            }
        }
    ];

    if (termData.whyItMatters) {
        faqEntities.push({
            "@type": "Question",
            "name": `Why does ${termData.term} matter for macro investors?`,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": termData.whyItMatters
            }
        });
    }

    if (termData.formula) {
        faqEntities.push({
            "@type": "Question",
            "name": `How is ${termData.term} calculated?`,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": `The formula for ${termData.term} is: ${termData.formula}`
            }
        });
    }

    if (seo?.context2026) {
        faqEntities.push({
            "@type": "Question",
            "name": `What is the ${termData.term} outlook in 2026?`,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": seo.context2026
            }
        });
    }

    seo?.faqItems.forEach((item) => {
        faqEntities.push({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
            }
        });
    });

    if (liveResult) {
        faqEntities.push({
            "@type": "Question",
            "name": GLOSSARY_LIVE_CONFIG[slug || ''].faqQuestion,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": `${termData.term} is currently ${liveResult.displayValue}${liveResult.unit}. In our classification, this represents a ${liveResult.label} regime. Macro Implication: ${liveResult.interpretation}`
            }
        });
    }

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqEntities
    };

    const schemas: object[] = [termJsonLd, breadcrumbJsonLd, faqJsonLd];

    const displayH1 = seo?.h1 ?? termData.term;
    const showMetricPanel = seo?.liveMetricId && !liveResult;

    return (
        <Box sx={{ py: 8, minHeight: '100vh' }}>
            <SEOManager
                title={pageTitle}
                description={pageDescription}
                keywords={pageKeywords}
                canonicalUrl={`https://graphiquestor.com/glossary/${termData.slug}`}
                jsonLd={schemas}
            />

            <Container maxWidth="md">
                <Box sx={{ mb: 6 }}>
                    <Button
                        component={TrailLink}
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

                    <Typography component="h1" variant="h2" sx={{ fontWeight: 900, color: 'text.primary', mb: 3 }}>
                        {displayH1}
                    </Typography>

                    {/* Definition */}
                    <Typography
                        component="h2"
                        variant="subtitle2"
                        sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.disabled', letterSpacing: 1.5, mb: 2 }}
                    >
                        Definition
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'text.secondary', mb: 4 }}>
                        {termData.definition}
                    </Typography>

                    {citationInput && (
                        <Box sx={{ mb: 4 }}>
                            <CiteThisPage input={citationInput} />
                        </Box>
                    )}

                    <PremiumActionBar className="mb-6" latestDataHref="/" compareHref="/countries" />

                    <GlossaryInteractiveTools slug={slug ?? ''} className="mb-6" />

                    {liveResult && <LiveIntelligenceBox result={liveResult} />}

                    {showMetricPanel && (
                        <GlossaryMetricPanel
                            metricId={seo!.liveMetricId!}
                            label={seo!.liveMetricLabel ?? termData.term}
                            unit={seo!.liveMetricUnit}
                        />
                    )}

                    {termData.formula && (
                        <Box sx={{ mt: 4, mb: 5 }}>
                            <Typography
                                component="h2"
                                variant="subtitle2"
                                sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.disabled', letterSpacing: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                            >
                                <FlaskConical size={16} /> Formula / Calculation
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, borderStyle: 'dashed' }}>
                                <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', color: 'primary.main', fontWeight: 600, whiteSpace: 'pre-line' }}>
                                    {termData.formula}
                                </Typography>
                            </Paper>
                        </Box>
                    )}

                    {seo?.context2026 && (
                        <Box sx={{ mb: 6 }}>
                            <Typography
                                component="h2"
                                variant="h5"
                                sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}
                            >
                                <Activity size={22} className="text-blue-400" /> 2026 Macro Context
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                                {seo.context2026}
                            </Typography>
                        </Box>
                    )}

                    <Divider sx={{ my: 6, opacity: 0.5 }} />

                    {termData.whyItMatters && (
                        <Box sx={{ mb: 6 }}>
                            <Typography
                                component="h2"
                                variant="h5"
                                sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}
                            >
                                <Lightbulb size={24} className="text-amber-500" /> Why It Matters
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                                {termData.whyItMatters}
                            </Typography>
                        </Box>
                    )}

                    {seo?.relatedReading && <GlossaryReadingSection links={seo.relatedReading} />}

                    <RelatedMetrics glossarySlug={slug} minLinks={2} />

                    <Box sx={{ mt: 4 }}>
                        <ValueProgressionPath />
                    </Box>

                    {termData.methodsPage && (
                        <Box sx={{ mt: 4, p: 4, bgcolor: 'rgba(245,158,11,0.04)', borderRadius: 2, border: '1px solid rgba(245,158,11,0.2)' }}>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                This metric has a detailed methodology article covering its formula, data sources, and institutional use cases.
                            </Typography>
                            <Button
                                component={TrailLink}
                                to={termData.methodsPage}
                                endIcon={<ArrowRight size={15} />}
                                variant="outlined"
                                sx={{ borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b', '&:hover': { borderColor: '#f59e0b', bgcolor: 'rgba(245,158,11,0.08)' } }}
                            >
                                Read Full Methodology
                            </Button>
                        </Box>
                    )}

                    {/* Visible FAQ block for enriched terms */}
                    {seo?.faqItems && seo.faqItems.length > 0 && (
                        <Box sx={{ mt: 8, mb: 6 }}>
                            <Typography component="h2" variant="h6" sx={{ fontWeight: 800, mb: 4 }}>
                                Frequently Asked Questions
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={3}>
                                {seo.faqItems.map((item) => (
                                    <Paper key={item.question} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                                        <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                                            {item.question}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                                            {item.answer}
                                        </Typography>
                                    </Paper>
                                ))}
                            </Box>
                        </Box>
                    )}

                    <Box sx={{ mt: 8, mb: 6 }}>
                        <Typography component="h2" variant="h6" sx={{ fontWeight: 800, mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <BookOpen size={20} /> Related Concepts
                        </Typography>
                        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={3}>
                            {related.map(term => (
                                <Paper
                                    key={term.id}
                                    component={TrailLink}
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

                    <Box sx={{ mb: 6 }}>
                        <SubscribeCard source={`glossary-${slug}`} />
                    </Box>

                    <Paper sx={{ p: 4, borderRadius: 3, bgcolor: 'text.primary', color: 'background.paper', position: 'relative', overflow: 'hidden', mb: 4 }}>
                        <Activity size={100} style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                            Track {termData.term} live
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7, mb: 3, maxWidth: '80%' }}>
                            Open the GraphiQuestor terminal for real-time data, provenance, and cross-metric intelligence.
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={2}>
                            <Button
                                component={TrailLink}
                                to="/"
                                variant="contained"
                                color="primary"
                                size="large"
                                sx={{ fontWeight: 800, px: 4, borderRadius: 2 }}
                            >
                                Open Terminal
                            </Button>
                            <Button
                                component={TrailLink}
                                to="/api-access"
                                variant="outlined"
                                size="large"
                                startIcon={<Code size={16} />}
                                sx={{ fontWeight: 700, px: 3, borderRadius: 2, borderColor: 'rgba(255,255,255,0.3)', color: 'inherit', '&:hover': { borderColor: 'rgba(255,255,255,0.6)' } }}
                            >
                                API Access
                            </Button>
                        </Box>
                    </Paper>

                    <RelatedContent />
                </Box>
            </Container>
        </Box>
    );
};
import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Box, Typography, Container, Button, Stack, Chip, Divider } from '@mui/material';
import { blogArticles } from '@/features/blog/blogData';
import { SEOManager } from '@/components/SEOManager';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react';

export const ArticlePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const article = blogArticles.find(a => a.slug === slug);

    if (!article) {
        return <Navigate to="/blog" replace />;
    }

    return (
        <Box sx={{ py: 4 }}>
            <SEOManager
                title={article.title}
                description={article.description}
                keywords={article.keywords}
                ogType="article"
                publishedTime={article.date}
                canonicalUrl={`https://graphiquestor.com/blog/${article.slug}`}
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "Article",
                    "headline": article.title,
                    "description": article.description,
                    "image": "https://graphiquestor.com/og-preview.png",
                    "datePublished": article.date,
                    "author": {
                        "@type": "Person",
                        "name": article.author,
                        ...(article.author === 'Kartikay Sharma' ? {
                            "jobTitle": "Chartered Accountant & Macro Analyst",
                            "url": "https://graphiquestor.com/about",
                            "sameAs": [
                                "https://www.linkedin.com/in/kartikay-sharma-b9190214/"
                            ]
                        } : {})
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": "GraphiQuestor",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https://graphiquestor.com/logo.png"
                        }
                    },
                    "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": `https://graphiquestor.com/blog/${article.slug}`
                    }
                }}
            />
            {/* Breadcrumb Schema */}
            <script type="application/ld+json">
                {JSON.stringify({
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
                        "name": "Intelligence Journal",
                        "item": "https://graphiquestor.com/blog"
                    }, {
                        "@type": "ListItem",
                        "position": 3,
                        "name": article.title,
                        "item": `https://graphiquestor.com/blog/${article.slug}`
                    }]
                })}
            </script>

            <Container maxWidth="md">
                <Button
                    component={Link}
                    to="/blog"
                    startIcon={<ArrowLeft size={16} />}
                    sx={{ mb: 4, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                >
                    Back to Journal
                </Button>

                <Box sx={{ mb: 6 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                        <Chip
                            label={article.category}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                fontWeight: 800,
                                fontSize: '0.7rem',
                                borderRadius: '4px'
                            }}
                        />
                    </Stack>

                    <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, tracking: '-0.02em', leading: 1.1 }}>
                        {article.title}
                    </Typography>

                    <Stack direction="row" alignItems="center" spacing={4} sx={{ color: 'text.secondary' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Calendar size={16} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{article.date}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <User size={16} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{article.author}</Typography>
                        </Box>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button startIcon={<Share2 size={16} />} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                            Share
                        </Button>
                    </Stack>
                </Box>

                <Divider sx={{ mb: 6, opacity: 0.1 }} />

                <Box className="prose prose-invert max-w-none" sx={{
                    '& h1': { display: 'none' }, // Title is handled by MUI typography
                    '& h2': { fontWeight: 800, mt: 6, mb: 3, color: 'text.primary', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 1 },
                    '& h3': { fontWeight: 700, mt: 4, mb: 2, color: 'text.primary' },
                    '& p': { mb: 3, leading: 1.7, color: 'text.secondary' },
                    '& ul, & ol': { mb: 3, pl: 4, color: 'text.secondary' },
                    '& li': { mb: 1.5 },
                    '& blockquote': { borderLeft: '4px solid #3b82f6', pl: 3, py: 1, m: 0, mb: 4, bgcolor: 'rgba(59, 130, 246, 0.05)', fontStyle: 'italic' },
                    '& strong': { color: 'text.primary', fontWeight: 800 }
                }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {article.content}
                    </ReactMarkdown>
                </Box>

                <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                        About GraphiQuestor Research
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Our research team consists of former institutional allocators and macro analysts specializing in emerging market volatility and monetary regime transitions.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

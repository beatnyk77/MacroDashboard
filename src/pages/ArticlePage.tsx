import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Box, Typography, Container, Button, Stack, Chip, Divider, Avatar, IconButton, Tooltip } from '@mui/material';
import { blogArticles } from '@/features/blog/blogData';
import { SEOManager } from '@/components/SEOManager';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Calendar, User, Clock, Twitter, Linkedin, LinkIcon, BookOpen, ChevronRight } from 'lucide-react';

function estimateReadingTime(content: string): number {
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 230));
}

export const ArticlePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const article = blogArticles.find(a => a.slug === slug);
    const articleIndex = blogArticles.findIndex(a => a.slug === slug);

    if (!article) {
        return <Navigate to="/blog" replace />;
    }

    const readingTime = estimateReadingTime(article.content);
    const relatedArticles = blogArticles
        .filter(a => a.slug !== slug)
        .sort((a, b) => {
            // Prioritize same category, then recency
            const aMatch = a.category === article.category ? 1 : 0;
            const bMatch = b.category === article.category ? 1 : 0;
            if (aMatch !== bMatch) return bMatch - aMatch;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
        .slice(0, 3);

    // Next/Prev navigation
    const prevArticle = articleIndex > 0 ? blogArticles[articleIndex - 1] : null;
    const nextArticle = articleIndex < blogArticles.length - 1 ? blogArticles[articleIndex + 1] : null;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`https://graphiquestor.com/blog/${article.slug}`);
    };

    const handleShareTwitter = () => {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://graphiquestor.com/blog/${article.slug}`)}&text=${encodeURIComponent(article.title)}`, '_blank');
    };

    const handleShareLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://graphiquestor.com/blog/${article.slug}`)}`, '_blank');
    };

    return (
        <Box sx={{ minHeight: '100vh' }}>
            <SEOManager
                title={article.title}
                description={article.description}
                keywords={article.keywords}
                ogType="article"
                publishedTime={article.date}
                canonicalUrl={`https://graphiquestor.com/blog/${article.slug}`}
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "BlogPosting",
                    "headline": article.title,
                    "description": article.description,
                    "image": "https://graphiquestor.com/og-preview.png",
                    "datePublished": article.date,
                    "wordCount": article.content.trim().split(/\s+/).length,
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

            {/* ── Hero Section ── */}
            <Box sx={{
                py: { xs: 6, md: 10 },
                px: 2,
                background: 'linear-gradient(180deg, rgba(59,130,246,0.06) 0%, transparent 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
                <Container maxWidth="md">
                    <Button
                        component={Link}
                        to="/blog"
                        startIcon={<ArrowLeft size={16} />}
                        sx={{ mb: 4, color: 'text.secondary', '&:hover': { color: 'primary.main' }, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                    >
                        Intelligence Journal
                    </Button>

                    <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                        <Chip
                            label={article.category}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(59, 130, 246, 0.12)',
                                color: '#60a5fa',
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                borderRadius: '6px',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                            }}
                        />
                    </Stack>

                    {/* H1 — proper for SEO (previously h2) */}
                    <Typography variant="h3" component="h1" sx={{
                        fontWeight: 900,
                        mb: 3,
                        letterSpacing: '-0.025em',
                        lineHeight: 1.15,
                        fontSize: { xs: '1.75rem', md: '2.5rem' },
                    }}>
                        {article.title}
                    </Typography>

                    <Typography variant="body1" sx={{
                        color: 'text.secondary',
                        mb: 4,
                        lineHeight: 1.7,
                        fontSize: { xs: '0.95rem', md: '1.1rem' },
                        maxWidth: '90%',
                    }}>
                        {article.description}
                    </Typography>

                    {/* Meta strip: Date, Author, Reading Time, Share */}
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={{ xs: 2, sm: 4 }}
                        sx={{ color: 'text.secondary' }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Calendar size={14} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{article.date}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <User size={14} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{article.author}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Clock size={14} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{readingTime} min read</Typography>
                        </Box>
                        <Box sx={{ flexGrow: 1 }} />
                        <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Share on X/Twitter">
                                <IconButton
                                    size="small"
                                    onClick={handleShareTwitter}
                                    sx={{ color: 'text.secondary', '&:hover': { color: '#1da1f2' } }}
                                    aria-label="Share on X/Twitter"
                                >
                                    <Twitter size={16} aria-hidden="true" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Share on LinkedIn">
                                <IconButton
                                    size="small"
                                    onClick={handleShareLinkedIn}
                                    sx={{ color: 'text.secondary', '&:hover': { color: '#0077b5' } }}
                                    aria-label="Share on LinkedIn"
                                >
                                    <Linkedin size={16} aria-hidden="true" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Copy link">
                                <IconButton
                                    size="small"
                                    onClick={handleCopyLink}
                                    sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                                    aria-label="Copy link to clipboard"
                                >
                                    <LinkIcon size={16} aria-hidden="true" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            {/* ── Article Body ── */}
            <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
                <Box className="prose prose-invert max-w-none" sx={{
                    '& h1': { display: 'none' },
                    '& h2': {
                        fontWeight: 800, mt: 8, mb: 3, color: 'text.primary',
                        borderBottom: '1px solid rgba(255,255,255,0.06)', pb: 2,
                        fontSize: { xs: '1.3rem', md: '1.6rem' },
                        letterSpacing: '-0.01em',
                    },
                    '& h3': { fontWeight: 700, mt: 5, mb: 2, color: 'text.primary', fontSize: { xs: '1.1rem', md: '1.3rem' } },
                    '& p': {
                        mb: 3, lineHeight: 1.85, color: 'text.secondary',
                        fontSize: { xs: '0.95rem', md: '1.05rem' },
                    },
                    '& ul, & ol': { mb: 3, pl: 4, color: 'text.secondary' },
                    '& li': { mb: 1.5, lineHeight: 1.8 },
                    '& blockquote': {
                        borderLeft: '4px solid #3b82f6', pl: 3, py: 2, m: 0, mb: 4,
                        bgcolor: 'rgba(59, 130, 246, 0.04)',
                        borderRadius: '0 8px 8px 0',
                        fontStyle: 'italic',
                    },
                    '& strong': { color: 'text.primary', fontWeight: 800 },
                    '& code': {
                        bgcolor: 'rgba(255,255,255,0.06)', px: 1, py: 0.3, borderRadius: '4px',
                        fontSize: '0.85em', fontFamily: 'monospace',
                    },
                    '& a': {
                        color: '#60a5fa', textDecoration: 'underline',
                        textUnderlineOffset: '3px', '&:hover': { color: '#93bbfd' },
                    },
                    '& table': {
                        width: '100%', borderCollapse: 'collapse', mb: 4,
                        '& th': { bgcolor: 'rgba(255,255,255,0.05)', fontWeight: 700, p: 1.5, textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem' },
                        '& td': { p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' },
                    },
                }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {article.content}
                    </ReactMarkdown>
                </Box>

                <Divider sx={{ my: 6, opacity: 0.08 }} />

                {/* ── Author Bio Card ── */}
                <Box sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: '16px',
                    bgcolor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 3,
                }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontWeight: 800, fontSize: '1.2rem' }}>
                        {article.author.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                            {article.author}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            {article.author === 'Kartikay Sharma'
                                ? 'Chartered Accountant & macro analyst specializing in sovereign debt risk, India fiscal policy, and monetary regime transitions. 15+ years of institutional research experience.'
                                : 'GraphiQuestor Research team — institutional macro analysts specializing in emerging market volatility, sovereign risk, and monetary regime transitions.'
                            }
                        </Typography>
                    </Box>
                    <Button
                        component={Link}
                        to="/about"
                        variant="outlined"
                        size="small"
                        sx={{ borderColor: 'rgba(255,255,255,0.1)', fontWeight: 700, textTransform: 'none', whiteSpace: 'nowrap' }}
                    >
                        About Team
                    </Button>
                </Box>

                {/* ── Prev / Next Navigation ── */}
                {(prevArticle || nextArticle) && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 5 }}>
                        {prevArticle ? (
                            <Button
                                component={Link}
                                to={`/blog/${prevArticle.slug}`}
                                sx={{
                                    flex: 1, justifyContent: 'flex-start', textAlign: 'left', p: 2,
                                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                                }}
                                startIcon={<ArrowLeft size={14} />}
                            >
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.6rem' }}>Previous</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.3, textTransform: 'none' }}>{prevArticle.title.length > 50 ? prevArticle.title.slice(0, 50) + '…' : prevArticle.title}</Typography>
                                </Box>
                            </Button>
                        ) : <Box sx={{ flex: 1 }} />}
                        {nextArticle && (
                            <Button
                                component={Link}
                                to={`/blog/${nextArticle.slug}`}
                                sx={{
                                    flex: 1, justifyContent: 'flex-end', textAlign: 'right', p: 2,
                                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                                }}
                                endIcon={<ChevronRight size={14} />}
                            >
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.6rem' }}>Next</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.3, textTransform: 'none' }}>{nextArticle.title.length > 50 ? nextArticle.title.slice(0, 50) + '…' : nextArticle.title}</Typography>
                                </Box>
                            </Button>
                        )}
                    </Stack>
                )}

                {/* ── Related Articles ── */}
                {relatedArticles.length > 0 && (
                    <Box sx={{ mt: 8 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <BookOpen size={18} />
                            Continue Reading
                        </Typography>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {relatedArticles.map(related => (
                                <Link
                                    key={related.slug}
                                    to={`/blog/${related.slug}`}
                                    className="group block p-4 rounded-xl border border-white/[0.06] hover:border-blue-500/20 hover:bg-white/[0.02] transition-all duration-200"
                                >
                                    <Chip
                                        label={related.category}
                                        size="small"
                                        sx={{
                                            mb: 1.5, bgcolor: 'rgba(59,130,246,0.08)', color: '#60a5fa',
                                            fontWeight: 700, fontSize: '0.55rem', borderRadius: '4px',
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                        }}
                                    />
                                    <Typography variant="subtitle2" sx={{
                                        fontWeight: 700, mb: 1, lineHeight: 1.4,
                                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                    }}>
                                        {related.title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        {related.date} • {estimateReadingTime(related.content)} min
                                    </Typography>
                                </Link>
                            ))}
                        </div>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

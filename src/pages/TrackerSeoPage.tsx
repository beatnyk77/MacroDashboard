import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Box, Button, Chip, Container, Divider, Paper, Typography } from '@mui/material';
import { ArrowRight, Database, FileSearch, Link2, Network, Search } from 'lucide-react';
import { SEOManager } from '@/components/SEOManager';
import { TrailLink as Link } from '@/components/TrailLink';
import { AuthorPersonSchema, BrandConfig, PublisherOrganizationSchema } from '@/config/brandConfig';
import { findSeoTracker, seoTrackerHub, seoTrackerPages, type SeoTrackerPage } from '@/data/seoTrackers';

const publishedDate = '2026-08-31';

function trackerSchemas(page: SeoTrackerPage) {
  const pageUrl = `${BrandConfig.baseUrl}/trackers/${page.slug}`;
  const canonicalTarget = `${BrandConfig.baseUrl}${page.canonicalTarget}`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${pageUrl}#article`,
      headline: page.h1,
      description: page.metaDescription,
      url: pageUrl,
      datePublished: publishedDate,
      dateModified: publishedDate,
      author: AuthorPersonSchema,
      publisher: PublisherOrganizationSchema,
      mainEntityOfPage: pageUrl,
      keywords: page.keywords,
      about: page.keyword,
      isPartOf: {
        '@id': `${BrandConfig.baseUrl}/trackers#collection`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: `${page.h1} Source Map`,
      description: page.dek,
      url: pageUrl,
      creator: PublisherOrganizationSchema,
      isAccessibleForFree: true,
      measurementTechnique: page.sourceLine,
      variableMeasured: page.variablesMeasured,
      license: `${BrandConfig.baseUrl}/terms`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${BrandConfig.baseUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Trackers', item: `${BrandConfig.baseUrl}/trackers` },
        { '@type': 'ListItem', position: 3, name: page.h1, item: pageUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      name: page.h1,
      url: pageUrl,
      description: page.metaDescription,
      relatedLink: [canonicalTarget, ...page.relatedUrls.map((item) => `${BrandConfig.baseUrl}${item.href}`)],
      potentialAction: {
        '@type': 'ReadAction',
        target: canonicalTarget,
      },
    },
  ];
}

const HubCard: React.FC<{ page: SeoTrackerPage }> = ({ page }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      height: '100%',
      bgcolor: 'rgba(15,23,42,0.68)',
      border: '1px solid rgba(148,163,184,0.18)',
      borderRadius: 2,
    }}
  >
    <Typography component="h2" variant="h6" fontWeight={900} gutterBottom>
      {page.h1}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 2 }}>
      {page.dek}
    </Typography>
    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
      {page.variablesMeasured.slice(0, 3).map((variable) => (
        <Chip key={variable} size="small" label={variable} variant="outlined" sx={{ borderColor: 'rgba(148,163,184,0.22)' }} />
      ))}
    </Box>
    <Button component={Link} to={`/trackers/${page.slug}`} endIcon={<ArrowRight size={15} />} sx={{ px: 0, fontWeight: 800 }}>
      Open tracker page
    </Button>
  </Paper>
);

export const TrackerSeoIndexPage: React.FC = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${BrandConfig.baseUrl}/trackers#collection`,
    name: seoTrackerHub.title,
    description: seoTrackerHub.description,
    url: `${BrandConfig.baseUrl}/trackers`,
    publisher: PublisherOrganizationSchema,
    hasPart: seoTrackerPages.map((page) => ({
      '@type': 'WebPage',
      name: page.h1,
      url: `${BrandConfig.baseUrl}/trackers/${page.slug}`,
      about: page.keyword,
    })),
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 6, md: 8 } }}>
      <SEOManager
        title="Macro Tracker Pages"
        description={seoTrackerHub.description}
        keywords={seoTrackerPages.flatMap((page) => page.keywords)}
        canonical="/trackers"
        jsonLd={jsonLd}
      />

      <Container maxWidth="lg">
        <Box mb={5}>
          <Chip
            icon={<Search size={14} />}
            label="Low-competition macro pages"
            variant="outlined"
            sx={{ mb: 2, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}
          />
          <Typography component="h1" variant="h2" fontWeight={950} sx={{ letterSpacing: 0, mb: 2 }}>
            Macro tracker pages
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 820, lineHeight: 1.7, fontWeight: 400 }}>
            Narrow source-led pages for macro queries that deserve a direct answer, a canonical terminal link, and a clean citation path.
          </Typography>
        </Box>

        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }} gap={2.5}>
          {seoTrackerPages.map((page) => (
            <HubCard key={page.slug} page={page} />
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export const TrackerSeoPage: React.FC = () => {
  const { slug } = useParams();
  const page = findSeoTracker(slug);

  if (!page) {
    return <Navigate to="/trackers" replace />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 6, md: 8 } }}>
      <SEOManager
        title={page.title}
        description={page.metaDescription}
        keywords={page.keywords}
        canonical={`/trackers/${page.slug}`}
        publishedTime={publishedDate}
        lastModified={publishedDate}
        ogType="article"
        jsonLd={trackerSchemas(page)}
      />

      <Container maxWidth="md">
        <Box component="nav" display="flex" gap={1} alignItems="center" flexWrap="wrap" mb={4}>
          <Button component={Link} to="/trackers" startIcon={<ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />} sx={{ color: 'text.secondary' }}>
            Trackers
          </Button>
          <Typography variant="caption" color="text.disabled">/</Typography>
          <Typography variant="caption" color="text.secondary">{page.h1}</Typography>
        </Box>

        <Box mb={5}>
          <Chip
            icon={<FileSearch size={14} />}
            label={page.keyword}
            variant="outlined"
            sx={{ mb: 2, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}
          />
          <Typography component="h1" variant="h2" fontWeight={950} sx={{ letterSpacing: 0, mb: 2 }}>
            {page.h1}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.75, fontWeight: 400 }}>
            {page.dek}
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 3, bgcolor: 'rgba(15,23,42,0.68)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 2 }}>
          <Typography component="h2" variant="h5" fontWeight={900} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Database size={19} />
            Source Map
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8, mb: 2 }}>
            {page.sourceLine}
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {page.variablesMeasured.map((variable) => (
              <Chip key={variable} label={variable} size="small" variant="outlined" sx={{ borderColor: 'rgba(148,163,184,0.22)' }} />
            ))}
          </Box>
        </Paper>

        {page.sections.map((section) => (
          <Paper key={section.heading} elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 3, bgcolor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 2 }}>
            <Typography component="h2" variant="h5" fontWeight={900} gutterBottom>
              {section.heading}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
              {section.body}
            </Typography>
          </Paper>
        ))}

        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 3, bgcolor: 'rgba(2,6,23,0.72)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: 2 }}>
          <Typography component="h2" variant="h5" fontWeight={900} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Network size={19} />
            Canonical Terminal Link
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>
            This page is the query-focused entry point. The live terminal page remains the canonical workspace for data, freshness, methodology, and cross-market context.
          </Typography>
          <Button component={Link} to={page.canonicalTarget} variant="contained" endIcon={<ArrowRight size={16} />} sx={{ fontWeight: 900 }}>
            Open {page.canonicalTargetLabel}
          </Button>
        </Paper>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 3, bgcolor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 2 }}>
          <Typography component="h2" variant="h5" fontWeight={900} gutterBottom>
            FAQ
          </Typography>
          {page.faqs.map((faq, index) => (
            <Box key={faq.question}>
              {index > 0 && <Divider sx={{ my: 2.5 }} />}
              <Typography component="h3" variant="subtitle1" fontWeight={900} gutterBottom>
                {faq.question}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
                {faq.answer}
              </Typography>
            </Box>
          ))}
        </Paper>

        <Box display="flex" gap={1.5} flexWrap="wrap" mb={3}>
          {page.relatedUrls.map((item) => (
            <Button key={item.href} component={Link} to={item.href} variant="outlined" startIcon={<Link2 size={15} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>
              {item.label}
            </Button>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

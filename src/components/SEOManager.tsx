import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOManagerProps {
    title: string;
    description: string;
    keywords?: string[];
    ogImage?: string;
    ogType?: 'website' | 'article';
    canonicalUrl?: string;
    publishedTime?: string;
    jsonLd?: Record<string, any>;
    robots?: string;
}

export const SEOManager: React.FC<SEOManagerProps> = ({
    title,
    description,
    keywords,
    ogImage = 'https://graphiquestor.com/og-preview.png',
    ogType = 'website',
    canonicalUrl,
    publishedTime,
    jsonLd,
    robots = 'index, follow',
}) => {
    const location = useLocation();
    const fullTitle = `${title} | GraphiQuestor`;

    // Auto-generate canonical if not provided — self-referencing per Google best practice
    const resolvedCanonical = canonicalUrl || `https://graphiquestor.com${location.pathname}`;

    return (
        <Helmet>
            {/* Structured Data (JSON-LD) */}
            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}

            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords.join(', ')} />}
            <meta name="robots" content={robots} />

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={ogType} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={resolvedCanonical} />
            <meta property="og:site_name" content="GraphiQuestor" />
            <meta property="og:locale" content="en_IN" />
            <link rel="canonical" href={resolvedCanonical} />

            {/* Twitter */}
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:card" content="summary_large_image" />

            {/* Article Schema */}
            {ogType === 'article' && publishedTime && (
                <meta property="article:published_time" content={publishedTime} />
            )}
            <meta name="geo.region" content="IN" />
            <meta name="target_country" content="IN" />

            {/* Optimized Hreflang for Core Institutional Focus */}
            <link rel="alternate" href={resolvedCanonical} hrefLang="en-IN" />
            <link rel="alternate" href={resolvedCanonical} hrefLang="en-US" />
            <link rel="alternate" href={resolvedCanonical} hrefLang="en-GB" />
            <link rel="alternate" href={resolvedCanonical} hrefLang="x-default" />
        </Helmet>
    );
};


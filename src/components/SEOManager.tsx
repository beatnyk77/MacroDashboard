import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOManagerProps {
    title: string;
    description: string;
    keywords?: string[];
    ogImage?: string;
    ogType?: 'website' | 'article';
    canonicalUrl?: string;
    publishedTime?: string;
    jsonLd?: Record<string, any>;
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
}) => {
    const fullTitle = `${title} | GraphiQuestor`;

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

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={ogType} />
            <meta property="og:image" content={ogImage} />
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

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
            <link rel="alternate" href="https://graphiquestor.com/" hrefLang="en-IN" />
            <link rel="alternate" href="https://graphiquestor.com/" hrefLang="en-US" />
            <link rel="alternate" href="https://graphiquestor.com/" hrefLang="en-GB" />
            <link rel="alternate" href="https://graphiquestor.com/" hrefLang="x-default" />
        </Helmet>
    );
};

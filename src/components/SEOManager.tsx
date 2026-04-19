import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOManagerProps {
    title: string;
    description: string;
    keywords?: string[];
    ogImage?: string;
    ogType?: 'website' | 'article';
    ogLocale?: string;
    canonicalUrl?: string;
    publishedTime?: string;
    jsonLd?: Record<string, any> | any[];
    robots?: string;
    isApp?: boolean;
    geoRegion?: string;
    targetCountry?: string;
}

export const SEOManager: React.FC<SEOManagerProps> = ({
    title,
    description,
    keywords,
    ogImage = 'https://graphiquestor.com/hero-preview.jpg',
    ogType = 'website',
    ogLocale = 'en_US',
    canonicalUrl,
    publishedTime,
    jsonLd,
    robots = 'index, follow',
    isApp = false,
    geoRegion = 'GLOBAL',
    targetCountry = 'GLOBAL',
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

            {isApp && (
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "@id": "https://graphiquestor.com/#software",
                        "name": "GraphiQuestor Macro Intelligence Terminal",
                        "operatingSystem": "All",
                        "applicationCategory": "FinanceApplication",
                        "description": description,
                        "url": "https://graphiquestor.com/",
                        "author": {
                            "@id": "https://graphiquestor.com/#organization"
                        },
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD",
                            "availability": "https://schema.org/InStock"
                        },
                        "featureList": [
                            "Real-time Global Liquidity Tracking",
                            "Sovereign Stress Monitoring",
                            "India/China Macro Intelligence",
                            "Institutional Data Visualization"
                        ]
                    })}
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
            <meta property="og:locale" content={ogLocale} />
            <link rel="canonical" href={resolvedCanonical} />

            {/* Twitter */}
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:image" content={ogImage} />
            <meta name="twitter:site" content="@GraphiQuestor" />
            <meta name="twitter:creator" content="@GraphiQuestor" />

            {/* Article Schema */}
            {ogType === 'article' && publishedTime && (
                <meta property="article:published_time" content={publishedTime} />
            )}
            
            <meta name="geo.region" content={geoRegion} />
            <meta name="target_country" content={targetCountry} />
        </Helmet>
    );
};

